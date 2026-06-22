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
const pairingCodeRequested = new Set<string>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const reconnectInFlight = new Map<string, Promise<void>>();
const pairingReconnectAttempts = new Map<string, number>();

/** Mínimo entre intentos de vinculación NUEVA (no aplica a reanudar código existente) */
const LINK_COOLDOWN_MS = 30 * 1000;
const MAX_PAIRING_RECONNECTS = 3;

let cachedWaVersion: [number, number, number] | undefined;

interface ConnectOptions {
  pairingPhone?: string;
}

/**
 * WhatsApp rechaza pairing codes con browser no canónico (p. ej. "Desktop (Mac OS)").
 * Baileys usa por defecto Chrome (Mac OS) — obligatorio para requestPairingCode().
 */
const WHATSAPP_BROWSER = Browsers.macOS('Chrome');

function parseBaileysJson<T>(json: string): T {
  return JSON.parse(json, BufferJSON.reviver);
}

function stringifyBaileysJson(value: unknown): string {
  return JSON.stringify(value, BufferJSON.replacer);
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
      authState: { creds: stringifyBaileysJson(creds), keys: keysJson },
    },
    update: {
      authState: { creds: stringifyBaileysJson(creds), keys: keysJson },
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
        creds = parseBaileysJson(stored.creds);
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
        if (val) result[id] = parseBaileysJson(val);
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
          if (value) keysJson[key] = stringifyBaileysJson(value);
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
    const creds = parseBaileysJson<{ registered?: boolean }>(stored.creds);
    return Boolean(creds.registered);
  } catch {
    return false;
  }
}

function normalizeName(instanceName: string): string {
  return instanceName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

export function isBuiltinConnected(instanceName: string): boolean {
  const name = normalizeName(instanceName);
  return Boolean(activeSockets.get(name)?.user);
}

export function isBuiltinConnecting(instanceName: string): boolean {
  const name = normalizeName(instanceName);
  return connectingLocks.has(name) || reconnectTimers.has(name) || reconnectInFlight.has(name);
}

/** Una sola reconexión en vuelo — nunca abrir 2 sockets (WhatsApp desvincula el móvil). */
export function requestReconnectOnce(instanceName: string): void {
  const name = normalizeName(instanceName);
  if (!name) return;
  if (activeSockets.get(name)?.user) return;
  if (connectingLocks.has(name) || reconnectTimers.has(name) || reconnectInFlight.has(name)) return;

  const job = (async () => {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status !== 'connected' || !session.phone) return;
    if (!(await isRegisteredInDb(name))) return;
    console.log(`[WhatsApp:${name}] Reconexión única (sesión registrada)...`);
    await connectSocket(name);
  })().catch((err) => console.warn(`[WhatsApp:${name}] requestReconnectOnce:`, err.message))
    .finally(() => reconnectInFlight.delete(name));

  reconnectInFlight.set(name, job);
}

/** Espera socket activo — NO abre otra conexión (evita connectionReplaced / desvincular móvil). */
export async function waitForConnectedSocket(
  instanceName: string,
  timeoutMs = 45_000
): Promise<WASocket | null> {
  const name = normalizeName(instanceName);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const sock = activeSockets.get(name);
    if (sock?.user) return sock;

    const lock = connectingLocks.get(name);
    if (lock) {
      try {
        await Promise.race([lock, sleep(1500)]);
      } catch {
        /* ignore */
      }
      continue;
    }

    const inFlight = reconnectInFlight.get(name);
    if (inFlight) {
      try {
        await Promise.race([inFlight, sleep(1500)]);
      } catch {
        /* ignore */
      }
      continue;
    }

    if (reconnectTimers.has(name)) {
      await sleep(1000);
      continue;
    }

    await sleep(500);
  }

  const final = activeSockets.get(name);
  return final?.user ? final : null;
}

function notifyWhatsAppConnected(instanceName: string) {
  import('./whatsapp-campaign.service')
    .then((m) => m.onWhatsAppConnected(instanceName))
    .catch(() => {});
}

function notifyWhatsAppDisconnected(instanceName: string, reason?: string) {
  import('./whatsapp-campaign.service')
    .then((m) => m.onWhatsAppDisconnected(instanceName, reason))
    .catch(() => {});
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
  reconnectInFlight.delete(name);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForRegisteredInDb(instanceName: string, maxMs = 25000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await isRegisteredInDb(instanceName)) return true;
    await sleep(400);
  }
  return false;
}

