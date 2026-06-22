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
const pairingModeInstances = new Set<string>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Mínimo entre intentos de vinculación nueva (no aplica a reconexión automática) */
const LINK_COOLDOWN_MS = 3 * 60 * 1000;

let cachedWaVersion: [number, number, number] | undefined;

interface ConnectOptions {
  pairingPhone?: string;
}

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
  keysJson: Record<string, string>;
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
    keysJson,
  };
}

async function isRegisteredInDb(instanceName: string): Promise<boolean> {
  const row = await prisma.whatsAppSession.findUnique({ where: { instanceName } });
  if (!row?.authState || typeof row.authState !== 'object') return false;
  const stored = row.authState as { creds?: string };
  if (!stored.creds) return false;
  try {
    const creds = JSON.parse(stored.creds, BufferJSON.replacer);
    return Boolean(creds.registered);
  } catch {
    return false;
  }
}

function normalizeName(instanceName: string): string {
  return instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

function extractPhone(sock?: WASocket | null): string | undefined {
  return sock?.user?.id?.split(':')[0]?.split('@')[0];
}

async function updateSession(
  instanceName: string,
  data: Partial<{
    status: string;
    phone: string | null;
    lastQr: string | null;
    lastPairingCode: string | null;
    pairingPhone: string | null;
    lastLinkAttemptAt: Date;
    authState: object | null;
  }>
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
  if (cachedWaVersion) return cachedWaVersion;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const { version } = await fetchLatestBaileysVersion({ signal: ctrl.signal });
    clearTimeout(timer);
    cachedWaVersion = version;
    console.log('[WhatsApp] Versión WA:', version.join('.'));
    return version;
  } catch (err) {
    console.warn('[WhatsApp] fetchLatestBaileysVersion falló:', err);
    return undefined;
  }
}

function clearReconnectTimer(name: string) {
  const t = reconnectTimers.get(name);
  if (t) {
    clearTimeout(t);
    reconnectTimers.delete(name);
  }
}

/** Cierra socket y limpia estado en memoria */
export async function disconnectSocket(instanceName: string): Promise<void> {
  const name = normalizeName(instanceName);
  clearReconnectTimer(name);
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

function waitForSocketReady(sock: WASocket, timeoutMs = 45000): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    const handler = (update: { connection?: string }) => {
      if (update.connection === 'connecting' || update.connection === 'open') {
        clearTimeout(timer);
        sock.ev.off('connection.update', handler);
        resolve(true);
      }
    };
    sock.ev.on('connection.update', handler);
  });
}

async function waitForRegisteredInDb(instanceName: string, maxMs = 20000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await isRegisteredInDb(instanceName)) return true;
    await sleep(500);
  }
  return false;
}

async function scheduleReconnect(name: string, delayMs: number, options: ConnectOptions = {}) {
  clearReconnectTimer(name);
  const timer = setTimeout(async () => {
    reconnectTimers.delete(name);
    try {
      connectingLocks.delete(name);
      await disconnectSocket(name);
      await sleep(2000);

      const registered = await waitForRegisteredInDb(name, 20000);
      if (registered) {
        console.log(`[WhatsApp:${name}] Reconectando con sesión guardada...`);
        await connectSocket(name, false, {});
        return;
      }

      const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
      const pairingPhone = options.pairingPhone || session?.pairingPhone?.replace(/\D/g, '');
      if (pairingPhone && (session?.status === 'pairing' || session?.status === 'connecting')) {
        console.log(`[WhatsApp:${name}] Reconectando para mantener vinculación activa...`);
        pairingModeInstances.add(name);
        await connectSocket(name, false, { pairingPhone });
        return;
      }

      console.log(`[WhatsApp:${name}] Sin sesión registrada tras cierre`);
      await updateSession(name, { status: 'pairing' });
    } catch (err: any) {
      console.error(`[WhatsApp:${name}] Error en reconexión:`, err.message);
    }
  }, delayMs);
  reconnectTimers.set(name, timer);
}

async function waitForQrOrConnected(name: string, timeoutMs = 40000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status === 'connected' && session.phone) {
      return { connected: true as const, phone: session.phone };
    }
    if (session?.lastPairingCode && session.status === 'pairing') {
      return {
        connected: false as const,
        pairingCode: session.lastPairingCode,
        pairingPhone: session.pairingPhone || undefined,
      };
    }
    if (session?.lastQr) {
      return { connected: false as const, qrBase64: session.lastQr };
    }
    await sleep(800);
  }
  return null;
}

function formatPairingCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

export function checkLinkCooldown(
  instanceName: string,
  session: { lastLinkAttemptAt: Date | null } | null
): string | null {
  if (!session?.lastLinkAttemptAt) return null;
  const elapsed = Date.now() - session.lastLinkAttemptAt.getTime();
  if (elapsed >= LINK_COOLDOWN_MS) return null;
  const mins = Math.ceil((LINK_COOLDOWN_MS - elapsed) / 60000);
  return `Espera ${mins} min antes de otro intento. WhatsApp bloquea si se intenta vincular muchas veces seguidas.`;
}

