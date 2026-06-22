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
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import prisma from '../lib/prisma';
import { resolveWhatsAppImagePayload } from '../utils/whatsapp-image.utils';

const logger = pino({ level: 'warn' });
const activeSockets = new Map<string, WASocket>();
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
      authState: { creds: JSON.stringify(creds, BufferJSON.replacer), keys: keysJson },
    },
    update: {
      authState: { creds: JSON.stringify(creds, BufferJSON.replacer), keys: keysJson },
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
      try {
        creds = JSON.parse(stored.creds, BufferJSON.replacer);
      } catch {
        creds = initAuthCreds();
      }
    }
    if (stored.keys) Object.assign(keysJson, stored.keys);
  }

  const keyStore = {
    get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
      const result: { [id: string]: SignalDataTypeMap[T] } = {};
      for (const id of ids) {
        const val = keysJson[`${type}-${id}`];
        if (val) result[id] = JSON.parse(val, BufferJSON.replacer);
      }
      return result;
    },
    set: async (data: SignalDataSet) => {
      for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
        const bucket = data[category];
        if (!bucket) continue;
        for (const id of Object.keys(bucket)) {
          const value = bucket[id];
          const key = `${category}-${id}`;
          if (value) keysJson[key] = JSON.stringify(value, BufferJSON.replacer);
          else delete keysJson[key];
        }
      }
      await persistAuth(instanceName, creds, keysJson);
    },
  };

  return {
    state: { creds, keys: makeCacheableSignalKeyStore(keyStore, logger) },
    saveCreds: async () => persistAuth(instanceName, creds, keysJson),
  };
}

function normalizeName(instanceName: string): string {
  return instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

function extractPhone(sock?: WASocket | null): string | undefined {
  return sock?.user?.id?.split(':')[0]?.split('@')[0];
}

async function updateSession(
  instanceName: string,
  data: Partial<{ status: string; phone: string | null; lastQr: string | null; authState: object | null }>
) {
  const payload = { ...data };
  if (payload.authState === null) {
    await prisma.whatsAppSession.upsert({
      where: { instanceName },
      create: { instanceName, status: data.status || 'disconnected' },
      update: { ...data, authState: Prisma.DbNull },
    });
    return;
  }
  await prisma.whatsAppSession.upsert({
    where: { instanceName },
    create: { instanceName, ...payload },
    update: payload,
  });
}

async function getBaileysVersion(): Promise<[number, number, number] | undefined> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const { version } = await fetchLatestBaileysVersion({ signal: ctrl.signal });
    clearTimeout(timer);
    return version;
  } catch (err) {
    console.warn('[WhatsApp] fetchLatestBaileysVersion falló, usando versión por defecto:', err);
    return undefined;
  }
}

/** Cierra socket y limpia estado en memoria */
export async function disconnectSocket(instanceName: string): Promise<void> {
  const name = normalizeName(instanceName);
  const sock = activeSockets.get(name);
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.end(new Error('disconnect'));
    } catch {
      /* ignore */
    }
    activeSockets.delete(name);
  }
  connectingLocks.delete(name);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForQrOrConnected(name: string, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status === 'connected' && session.phone) {
      return { connected: true as const, phone: session.phone };
    }
    if (session?.lastQr) {
      return { connected: false as const, qrBase64: session.lastQr };
    }
    await sleep(800);
  }
  return null;
}