async function scheduleReconnect(name: string, delayMs: number, options: ConnectOptions = {}) {
  if (reconnectTimers.has(name) || reconnectInFlight.has(name)) return;
  clearReconnectTimer(name);
  const timer = setTimeout(async () => {
    reconnectTimers.delete(name);
    try {
      if (activeSockets.get(name)?.user) return;
      connectingLocks.delete(name);
      await disconnectSocket(name);
      await sleep(1000);

      const registered = await waitForRegisteredInDb(name, 25000);
      if (registered) {
        console.log(`[WhatsApp:${name}] Reconectando con sesión registrada...`);
        await connectSocket(name, false, {});
        return;
      }

      const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
      const pairingPhone = options.pairingPhone || session?.pairingPhone?.replace(/\D/g, '');
      if (pairingPhone && session?.lastPairingCode) {
        console.log(`[WhatsApp:${name}] Reconectando en modo vinculación...`);
        pairingCodeRequested.delete(name);
        pairingModeInstances.add(name);
        await connectSocket(name, false, { pairingPhone });
        return;
      }

      console.log(`[WhatsApp:${name}] Sin sesión válida tras cierre`);
      await updateSession(name, { status: 'disconnected' });
    } catch (err: any) {
      console.error(`[WhatsApp:${name}] Error en reconexión:`, err.message);
      await updateSession(name, { status: 'disconnected' });
    }
  }, delayMs);
  reconnectTimers.set(name, timer);
}

async function waitForQrOrConnected(name: string, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.status === 'connected' && session.phone) {
      return { connected: true as const, phone: session.phone };
    }
    if (session?.lastPairingCode && (session.status === 'pairing' || session.status === 'connecting')) {
      return {
        connected: false as const,
        pairingCode: session.lastPairingCode,
        pairingPhone: session.pairingPhone || undefined,
      };
    }
    if (session?.lastQr) {
      return { connected: false as const, qrBase64: session.lastQr };
    }
    await sleep(600);
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
  const secs = Math.ceil((LINK_COOLDOWN_MS - elapsed) / 1000);
  return `Espera ${secs} s antes de otro intento. WhatsApp bloquea si se intenta vincular muchas veces seguidas.`;
}

async function requestPairingCodeForSocket(
  name: string,
  sock: WASocket,
  pairingPhone: string,
  saveCreds: () => Promise<void>
): Promise<string> {
  if (pairingCodeRequested.has(name)) {
    const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
    if (session?.lastPairingCode) return session.lastPairingCode;
  }

  pairingCodeRequested.add(name);

  const existing = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  const codeAgeMs = existing?.lastLinkAttemptAt
    ? Date.now() - existing.lastLinkAttemptAt.getTime()
    : Infinity;
  if (existing?.lastPairingCode && codeAgeMs < 120000 && existing.pairingPhone === pairingPhone) {
    console.log(`[WhatsApp:${name}] Reutilizando código existente: ${existing.lastPairingCode}`);
    return existing.lastPairingCode;
  }

  console.log(`[WhatsApp:${name}] Solicitando código para +${pairingPhone}...`);
  const rawCode = await sock.requestPairingCode(pairingPhone);
  await saveCreds();
  const formatted = formatPairingCode(rawCode);
  await updateSession(name, {
    status: 'pairing',
    lastPairingCode: formatted,
    pairingPhone,
    lastLinkAttemptAt: new Date(),
  });
  console.log(`[WhatsApp:${name}] Código listo: ${formatted}`);
  return formatted;
}