/** Inicia socket Baileys */
async function connectSocket(instanceName: string, force = false, options: ConnectOptions = {}): Promise<void> {
  const name = normalizeName(instanceName);
  if (!name) throw new Error('Nombre de instancia inválido');

  if (force) {
    pairingModeInstances.delete(name);
    await disconnectSocket(name);
  }

  const existing = activeSockets.get(name);
  if (existing?.user) return;
  if (existing && !force) return;

  const lock = connectingLocks.get(name);
  if (lock) {
    await lock;
    if (activeSockets.get(name)?.user) return;
    if (activeSockets.get(name) && !force) return;
  }

  const pairingPhone = options.pairingPhone?.replace(/\D/g, '');
  if (pairingPhone) pairingModeInstances.add(name);

  const connectPromise = (async () => {
    const registeredAlready = await isRegisteredInDb(name);

    if (!registeredAlready) {
      await updateSession(name, {
        status: pairingPhone ? 'connecting' : 'connecting',
        lastLinkAttemptAt: pairingPhone ? new Date() : undefined,
        ...(pairingPhone
          ? { lastQr: null, lastPairingCode: null, pairingPhone }
          : { lastPairingCode: null, pairingPhone: null }),
      });
    } else {
      await updateSession(name, { status: 'connecting' });
    }

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
      connectTimeoutMs: 90000,
      defaultQueryTimeoutMs: 90000,
      retryRequestDelayMs: 3000,
      keepAliveIntervalMs: 30000,
    });

    activeSockets.set(name, sock);

    sock.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (err: any) {
        console.error(`[WhatsApp:${name}] Error guardando creds:`, err.message);
      }
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin } = update;

      if (qr && !pairingModeInstances.has(name)) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          const raw = dataUrl.replace(/^data:image\/png;base64,/, '');
          await updateSession(name, { status: 'qr', lastQr: raw });
        } catch (err) {
          console.error(`[WhatsApp:${name}] Error QR:`, err);
        }
      }

      if (connection === 'open') {
        clearReconnectTimer(name);
        pairingModeInstances.delete(name);
        const phone = extractPhone(sock);
        await updateSession(name, {
          status: 'connected',
          phone: phone || null,
          lastQr: null,
          lastPairingCode: null,
          pairingPhone: null,
        });
        console.log(`[WhatsApp:${name}] ✓ Conectado +${phone}${isNewLogin ? ' (nuevo login)' : ''}`);
      }

      if (connection === 'close') {
        activeSockets.delete(name);
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errMsg = lastDisconnect?.error?.message || '';
        const loggedOut = code === DisconnectReason.loggedOut;
        const restartRequired = code === DisconnectReason.restartRequired;
        const replaced = code === DisconnectReason.connectionReplaced;
        console.log(`[WhatsApp:${name}] Cerrado código=${code} ${errMsg}`);

        if (loggedOut || replaced) {
          clearReconnectTimer(name);
          pairingModeInstances.delete(name);
          await updateSession(name, {
            status: 'disconnected',
            phone: null,
            lastQr: null,
            lastPairingCode: null,
            pairingPhone: null,
            authState: null,
          });
          return;
        }

        const registered = await isRegisteredInDb(name);
        const inPairing = pairingModeInstances.has(name);

        // Tras vincular con código, WhatsApp cierra con 515 — reconectar con creds guardadas
        if (restartRequired || (registered && !inPairing)) {
          pairingModeInstances.delete(name);
          await updateSession(name, { status: 'connecting' });
          const delay = restartRequired ? 10000 : 8000;
          console.log(`[WhatsApp:${name}] Emparejamiento completado — reconexión en ${delay / 1000}s...`);
          scheduleReconnect(name, delay);
          return;
        }

        // Esperando código: si el stream cae, reconectar (si no, el código del móvil falla)
        if (inPairing) {
          const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
          const phone = session?.pairingPhone?.replace(/\D/g, '');
          console.log(
            `[WhatsApp:${name}] Conexión perdida durante vinculación (código=${code}), reconectando en 5s...`
          );
          scheduleReconnect(name, 5000, { pairingPhone: phone });
          return;
        }

        // Desconexión genérica con sesión guardada
        if (registered) {
          await updateSession(name, { status: 'connecting' });
          scheduleReconnect(name, 8000);
        }
      }
    });

    // Pedir código solo en vinculación nueva (no en reconexión con sesión ya registrada)
    if (pairingPhone && !state.creds.registered) {
      try {
        const ready = await waitForSocketReady(sock, 45000);
        if (!ready) {
          throw new Error('Timeout conectando con WhatsApp. Inténtalo de nuevo.');
        }
        await sleep(3000);

        const existing = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
        const codeAgeMs = existing?.lastLinkAttemptAt
          ? Date.now() - existing.lastLinkAttemptAt.getTime()
          : Infinity;
        const keepExistingCode =
          existing?.lastPairingCode && codeAgeMs < 120000 && existing.pairingPhone === pairingPhone;

        if (keepExistingCode) {
          pairingModeInstances.add(name);
          await updateSession(name, {
            status: 'pairing',
            lastPairingCode: existing!.lastPairingCode,
            pairingPhone,
          });
          console.log(
            `[WhatsApp:${name}] Reconectado — usa el mismo código: ${existing!.lastPairingCode}`
          );
          return;
        }

        const rawCode = await sock.requestPairingCode(pairingPhone);
        await saveCreds();
        const formatted = formatPairingCode(rawCode);
        await updateSession(name, {
          status: 'pairing',
          lastPairingCode: formatted,
          pairingPhone,
          lastLinkAttemptAt: new Date(),
        });
        console.log(`[WhatsApp:${name}] Código de vinculación: ${formatted} (8 caracteres, sin guiones)`);
      } catch (err: any) {
        const msg = err.message || '';
        const row = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
        if (row?.lastPairingCode && pairingModeInstances.has(name)) {
          console.warn(`[WhatsApp:${name}] requestPairingCode: ${msg} — usando código existente`);
          return;
        }
        console.error(`[WhatsApp:${name}] Error pairing code:`, msg);
        pairingModeInstances.delete(name);
        await updateSession(name, { status: 'disconnected' });
        throw err;
      }
    }
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
  force = false,
  options: ConnectOptions = {}
): Promise<{ qrBase64?: string; pairingCode?: string; connected: boolean; phone?: string; error?: string }> {
  const name = normalizeName(instanceName);
  if (!name) return { connected: false, error: 'Nombre de instancia inválido' };

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (!force && session?.status === 'connected' && session.phone) {
    if (!activeSockets.get(name)?.user) connectSocket(name).catch(console.error);
    return { connected: true, phone: session.phone };
  }

  if (force || options.pairingPhone) {
    const cooldown = checkLinkCooldown(name, session);
    if (cooldown) {
      return {
        connected: false,
        error: `${cooldown} Si WhatsApp dice «inténtelo más tarde», elimina dispositivos vinculados en el móvil y espera 24 h.`,
      };
    }
  }

  try {
    await connectSocket(name, force, options);
    const result = await waitForQrOrConnected(name, 60000);

    if (result?.connected) return { connected: true, phone: result.phone };
    if (result?.pairingCode) return { connected: false, pairingCode: result.pairingCode };
    if (result?.qrBase64) return { connected: false, qrBase64: result.qrBase64 };

    const last = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (last?.lastPairingCode) return { connected: false, pairingCode: last.lastPairingCode };
    if (last?.status === 'connected' && last.phone) return { connected: true, phone: last.phone };

    return {
      connected: false,
      error: options.pairingPhone
        ? 'No se generó código. Inténtalo de nuevo en unos minutos.'
        : 'WhatsApp no conectado.',
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

export async function getBuiltinSessionView(instanceName: string) {
  const name = normalizeName(instanceName);
  const status = await getBuiltinStatus(name);
  if (status.connected) {
    return { success: true, connected: true, owner: status.owner, state: status.state };
  }

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (session?.lastPairingCode && (session.status === 'pairing' || session.status === 'connecting')) {
    return {
      success: true,
      connected: false,
      pairingCode: session.lastPairingCode,
      pairingPhone: session.pairingPhone || undefined,
      state: session.status,
      pairing: true,
    };
  }

  return {
    success: false,
    connected: false,
    state: session?.status || 'disconnected',
    error: 'WhatsApp no vinculado. Pulsa «Vincular WhatsApp».',
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
      return { success: false, error: 'WhatsApp no conectado. Vincula tu número primero.' };
    }
    await connectSocket(name);
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      sock = activeSockets.get(name);
      if (sock?.user) break;
    }
  }

  if (!sock?.user) {
    return { success: false, error: 'Sin conexión activa. Vincula de nuevo desde el panel.' };
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

export async function restartBuiltinInstance(instanceName: string, options: ConnectOptions = {}) {
  const name = normalizeName(instanceName);
  await disconnectSocket(name);
  pairingModeInstances.delete(name);
  await prisma.whatsAppSession.upsert({
    where: { instanceName: name },
    create: { instanceName: name, status: 'disconnected' },
    update: {
      status: 'disconnected',
      phone: null,
      lastQr: null,
      lastPairingCode: null,
      pairingPhone: null,
      authState: Prisma.DbNull,
    },
  });
  return startBuiltinInstance(name, true, options);
}

export async function restoreBuiltinSessions() {
  await getBaileysVersion();
  const sessions = await prisma.whatsAppSession.findMany({
    where: { status: 'connected' },
  });
  for (const s of sessions) {
    connectSocket(s.instanceName).catch((err) =>
      console.warn(`WhatsApp restore ${s.instanceName}:`, err.message)
    );
  }
}
