import { Prisma } from '@prisma/client';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  initAuthCreds,
  BufferJSON,
  Browsers,
  type AuthenticationState,
  type SignalDataTypeMap,
  type SignalDataSet,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import prisma from '../lib/prisma';

const logger = pino({ level: 'silent' });
const activeSockets = new Map<string, ReturnType<typeof makeWASocket>>();
const connectingLocks = new Map<string, Promise<void>>();

async function persistAuth(
  instanceName: string,
  creds: AuthenticationState['creds'],
  keysJson: Record<string, string>
) {
  await prisma.whatsAppSession.upsert({
    where: { instanceName },
    create: {
      instanceName,
      authState: {
        creds: JSON.stringify(creds, BufferJSON.replacer),
        keys: keysJson,
      },
    },
    update: {
      authState: {
        creds: JSON.stringify(creds, BufferJSON.replacer),
        keys: keysJson,
      },
    },
  });
}

async function readAuthState(instanceName: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  const row = await prisma.whatsAppSession.findUnique({ where: { instanceName } });
  let creds = initAuthCreds();
  const keysJson: Record<string, string> = {};

  if (row?.authState && typeof row.authState === 'object') {
    const stored = row.authState as { creds?: string; keys?: Record<string, string> };
    if (stored.creds) {
      creds = JSON.parse(stored.creds, BufferJSON.replacer);
    }
    if (stored.keys) {
      Object.assign(keysJson, stored.keys);
    }
  }

  const keyStore = {
    get: async <T extends keyof SignalDataTypeMap>(
      type: T,
      ids: string[]
    ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
      const result: { [id: string]: SignalDataTypeMap[T] } = {};
      for (const id of ids) {
        const val = keysJson[`${type}-${id}`];
        if (val) {
          result[id] = JSON.parse(val, BufferJSON.replacer);
        }
      }
      return result;
    },
    set: async (data: SignalDataSet): Promise<void> => {
      for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
        const bucket = data[category];
        if (!bucket) continue;
        for (const id of Object.keys(bucket)) {
          const value = bucket[id];
          const key = `${category}-${id}`;
          if (value) {
            keysJson[key] = JSON.stringify(value, BufferJSON.replacer);
          } else {
            delete keysJson[key];
          }
        }
      }
      await persistAuth(instanceName, creds, keysJson);
    },
  };

  const saveCreds = async () => {
    await persistAuth(instanceName, creds, keysJson);
  };

  return {
    state: {
      creds,
      keys: makeCacheableSignalKeyStore(keyStore, logger),
    },
    saveCreds,
  };
}

function normalizeName(instanceName: string): string {
  return instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

function extractPhone(sock: ReturnType<typeof makeWASocket>): string | undefined {
  return sock.user?.id?.split(':')[0]?.split('@')[0];
}

async function updateSession(
  instanceName: string,
  data: Partial<{
    status: string;
    phone: string | null;
    lastQr: string | null;
    authState: typeof Prisma.DbNull | object;
  }>
) {
  await prisma.whatsAppSession.upsert({
    where: { instanceName },
    create: { instanceName, ...data },
    update: data,
  });
}

/** Mantiene el socket vivo — reconecta tras escanear QR (flujo normal de Baileys) */
async function connectSocket(instanceName: string): Promise<void> {
  const name = normalizeName(instanceName);
  if (!name) throw new Error('Nombre de instancia inválido');

  if (activeSockets.has(name)) return;

  const existingLock = connectingLocks.get(name);
  if (existingLock) {
    await existingLock;
    return;
  }

  const connectPromise = (async () => {
    await updateSession(name, { status: 'connecting' });

    const { state, saveCreds } = await readAuthState(name);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: Browsers.macOS('Caperucitas'),
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
    });

    activeSockets.set(name, sock);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr);
          const raw = dataUrl.replace(/^data:image\/png;base64,/, '');
          await updateSession(name, { status: 'qr', lastQr: raw });
          console.log(`[WhatsApp:${name}] QR generado`);
        } catch (err) {
          console.error(`[WhatsApp:${name}] Error QR:`, err);
        }
      }

      if (connection === 'open') {
        const phone = extractPhone(sock);
        await updateSession(name, { status: 'connected', phone: phone || null, lastQr: null });
        console.log(`[WhatsApp:${name}] Conectado: +${phone}`);
      }

      if (connection === 'close') {
        activeSockets.delete(name);
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;

        console.log(`[WhatsApp:${name}] Conexión cerrada, código: ${code}`);

        if (loggedOut) {
          await updateSession(name, {
            status: 'disconnected',
            phone: null,
            lastQr: null,
            authState: Prisma.DbNull,
          });
          return;
        }

        // Tras escanear QR, Baileys cierra y reconecta — esto es NORMAL
        await updateSession(name, { status: 'connecting', lastQr: null });
        setTimeout(() => {
          connectSocket(name).catch((err) =>
            console.error(`[WhatsApp:${name}] Reconexión fallida:`, err.message)
          );
        }, 2000);
      }
    });
  })();

  connectingLocks.set(name, connectPromise);
  try {
    await connectPromise;
  } finally {
    connectingLocks.delete(name);
  }
}