/** Inicia socket Baileys y mantiene reconexión tras escanear QR */
async function connectSocket(instanceName: string, force = false): Promise<void> {
  const name = normalizeName(instanceName);
  if (!name) throw new Error('Nombre de instancia inválido');

  if (force) await disconnectSocket(name);

  const existing = activeSockets.get(name);
  if (existing?.user) return;

  // No matar socket en pairing (sin user aún) — eso invalida el QR escaneado
  if (existing && !force) {
    return;
  }

  const lock = connectingLocks.get(name);
  if (lock) {
    await lock;
    if (activeSockets.get(name)?.user) return;
    if (activeSockets.get(name) && !force) return;
  }

  const connectPromise = (async () => {
    await updateSession(name, { status: 'connecting' });

    const version = await getBaileysVersion();
    const { state, saveCreds } = await readAuthState(name);

    const sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: Browsers.macOS('Desktop'),
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 500,
    });

    activeSockets.set(name, sock);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin } = update;

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          const raw = dataUrl.replace(/^data:image\/png;base64,/, '');
          await updateSession(name, { status: 'qr', lastQr: raw });
          console.log(`[WhatsApp:${name}] QR generado (${raw.length} bytes)`);
        } catch (err) {
          console.error(`[WhatsApp:${name}] Error generando imagen QR:`, err);
        }
      }

      if (connection === 'open') {
        const phone = extractPhone(sock);
        await updateSession(name, { status: 'connected', phone: phone || null, lastQr: null });
        console.log(`[WhatsApp:${name}] Conectado +${phone}${isNewLogin ? ' (nuevo login)' : ''}`);
      }

      if (connection === 'close') {
        activeSockets.delete(name);
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        const restartRequired = code === DisconnectReason.restartRequired;
        const replaced = code === DisconnectReason.connectionReplaced;
        console.log(`[WhatsApp:${name}] Cerrado código=${code}`);

        if (loggedOut || replaced) {
          await updateSession(name, {
            status: 'disconnected',
            phone: null,
            lastQr: null,
            authState: null,
          });
          return;
        }

        // Tras escanear QR, Baileys cierra y reconecta — normal
        await updateSession(name, { status: 'connecting', lastQr: null });
        setTimeout(() => {
          connectSocket(name, false).catch((e) =>
            console.error(`[WhatsApp:${name}] Reconexión:`, e.message)
          );
        }, restartRequired ? 800 : 2000);
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

export async function startBuiltinInstance(
  instanceName: string,
  force = false
): Promise<{ qrBase64?: string; connected: boolean; phone?: string; error?: string }> {
  const name = normalizeName(instanceName);
  if (!name) return { connected: false, error: 'Nombre de instancia inválido' };

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (!force && session?.status === 'connected' && session.phone) {
    if (!activeSockets.get(name)?.user) connectSocket(name).catch(console.error);
    return { connected: true, phone: session.phone };
  }

  try {
    await connectSocket(name, force);
    const result = await waitForQrOrConnected(name, 45000);

    if (result?.connected) return { connected: true, phone: result.phone };
    if (result?.qrBase64) return { connected: false, qrBase64: result.qrBase64 };

    const last = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (last?.lastQr) return { connected: false, qrBase64: last.lastQr };

    return {
      connected: false,
      error:
        'No se generó QR. Pulsa «Renovar QR» para limpiar la sesión e intentar de nuevo.',
    };
  } catch (err: any) {
    console.error(`[WhatsApp:${name}] startBuiltinInstance:`, err);
    return { connected: false, error: err.message || 'Error al conectar WhatsApp' };
  }
}

export async function getBuiltinStatus(instanceName: string) {
  const name = normalizeName(instanceName);
  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  const sock = activeSockets.get(name);
  const connected = (session?.status === 'connected' && !!session.phone) || !!sock?.user;

  return {
    configured: true,
    connected,
    instanceName: name,
    state: session?.status || 'disconnected',
    owner: session?.phone || extractPhone(sock) || undefined,
  };
}

/** Solo lectura: no inicia sockets ni regenera QR */
export async function getBuiltinSessionView(instanceName: string) {
  const name = normalizeName(instanceName);
  const status = await getBuiltinStatus(name);
  if (status.connected) {
    return { success: true, connected: true, owner: status.owner, state: status.state };
  }

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (session?.lastQr && (session.status === 'qr' || session.status === 'connecting')) {
    return {
      success: true,
      connected: false,
      base64: session.lastQr,
      state: session.status,
      pairing: session.status === 'connecting' && !session.phone,
    };
  }

  return {
    success: false,
    connected: false,
    state: session?.status || 'disconnected',
    error: 'No hay QR activo. Pulsa «Conectar» o «Renovar QR».',
  };
}

export async function getBuiltinQr(instanceName: string) {
  return getBuiltinSessionView(instanceName);
}

export async function sendBuiltinMessage(
  instanceName: string,
  phone: string,
  text: string,
  imageUrl?: string
) {
  const name = normalizeName(instanceName);
  let sock = activeSockets.get(name);

  if (!sock?.user) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status !== 'connected') {
      return { success: false, error: 'WhatsApp no conectado. Escanea el QR primero.' };
    }
    await connectSocket(name);
    for (let i = 0; i < 20; i++) {
      await sleep(1000);
      sock = activeSockets.get(name);
      if (sock?.user) break;
    }
  }

  if (!sock?.user) {
    return { success: false, error: 'Sin conexión activa. Reconecta desde el panel.' };
  }

  const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
  const caption = text?.trim() || undefined;

  try {
    if (imageUrl?.trim()) {
      const imagePayload = await resolveWhatsAppImagePayload(imageUrl);
      if (imagePayload.buffer) {
        await sock.sendMessage(jid, { image: imagePayload.buffer, caption, mimetype: imagePayload.mimetype });
      } else {
        await sock.sendMessage(jid, { image: { url: imagePayload.url! }, caption });
      }
    } else {
      if (!caption) {
        return { success: false, error: 'El mensaje no puede estar vacío' };
      }
      await sock.sendMessage(jid, { text: caption });
    }
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
    connected: s.status === 'connected' || !!activeSockets.get(s.instanceName)?.user,
    state: s.status,
    owner: s.phone || undefined,
  }));
}

export async function restartBuiltinInstance(instanceName: string) {
  const name = normalizeName(instanceName);
  await disconnectSocket(name);
  await prisma.whatsAppSession.upsert({
    where: { instanceName: name },
    create: { instanceName: name, status: 'disconnected' },
    update: { status: 'disconnected', phone: null, lastQr: null, authState: Prisma.DbNull },
  });
  return startBuiltinInstance(name, true);
}

export async function restoreBuiltinSessions() {
  const sessions = await prisma.whatsAppSession.findMany({
    where: { status: 'connected' },
  });
  for (const s of sessions) {
    connectSocket(s.instanceName).catch((err) =>
      console.warn(`WhatsApp restore ${s.instanceName}:`, err.message)
    );
  }
}