async function connectSocket(instanceName: string, force = false, options: ConnectOptions = {}): Promise<void> {
  const name = normalizeName(instanceName);
  if (!name) throw new Error('Nombre de instancia inválido');

  if (force) {
    pairingModeInstances.delete(name);
    pairingCodeRequested.delete(name);
    pairingReconnectAttempts.delete(name);
    await disconnectSocket(name);
  }

  const existing = activeSockets.get(name);
  if (existing?.user) return;

  const lock = connectingLocks.get(name);
  if (lock) {
    await lock;
    if (activeSockets.get(name)?.user) return;
  }

  // Solo desconectar socket zombie (sin user y sin conexión en curso)
  if (existing && !existing.user && !connectingLocks.has(name) && !force) {
    await disconnectSocket(name);
  }

  const pairingPhone = options.pairingPhone?.replace(/\D/g, '');
  if (pairingPhone) pairingModeInstances.add(name);

  const connectPromise = (async () => {
    const registeredAlready = await isRegisteredInDb(name);

    if (!registeredAlready && pairingPhone) {
      await updateSession(name, {
        status: 'connecting',
        lastLinkAttemptAt: new Date(),
        lastQr: null,
        pairingPhone,
      });
    } else if (!registeredAlready) {
      await updateSession(name, { status: 'connecting' });
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
      browser: WHATSAPP_BROWSER,
      generateHighQualityLinkPreview: false,
      getMessage: async () => undefined,
      connectTimeoutMs: 90000,
      defaultQueryTimeoutMs: 90000,
      retryRequestDelayMs: 2500,
      keepAliveIntervalMs: 25000,
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

      // Patrón oficial Baileys: pedir código cuando connection=connecting o hay QR
      if (
        pairingPhone &&
        !state.creds.registered &&
        !pairingCodeRequested.has(name) &&
        (connection === 'connecting' || !!qr)
      ) {
        try {
          await sleep(1200);
          await requestPairingCodeForSocket(name, sock, pairingPhone, saveCreds);
        } catch (err: any) {
          console.error(`[WhatsApp:${name}] Error al pedir código:`, err.message);
          await updateSession(name, { status: 'disconnected' });
          pairingModeInstances.delete(name);
          pairingCodeRequested.delete(name);
        }
      }

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
        pairingCodeRequested.delete(name);
        pairingReconnectAttempts.delete(name);
        const phone = extractPhone(sock);
        await updateSession(name, {
          status: 'connected',
          phone: phone || null,
          lastQr: null,
          lastPairingCode: null,
          pairingPhone: null,
        });
        console.log(`[WhatsApp:${name}] ✓ Conectado +${phone}${isNewLogin ? ' (nuevo login)' : ''}`);
        notifyWhatsAppConnected(name);
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
          notifyWhatsAppDisconnected(
            name,
            loggedOut
              ? 'WhatsApp cerró la sesión (posible bloqueo por envío masivo). Vincula de nuevo y reanuda la campaña.'
              : 'Otra sesión reemplazó esta conexión.'
          );
          clearReconnectTimer(name);
          pairingModeInstances.delete(name);
          pairingCodeRequested.delete(name);
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

        // Desconexiones temporales (reconexión automática): NO pausar campañas ni borrar sesión

        // Credenciales corruptas (Buffers mal serializados)
        if (errMsg.includes('ERR_INVALID_ARG_TYPE') || errMsg.includes('must be of type string')) {
          console.error(`[WhatsApp:${name}] Credenciales corruptas — limpiando sesión`);
          clearReconnectTimer(name);
          pairingModeInstances.delete(name);
          pairingCodeRequested.delete(name);
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

        // 515 = WhatsApp pide reiniciar socket tras vincular (comportamiento normal)
        if (restartRequired) {
          pairingModeInstances.delete(name);
          pairingCodeRequested.delete(name);
          await updateSession(name, { status: 'connecting' });
          try {
            await saveCreds();
            await sleep(2500);
          } catch {
            /* ignore */
          }
          console.log(`[WhatsApp:${name}] Reinicio requerido (515) — reconectando en 4s...`);
          scheduleReconnect(name, 4000);
          return;
        }

        if (registered) {
          pairingModeInstances.delete(name);
          pairingCodeRequested.delete(name);
          await updateSession(name, { status: 'connecting' });
          scheduleReconnect(name, 5000);
          return;
        }

        if (inPairing) {
          const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
          const phone = session?.pairingPhone?.replace(/\D/g, '');
          const hasCode = Boolean(session?.lastPairingCode);

          if (hasCode) {
            const attempts = (pairingReconnectAttempts.get(name) || 0) + 1;
            if (attempts > MAX_PAIRING_RECONNECTS) {
              console.log(`[WhatsApp:${name}] Demasiados cierres durante vinculación — pulsa «Reiniciar vinculación»`);
              pairingModeInstances.delete(name);
              await updateSession(name, { status: 'disconnected' });
              return;
            }
            pairingReconnectAttempts.set(name, attempts);
            console.log(
              `[WhatsApp:${name}] Reconexión suave ${attempts}/${MAX_PAIRING_RECONNECTS} (manteniendo código)...`
            );
            scheduleReconnect(name, 3000, { pairingPhone: phone });
          } else {
            scheduleReconnect(name, 2000, { pairingPhone: phone });
          }
        }
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
  force = false,
  options: ConnectOptions = {}
): Promise<{ qrBase64?: string; pairingCode?: string; connected: boolean; phone?: string; error?: string }> {
  const name = normalizeName(instanceName);
  if (!name) return { connected: false, error: 'Nombre de instancia inválido' };

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  if (!force && session?.status === 'connected' && session.phone) {
    if (!activeSockets.get(name)?.user) requestReconnectOnce(name);
    const live = activeSockets.get(name)?.user;
    return { connected: Boolean(live), phone: session.phone };
  }

  if (force) {
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
  const liveConnected = Boolean(sock?.user);
  const sessionRegistered = session?.status === 'connected' && !!session.phone;
  const reconnecting = !liveConnected && sessionRegistered && isBuiltinConnecting(name);

  if (sessionRegistered && !liveConnected && !isBuiltinConnecting(name)) {
    requestReconnectOnce(name);
  }

  return {
    configured: true,
    connected: liveConnected,
    instanceName: name,
    state: liveConnected ? 'connected' : reconnecting ? 'reconnecting' : session?.status || 'disconnected',
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

  if (session?.lastQr && session.status === 'qr') {
    return {
      success: true,
      connected: false,
      qrBase64: session.lastQr,
      state: session.status,
      pairing: false,
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

export async function getBuiltinDiagnostics(instanceName: string) {
  const name = normalizeName(instanceName);
  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });
  const registered = await isRegisteredInDb(name);
  return {
    instanceName: name,
    status: session?.status || 'disconnected',
    phone: session?.phone,
    pairingPhone: session?.pairingPhone,
    hasPairingCode: Boolean(session?.lastPairingCode),
    registeredInDb: registered,
    socketActive: Boolean(activeSockets.get(name)),
    socketUser: Boolean(activeSockets.get(name)?.user),
    inPairingMode: pairingModeInstances.has(name),
    lastLinkAttemptAt: session?.lastLinkAttemptAt,
    browser: WHATSAPP_BROWSER.join(' / '),
    waVersion: cachedWaVersion?.join('.') || 'unknown',
  };
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
    sock = (await waitForConnectedSocket(name, 35_000)) ?? undefined;
  }

  if (!sock?.user) {
    return {
      success: false,
      error: 'Sin conexión activa en el servidor. Espera unos segundos o vincula de nuevo desde el panel.',
    };
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
  return sessions.map((s) => {
    const live = Boolean(activeSockets.get(s.instanceName)?.user);
    const registered = s.status === 'connected' && !!s.phone;
    return {
      name: s.instanceName,
      connected: live,
      state: live ? 'connected' : registered && isBuiltinConnecting(s.instanceName) ? 'reconnecting' : s.status,
      owner: s.phone || undefined,
    };
  });
}

export async function restartBuiltinInstance(instanceName: string, options: ConnectOptions = {}) {
  const name = normalizeName(instanceName);
  await disconnectSocket(name);
  pairingModeInstances.delete(name);
  pairingCodeRequested.delete(name);
  pairingReconnectAttempts.delete(name);
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

/**
 * Inicia vinculación SIN borrar sesión si ya hay un código reciente para el mismo número.
 * Evita destruir el progreso cuando el usuario pulsa «Vincular» o recarga la página.
 */
export async function beginBuiltinPairing(
  instanceName: string,
  options: ConnectOptions = {}
): Promise<{ qrBase64?: string; pairingCode?: string; connected: boolean; phone?: string; error?: string }> {
  const name = normalizeName(instanceName);
  const pairingPhone = options.pairingPhone?.replace(/\D/g, '');
  if (!pairingPhone) {
    return { connected: false, error: 'Número de teléfono requerido' };
  }

  const session = await prisma.whatsAppSession.findUnique({ where: { instanceName: name } });

  if (session?.status === 'connected' && session.phone) {
    if (!activeSockets.get(name)?.user) requestReconnectOnce(name);
    return { connected: Boolean(activeSockets.get(name)?.user), phone: session.phone };
  }

  // Reanudar vinculación en curso (mismo número, código < 2 min)
  if (session?.lastPairingCode && session.pairingPhone === pairingPhone) {
    const age = session.lastLinkAttemptAt
      ? Date.now() - session.lastLinkAttemptAt.getTime()
      : Infinity;
    if (age < 120000 && (session.status === 'pairing' || session.status === 'connecting')) {
      console.log(`[WhatsApp:${name}] Reanudando vinculación existente (código ${session.lastPairingCode})`);
      pairingModeInstances.add(name);
      if (!activeSockets.get(name)) {
        await connectSocket(name, false, { pairingPhone });
      }
      const result = await waitForQrOrConnected(name, 45000);
      if (result?.connected) return { connected: true, phone: result.phone };
      if (result?.pairingCode) return { connected: false, pairingCode: result.pairingCode };
      return { connected: false, pairingCode: session.lastPairingCode };
    }
  }

  // Sesión corrupta parcial (auth sin registered) — limpiar y empezar de cero
  const hasPartialAuth = session?.authState && !(await isRegisteredInDb(name));
  if (hasPartialAuth && session?.status !== 'pairing') {
    console.log(`[WhatsApp:${name}] Limpiando sesión parcial corrupta...`);
    return restartBuiltinInstance(name, { pairingPhone });
  }

  // Vinculación nueva
  return restartBuiltinInstance(name, { pairingPhone });
}

export async function restoreBuiltinSessions() {
  try {
    await getBaileysVersion();
    const sessions = await prisma.whatsAppSession.findMany({
      where: { status: 'connected' },
    });
    for (const s of sessions) {
      const registered = await isRegisteredInDb(s.instanceName);
      if (!registered) {
        console.warn(`[WhatsApp:${s.instanceName}] Sesión connected sin creds válidas — ignorando restore`);
        continue;
      }
      requestReconnectOnce(s.instanceName);
    }
  } catch (err: any) {
    console.warn('restoreBuiltinSessions:', err.message);
  }
}