export async function startBuiltinInstance(instanceName: string): Promise<{
  qrBase64?: string;
  connected: boolean;
  phone?: string;
  error?: string;
}> {
  const name = normalizeName(instanceName);
  if (!name) return { connected: false, error: 'Nombre de instancia inválido' };

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (session?.status === 'connected' && session.phone) {
    if (!activeSockets.has(name)) {
      connectSocket(name).catch(console.error);
    }
    return { connected: true, phone: session.phone };
  }

  try {
    await connectSocket(name);

    // Esperar QR o conexión (hasta 25s)
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const current = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
      if (current?.status === 'connected' && current.phone) {
        return { connected: true, phone: current.phone };
      }
      if (current?.lastQr) {
        return { connected: false, qrBase64: current.lastQr };
      }
    }

    const final = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (final?.lastQr) return { connected: false, qrBase64: final.lastQr };
    if (final?.status === 'connected') return { connected: true, phone: final.phone || undefined };

    return { connected: false, error: 'Generando QR... Pulsa Actualizar o Renovar QR.' };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
}

export async function getBuiltinStatus(instanceName: string) {
  const name = normalizeName(instanceName);
  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  const connected =
    (session?.status === 'connected' && !!session.phone) ||
    (activeSockets.has(name) && !!extractPhone(activeSockets.get(name)!));

  return {
    configured: true,
    connected,
    instanceName: name,
    state: session?.status || 'disconnected',
    owner: session?.phone || undefined,
  };
}

export async function getBuiltinQr(instanceName: string) {
  const name = normalizeName(instanceName);
  const status = await getBuiltinStatus(name);
  if (status.connected) {
    return { success: true, connected: true, owner: status.owner };
  }

  // Siempre iniciar/reanudar socket — no devolver QR caducado sin conexión activa
  if (!activeSockets.has(name)) {
    connectSocket(name).catch(console.error);
  }

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status === 'connected' && session.phone) {
      return { success: true, connected: true, owner: session.phone };
    }
    if (session?.lastQr) {
      return { success: true, base64: session.lastQr };
    }
  }

  return { success: false, error: 'No se pudo generar QR. Pulsa Renovar QR.' };
}

export async function sendBuiltinMessage(
  instanceName: string,
  phone: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const name = normalizeName(instanceName);
  let sock = activeSockets.get(name);

  if (!sock) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status !== 'connected') {
      return { success: false, error: 'WhatsApp no conectado. Escanea el QR en el panel admin.' };
    }
    await connectSocket(name);
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      sock = activeSockets.get(name);
      if (sock?.user) break;
    }
  }

  if (!sock?.user) {
    return { success: false, error: 'No hay conexión activa con WhatsApp. Reconecta desde el panel.' };
  }

  try {
    const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listBuiltinInstances() {
  const sessions = await prisma.whatsAppSession.findMany({ orderBy: { updatedAt: 'desc' } });
  if (sessions.length === 0) {
    const defaultName = process.env.WHATSAPP_INSTANCE_NAME || 'caperucitas';
    return [{ name: defaultName, connected: false, state: 'disconnected' }];
  }
  return sessions.map((s) => ({
    name: s.instanceName,
    connected: s.status === 'connected' || activeSockets.has(s.instanceName),
    state: s.status,
    owner: s.phone || undefined,
  }));
}

export async function restartBuiltinInstance(instanceName: string) {
  const name = normalizeName(instanceName);
  if (activeSockets.has(name)) {
    try {
      await activeSockets.get(name)?.logout();
    } catch {
      activeSockets.get(name)?.end(undefined);
    }
    activeSockets.delete(name);
  }
  connectingLocks.delete(name);
  await prisma.whatsAppSession.upsert({
    where: { instanceName: name },
    create: { instanceName: name, status: 'disconnected' },
    update: { status: 'disconnected', phone: null, lastQr: null, authState: Prisma.DbNull },
  });
  return startBuiltinInstance(name);
}

export async function restoreBuiltinSessions() {
  const sessions = await prisma.whatsAppSession.findMany({
    where: { status: { in: ['connected', 'connecting'] } },
  });
  for (const s of sessions) {
    connectSocket(s.instanceName).catch((err) =>
      console.warn(`WhatsApp restore ${s.instanceName}:`, err.message)
    );
  }
}
