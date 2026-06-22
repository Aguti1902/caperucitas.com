import { Prisma } from '@prisma/client';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  initAuthCreds,
  BufferJSON,
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
const startingInstances = new Set<string>();

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
      creds = JSON.parse(stored.creds, BufferJSON.reviver);
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
          result[id] = JSON.parse(val, BufferJSON.reviver);
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

function extractPhone(sock: ReturnType<typeof makeWASocket>): string | undefined {
  return sock.user?.id?.split(':')[0]?.split('@')[0];
}

export async function startBuiltinInstance(instanceName: string): Promise<{
  qrBase64?: string;
  connected: boolean;
  phone?: string;
  error?: string;
}> {
  const name = instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  if (!name) return { connected: false, error: 'Nombre de instancia inválido' };

  const existing = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (existing?.status === 'connected' && existing.phone && activeSockets.has(name)) {
    return { connected: true, phone: existing.phone };
  }

  if (existing?.lastQr && existing.status === 'qr') {
    return { connected: false, qrBase64: existing.lastQr };
  }

  if (startingInstances.has(name)) {
    await new Promise((r) => setTimeout(r, 2000));
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status === 'connected') return { connected: true, phone: session.phone || undefined };
    if (session?.lastQr) return { connected: false, qrBase64: session.lastQr };
    return { connected: false, error: 'Conexión en progreso, inténtalo de nuevo' };
  }

  startingInstances.add(name);

  try {
    await prisma.whatsAppSession.upsert({
      where: { instanceName: name },
      create: { instanceName: name, status: 'connecting' },
      update: { status: 'connecting' },
    });

    if (activeSockets.has(name)) {
      activeSockets.get(name)?.end(undefined);
      activeSockets.delete(name);
    }

    const { state, saveCreds } = await readAuthState(name);
    const { version } = await fetchLatestBaileysVersion();

    return await new Promise((resolve) => {
      let settled = false;
      const done = (result: { qrBase64?: string; connected: boolean; phone?: string; error?: string }) => {
        if (settled) return;
        settled = true;
        startingInstances.delete(name);
        resolve(result);
      };

      const sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      activeSockets.set(name, sock);
      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const dataUrl = await QRCode.toDataURL(qr);
            const raw = dataUrl.replace(/^data:image\/png;base64,/, '');
            await prisma.whatsAppSession.update({
              where: { instanceName: name },
              data: { status: 'qr', lastQr: raw },
            });
            done({ connected: false, qrBase64: raw });
          } catch (err: any) {
            done({ connected: false, error: err.message });
          }
        }

        if (connection === 'open') {
          const phone = extractPhone(sock);
          await prisma.whatsAppSession.update({
            where: { instanceName: name },
            data: { status: 'connected', phone, lastQr: null },
          });
          done({ connected: true, phone });
        }

        if (connection === 'close') {
          const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
          activeSockets.delete(name);
          const loggedOut = code === DisconnectReason.loggedOut;
          await prisma.whatsAppSession.update({
            where: { instanceName: name },
            data: {
              status: loggedOut ? 'disconnected' : 'connecting',
              ...(loggedOut ? { phone: null, lastQr: null } : {}),
            },
          });
          if (!loggedOut && !settled) {
            setTimeout(() => startBuiltinInstance(name).catch(console.error), 4000);
          }
          if (!settled) {
            done({
              connected: false,
              error: loggedOut ? 'Sesión cerrada. Vuelve a escanear el QR.' : 'Conexión perdida, reconectando...',
            });
          }
        }
      });

      setTimeout(() => {
        done({ connected: false, error: 'Tiempo de espera agotado. Pulsa de nuevo para generar QR.' });
      }, 45000);
    });
  } catch (err: any) {
    startingInstances.delete(name);
    return { connected: false, error: err.message };
  }
}

export async function getBuiltinStatus(instanceName: string) {
  const name = instanceName.trim().toLowerCase();
  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  const connected = session?.status === 'connected' && !!session.phone;
  return {
    configured: true,
    connected,
    instanceName: name,
    state: session?.status || 'disconnected',
    owner: session?.phone || undefined,
  };
}

export async function getBuiltinQr(instanceName: string) {
  const name = instanceName.trim().toLowerCase();
  const status = await getBuiltinStatus(name);
  if (status.connected) {
    return { success: true, connected: true, owner: status.owner };
  }
  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (session?.lastQr) {
    return { success: true, base64: session.lastQr };
  }
  const start = await startBuiltinInstance(name);
  if (start.connected) return { success: true, connected: true, owner: start.phone };
  if (start.qrBase64) return { success: true, base64: start.qrBase64 };
  return { success: false, error: start.error || 'No se pudo generar QR' };
}

export async function sendBuiltinMessage(
  instanceName: string,
  phone: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const name = instanceName.trim().toLowerCase();
  let sock = activeSockets.get(name);

  if (!sock) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status !== 'connected') {
      return { success: false, error: 'WhatsApp no conectado. Escanea el QR en el panel admin.' };
    }
    await startBuiltinInstance(name);
    await new Promise((r) => setTimeout(r, 3000));
    sock = activeSockets.get(name);
  }

  if (!sock) {
    return { success: false, error: 'No hay conexión activa con WhatsApp' };
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
    connected: s.status === 'connected',
    state: s.status,
    owner: s.phone || undefined,
  }));
}

export async function restartBuiltinInstance(instanceName: string) {
  const name = instanceName.trim().toLowerCase();
  if (activeSockets.has(name)) {
    activeSockets.get(name)?.logout();
    activeSockets.delete(name);
  }
  await prisma.whatsAppSession.upsert({
    where: { instanceName: name },
    create: { instanceName: name, status: 'disconnected' },
    update: { status: 'disconnected', phone: null, lastQr: null, authState: Prisma.DbNull },
  });
  return startBuiltinInstance(name);
}

/** Reconectar sesiones guardadas en Supabase al arrancar el servidor */
export async function restoreBuiltinSessions() {
  const sessions = await prisma.whatsAppSession.findMany({
    where: { status: 'connected' },
  });
  for (const s of sessions) {
    startBuiltinInstance(s.instanceName).catch((err) =>
      console.warn(`WhatsApp restore ${s.instanceName}:`, err.message)
    );
  }
}
