import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  RefreshCw,
  Upload,
  Users,
  Euro,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Play,
  Ban,
  Phone,
  Smartphone,
  Trash2,
  AlertTriangle,
  Link2,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import {
  getWhatsAppStats,
  getWhatsAppCampaigns,
  getWhatsAppCampaign,
  createWhatsAppCampaign,
  uploadWhatsAppCampaignImage,
  importWhatsAppContacts,
  importWhatsAppContactsExcel,
  syncWhatsAppProfileContacts,
  getWhatsAppContacts,
  sendWhatsAppTest,
  cancelWhatsAppCampaign,
  resumeWhatsAppCampaign,
  getWhatsAppInstances,
  getWhatsAppRecipientCount,
  deleteWhatsAppContact,
  getWhatsAppSetupStatus,
  getWhatsAppConnectionStatus,
  connectWhatsAppSender,
} from '../services/admin.api';

const COST_PER_MSG = 0.035;

function formatEurTotal(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatEurPerMsg(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(n);
}

interface EvolutionInstance {
  name: string;
  connected: boolean;
  state: string;
  owner?: string;
  profileName?: string;
}

export default function AdminWhatsAppPage() {
  const [stats, setStats] = useState<any>(null);
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactTotal, setContactTotal] = useState(0);
  const [recipientCount, setRecipientCount] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadError, setLoadError] = useState('');

  const [importText, setImportText] = useState('');
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignImageUrl, setCampaignImageUrl] = useState('');
  const [campaignImagePreview, setCampaignImagePreview] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [campaignSource, setCampaignSource] = useState('contacts_db');
  const [manualPhones, setManualPhones] = useState('');
  const [delayMs, setDelayMs] = useState(12000);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const [setupStatus, setSetupStatus] = useState<any>(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingConnect, setIsWaitingConnect] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

  const instanceName = 'caperucitas';

  const loadSetup = useCallback(async () => {
    try {
      const data = await getWhatsAppSetupStatus();
      setSetupStatus(data);
      const suggested =
        data.instanceStatus?.owner ||
        data.defaultSenderPhone ||
        '';
      if (suggested) {
        setSenderPhone((prev) => prev || String(suggested).replace(/\D/g, ''));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const data = await getWhatsAppConnectionStatus(instanceName);
      if (data.connected) {
        setPairingCode(null);
        setQrBase64(null);
        setIsWaitingConnect(false);
        setSuccess(`WhatsApp conectado — enviando desde +${data.owner || senderPhone}`);
        if (data.owner) setSenderPhone(String(data.owner).replace(/\D/g, ''));
        return true;
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
      if (data.pairing || data.state === 'connecting' || data.state === 'pairing') {
        setIsWaitingConnect(true);
      }
      return false;
    } catch {
      return false;
    }
  }, [senderPhone, instanceName]);

  const handleConnectSender = async (options?: { forceReset?: boolean; useQr?: boolean }) => {
    setError('');
    setSuccess('');
    const phone = senderPhone.trim();
    if (!options?.useQr && !phone) {
      setError('Introduce el número de WhatsApp desde el que quieres enviar (ej. 34612345678)');
      return;
    }
    setIsConnecting(true);
    if (options?.forceReset || options?.useQr) {
      setPairingCode(null);
      setQrBase64(null);
    }
    setIsWaitingConnect(false);
    try {
      setSelectedInstance(instanceName);
      const result = await connectWhatsAppSender(phone || '0000000000', instanceName, options);
      if (result.connected) {
        setPairingCode(null);
        setQrBase64(null);
        setSuccess(`WhatsApp conectado — los mensajes saldrán desde +${result.phone || phone}`);
      } else if (result.qr?.base64) {
        setQrBase64(result.qr.base64);
        setPairingCode(null);
        setIsWaitingConnect(true);
        setSuccess('Escanea el QR con WhatsApp → Dispositivos vinculados → Vincular dispositivo.');
      } else if (result.pairingCode) {
        setPairingCode(result.pairingCode);
        setQrBase64(null);
        setIsWaitingConnect(true);
        setSuccess('Código listo. Introdúcelo en el móvil ahora (tienes ~2 min).');
      } else {
        setError('No se pudo vincular. Si WhatsApp dice «inténtelo más tarde», espera 24 h o prueba con QR.');
      }
      loadSetup();
      loadInstances();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al conectar WhatsApp');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadInstances = useCallback(async () => {
    try {
      const data = await getWhatsAppInstances();
      const list: EvolutionInstance[] = data.instances || [];
      setInstances(list);
      setSelectedInstance(instanceName);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadRecipientCount = useCallback(async (source: string, phones?: string) => {
    try {
      const data = await getWhatsAppRecipientCount(source, phones);
      setRecipientCount(data.count || 0);
    } catch {
      setRecipientCount(0);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoadError('');
    const results = await Promise.allSettled([
      getWhatsAppStats(),
      getWhatsAppCampaigns(),
      getWhatsAppContacts(1, 20),
    ]);

    const errors: string[] = [];

    if (results[0].status === 'fulfilled') {
      setStats(results[0].value);
      if (results[0].value.instances?.length) {
        setInstances(results[0].value.instances);
      }
    } else {
      console.error(results[0].reason);
      errors.push('estadísticas');
    }

    if (results[1].status === 'fulfilled') {
      setCampaigns(results[1].value.campaigns || []);
    } else {
      console.error(results[1].reason);
      setCampaigns([]);
    }

    if (results[2].status === 'fulfilled') {
      setContacts(results[2].value.contacts || []);
      setContactTotal(results[2].value.total || 0);
    } else {
      console.error(results[2].reason);
      errors.push('contactos');
    }

    if (errors.length > 0) {
      const detail =
        results[0].status === 'rejected'
          ? (results[0].reason as any)?.response?.data?.error
          : undefined;
      setLoadError(
        detail ||
          `No se pudieron cargar: ${errors.join(', ')}. Pulsa Actualizar o espera 1 min al reinicio del servidor.`
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    loadInstances();
    loadSetup();
    const interval = setInterval(() => {
      loadAll();
      loadInstances();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAll, loadInstances, loadSetup]);

  // Comprobar si ya conectó tras introducir el código (sin regenerar nada)
  useEffect(() => {
    if (!pairingCode && !qrBase64 && !isWaitingConnect) return;
    const t = setInterval(async () => {
      const ok = await checkConnectionStatus();
      if (ok) {
        loadAll();
        loadInstances();
        loadSetup();
      }
    }, 3000);
    return () => clearInterval(t);
  }, [pairingCode, qrBase64, isWaitingConnect, checkConnectionStatus, loadAll, loadInstances, loadSetup]);

  // Auto-sincronizar teléfonos de perfiles la primera vez
  useEffect(() => {
    if (autoSynced || isLoading || !stats) return;
    const profilePhones = stats?.totals?.profilePhoneCount ?? 0;
    const contacts = stats?.totals?.contactCount ?? 0;
    if (profilePhones > 0 && contacts === 0) {
      setAutoSynced(true);
      syncWhatsAppProfileContacts()
        .then((r) => {
          setSuccess(`Auto-sync: ${r.synced} contactos importados desde perfiles`);
          loadAll();
        })
        .catch(() => {});
    }
  }, [stats, isLoading, autoSynced, loadAll]);

  const activeInstance = instances.find((i) => i.name === selectedInstance);
  const connected = activeInstance?.connected ?? stats?.instance?.connected;
  const isConfigured = stats?.whatsappConfigured ?? stats?.evolutionConfigured ?? true;
  const provider = stats?.provider || setupStatus?.provider || 'builtin';
  const quota = stats?.quota;
  const dailyQuota = stats?.dailyQuota;
  const statsLoaded = Boolean(stats?.cachedAt);
  const dbContactCount = stats?.totals?.contactCount ?? contactTotal;
  const messagesRemaining = statsLoaded ? (quota?.remaining ?? 0) : 0;
  const messageLimit = statsLoaded ? (quota?.limit ?? 0) : 0;
  const dailyRemaining = statsLoaded ? (dailyQuota?.remainingToday ?? 0) : 0;
  const dailyLimit = statsLoaded ? (dailyQuota?.limit ?? 0) : 0;
  const dailyExhausted = statsLoaded ? (dailyQuota?.exhausted ?? false) : false;
  const quotaExhausted = statsLoaded ? (quota?.exhausted ?? false) : false;
  const quotaPercentUsed = statsLoaded ? (quota?.percentUsed ?? 0) : 0;
  const dailyPercentUsed = statsLoaded ? (dailyQuota?.percentUsedToday ?? 0) : 0;
  const canSendMessages = statsLoaded && !quotaExhausted && !dailyExhausted && messagesRemaining > 0 && dailyRemaining > 0;
  const campaignExceedsQuota = recipientCount > messagesRemaining;
  const campaignExceedsDaily = recipientCount > dailyRemaining;
  const safeLimits = stats?.safeLimits;
  const maxRecipientsPerCampaign = safeLimits?.maxRecipientsPerCampaign ?? 200;
  const minDelayMs = safeLimits?.minDelayMs ?? 8000;
  const campaignExceedsMaxRecipients = recipientCount > maxRecipientsPerCampaign;
  const canLaunchCampaign =
    canSendMessages &&
    !campaignExceedsQuota &&
    !campaignExceedsMaxRecipients &&
    connected &&
    recipientCount > 0;

  useEffect(() => {
    const phones = campaignSource === 'manual' ? manualPhones : undefined;
    loadRecipientCount(campaignSource, phones);
  }, [campaignSource, manualPhones, contactTotal, loadRecipientCount]);

  const handleImport = async () => {
    setError('');
    setSuccess('');
    try {
      const result = await importWhatsAppContacts(importText);
      setSuccess(`Importados: ${result.imported} nuevos, ${result.updated} actualizados. Total en BD: ${result.contactCount}`);
      setImportText('');
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al importar');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setSuccess('');
    setIsImportingExcel(true);
    try {
      const result = await importWhatsAppContactsExcel(file);
      setSuccess(
        `Excel "${result.filename}": ${result.imported} nuevos, ${result.updated} actualizados (${result.total} filas). Total en BD: ${result.contactCount}`
      );
      loadAll();
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        setError('El servidor aún no tiene la importación Excel desplegada. Espera 2–3 min a que Railway actualice y pulsa Actualizar.');
      } else {
        setError(err.response?.data?.error || err.message || 'Error al importar Excel');
      }
    } finally {
      setIsImportingExcel(false);
    }
  };

  const handleSyncProfiles = async () => {
    setError('');
    try {
      const result = await syncWhatsAppProfileContacts();
      setSuccess(`Sincronizados ${result.synced} contactos desde perfiles. Total: ${result.contactCount}`);
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al sincronizar');
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('¿Eliminar este contacto?')) return;
    try {
      await deleteWhatsAppContact(id);
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleCampaignImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar 10 MB');
      return;
    }

    setCampaignImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);
    setError('');
    try {
      const { url } = await uploadWhatsAppCampaignImage(file);
      setCampaignImageUrl(url);
      setSuccess('Imagen lista. El texto del mensaje se enviará como caption debajo de la imagen.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir imagen');
      setCampaignImagePreview('');
      setCampaignImageUrl('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const clearCampaignImage = () => {
    setCampaignImageUrl('');
    setCampaignImagePreview('');
  };

  const handleCreateCampaign = async () => {
    setError('');
    setSuccess('');
    if (!campaignMessage.trim() && !campaignImageUrl) {
      setError('Escribe el mensaje (caption) o adjunta una imagen');
      return;
    }
    if (!connected) {
      setError('Vincula tu número de WhatsApp antes de enviar');
      return;
    }
    if (!canSendMessages) {
      setError('Has agotado tus mensajes disponibles. Contacta con el administrador para recargar.');
      return;
    }
    if (campaignExceedsQuota) {
      setError(`Solo te quedan ${messagesRemaining.toLocaleString('es-ES')} mensajes. Reduce destinatarios o contacta con el administrador.`);
      return;
    }

    const emisor = activeInstance?.owner || senderPhone;
    if (!window.confirm(`¿Enviar campaña a ${recipientCount} números desde +${emisor}? Coste estimado: ${formatEurTotal(recipientCount * COST_PER_MSG)}`)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await createWhatsAppCampaign({
        name: campaignName,
        message: campaignMessage,
        imageUrl: campaignImageUrl || undefined,
        source: campaignSource,
        phones: campaignSource === 'manual' ? manualPhones : undefined,
        delayMs,
        instanceName,
      });
      setSuccess(
        result.dailyWarning
          ? `Campaña "${result.campaign.name}" iniciada. ${result.dailyWarning}`
          : `Campaña "${result.campaign.name}" iniciada desde +${emisor}. Coste estimado: ${formatEurTotal(result.estimatedCostEur)}`
      );
      setCampaignName('');
      setCampaignMessage('');
      clearCampaignImage();
      setManualPhones('');
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al crear campaña');
    } finally {
      setIsSending(false);
    }
  };

  const handleTest = async () => {
    setError('');
    if (!connected) {
      setError('Vincula tu número de WhatsApp antes de enviar');
      return;
    }
    if (!canSendMessages) {
      setError('Has agotado tus mensajes disponibles. Contacta con el administrador para recargar.');
      return;
    }
    try {
      await sendWhatsAppTest(
        testPhone,
        testMessage || campaignMessage || 'Mensaje de prueba Caperucitas',
        instanceName,
        campaignImageUrl || undefined
      );
      setSuccess(`Prueba enviada a ${testPhone} desde +${activeInstance?.owner || senderPhone} (${formatEurPerMsg(COST_PER_MSG)})`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al enviar prueba');
    }
  };

  const openCampaign = async (id: string) => {
    const data = await getWhatsAppCampaign(id);
    setSelectedCampaign(data.campaign);
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Cancelar esta campaña?')) return;
    await cancelWhatsAppCampaign(id);
    loadAll();
    if (selectedCampaign?.id === id) setSelectedCampaign(null);
  };

  const handleResume = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await resumeWhatsAppCampaign(id);
      setSuccess('Campaña reanudada. Los mensajes pendientes continuarán enviándose.');
      loadAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al reanudar campaña');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="WhatsApp Masivo"
      subtitle={`${provider === 'builtin' ? 'Integrado · Supabase' : 'Evolution API'} · ${formatEurPerMsg(stats?.costPerMessage ?? COST_PER_MSG)}/mensaje`}
      icon={<MessageCircle className="w-7 h-7 text-green-500" />}
      actions={
        <button onClick={() => { loadAll(); loadInstances(); }} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      }
    >

        {loadError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {loadError}
          </div>
        )}

        {!isConfigured && stats && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-100 rounded-xl text-sm">
            <p className="font-bold">Backend desactualizado</p>
            <p className="mt-1">Railway aún no ha desplegado la versión con WhatsApp integrado. Espera 2–3 min y pulsa Actualizar.</p>
          </div>
        )}

        {/* Número emisor + vinculación (solo código, una vez) */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-6">
          <h2 className="text-white font-bold mb-1 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" /> Número emisor
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            Los mensajes salen desde tu WhatsApp. Solo hay que vincularlo una vez con un código de 8 dígitos (no hay QR).
          </p>

          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="flex-1 min-w-[240px]">
              <label className="text-gray-400 text-xs block mb-1">Número desde el que enviar (sin +)</label>
              <input
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, ''))}
                disabled={connected}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm disabled:opacity-60"
                placeholder="34612345678"
              />
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0 ${connected ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connected ? `Conectado +${activeInstance?.owner || senderPhone}` : 'Sin vincular'}
            </div>
          </div>

          {!connected && isConfigured && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleConnectSender()}
                  disabled={isConnecting || !senderPhone.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {isConnecting ? 'Vinculando...' : 'Vincular WhatsApp'}
                </button>
                {pairingCode && (
                  <button
                    onClick={() => handleConnectSender({ forceReset: true })}
                    disabled={isConnecting}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm"
                  >
                    Reiniciar vinculación
                  </button>
                )}
                <button
                  onClick={() => handleConnectSender({ useQr: true, forceReset: true })}
                  disabled={isConnecting}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm"
                >
                  Vincular con QR
                </button>
              </div>

              {qrBase64 && (
                <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-blue-700 text-center">
                  <p className="text-gray-400 text-xs mb-3">Escanea con WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                  <img
                    src={`data:image/png;base64,${qrBase64}`}
                    alt="QR WhatsApp"
                    className="mx-auto w-64 h-64 rounded-lg bg-white p-2"
                  />
                  {isWaitingConnect && (
                    <p className="text-blue-400 text-sm mt-2 animate-pulse">Esperando escaneo…</p>
                  )}
                </div>
              )}

              {pairingCode && (
                <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-green-700">
                  <p className="text-gray-400 text-xs mb-2">Código de vinculación (válido ~2 min, sin guiones):</p>
                  <p className="text-4xl font-mono font-bold text-green-400 tracking-[0.35em] text-center py-3 select-all">
                    {pairingCode.replace(/-/g, '')}
                  </p>
                  <p className="text-gray-300 text-sm">
                    En el móvil <strong>+{senderPhone}</strong>: WhatsApp → Ajustes → Dispositivos vinculados →{' '}
                    <strong>Vincular con número de teléfono</strong> → introduce los 8 caracteres.
                  </p>
                  <p className="text-yellow-400/90 text-xs mt-2">
                    Tras introducir el código, espera 10–30 s sin cerrar esta página. La conexión se completa sola.
                  </p>
                  {isWaitingConnect && (
                    <p className="text-green-400 text-sm mt-2 animate-pulse">Vinculando… reconectando con WhatsApp</p>
                  )}
                  <button
                    type="button"
                    onClick={() => checkConnectionStatus()}
                    className="mt-3 text-green-400 hover:text-green-300 text-xs underline"
                  >
                    Ya introduje el código — comprobar conexión
                  </button>
                </div>
              )}

              <div className="p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg text-amber-100/90 text-xs space-y-1">
                <p className="font-semibold text-amber-300">Si WhatsApp dice «inténtelo más tarde»:</p>
                <p>1. Cierra sesiones antiguas en Dispositivos vinculados (máx. 4).</p>
                <p>2. Espera 24 h sin reintentar.</p>
                <p>3. Opcional en Railway: variable <code className="text-amber-200">WHATSAPP_SENDER_PHONE=34612345678</code></p>
              </div>
            </>
          )}

          {connected && (
            <p className="text-green-400 text-sm">
              Listo para enviar campañas desde +{activeInstance?.owner || senderPhone}. La sesión se guarda en el servidor.
            </p>
          )}
        </div>

        {provider === 'evolution' && isConfigured && !setupStatus?.evolutionReachable && !loadError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">
            Evolution API no accesible. Usa modo integrado (builtin) en Railway.
          </div>
        )}

        {loadError && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700 text-amber-200 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{loadError}</p>
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-900/30 border border-green-700 text-green-300 rounded-lg text-sm">{success}</div>}

        {/* Cuota de mensajes */}
        <div className={`rounded-xl p-5 border mb-6 ${quotaExhausted ? 'bg-red-950/40 border-red-700' : 'bg-gray-900 border-gray-800'}`}>
          {!statsLoaded && !isLoading && (
            <p className="text-amber-400 text-xs mb-3">No se pudieron cargar las estadísticas. Pulsa Actualizar arriba.</p>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-white font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Mensajes restantes
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Tienes un límite de {messageLimit.toLocaleString('es-ES')} mensajes. Cada envío exitoso consume 1 mensaje.
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${quotaExhausted ? 'text-red-400' : 'text-green-400'}`}>
                {messagesRemaining.toLocaleString('es-ES')}
              </p>
              <p className="text-gray-500 text-xs">de {messageLimit.toLocaleString('es-ES')}</p>
            </div>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${quotaExhausted ? 'bg-red-500' : quotaPercentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, quotaPercentUsed)}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">
            Usados: {(quota?.used ?? 0).toLocaleString('es-ES')} ({quotaPercentUsed}%)
          </p>
          {quotaExhausted && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No puedes enviar más mensajes</p>
                <p className="mt-1">Has alcanzado el límite de {messageLimit.toLocaleString('es-ES')} mensajes. Para seguir enviando, contacta con el administrador para recargar tu cuota.</p>
              </div>
            </div>
          )}
        </div>

        {/* Límite diario */}
        <div className={`rounded-xl p-5 border mb-6 ${dailyExhausted ? 'bg-amber-950/40 border-amber-700' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-white font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Límite diario (anti-spam)
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Máximo {dailyLimit.toLocaleString('es-ES')} mensajes por día. Si se alcanza, la campaña se pausa y continúa mañana automáticamente.
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${dailyExhausted ? 'text-amber-400' : 'text-green-400'}`}>
                {dailyRemaining.toLocaleString('es-ES')}
              </p>
              <p className="text-gray-500 text-xs">hoy de {dailyLimit.toLocaleString('es-ES')}</p>
            </div>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${dailyExhausted ? 'bg-amber-500' : dailyPercentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, dailyPercentUsed)}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">
            Enviados hoy: {(dailyQuota?.usedToday ?? stats?.todaySent ?? 0).toLocaleString('es-ES')} ({dailyPercentUsed}%)
          </p>
          {dailyExhausted && (
            <p className="text-amber-300 text-xs mt-3">
              Límite diario alcanzado. Las campañas pausadas se reanudarán automáticamente a medianoche.
            </p>
          )}
        </div>

        {/* Aviso restricción WhatsApp */}
        <div className="rounded-xl p-4 border border-red-700/60 bg-red-950/40 mb-6 text-sm">
          <p className="font-bold text-red-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Evita que WhatsApp restrinja tu cuenta
          </p>
          <ul className="list-disc list-inside text-xs space-y-1.5 text-red-100/90">
            <li><strong>No envíes a listas frías</strong> (Excel de 10.000 números). WhatsApp lo detecta como spam.</li>
            <li>Máximo <strong>{maxRecipientsPerCampaign} mensajes nuevos/día</strong> y <strong>{maxRecipientsPerCampaign} por campaña</strong>.</li>
            <li>Delay mínimo <strong>{minDelayMs / 1000} s</strong> entre mensajes (recomendado 12–20 s).</li>
            <li>Si ves «Tu cuenta está restringida», <strong>espera 6–24 h</strong> sin enviar nada.</li>
            <li>Prioriza contactos que <strong>ya te hayan escrito</strong> o usuarios registrados en la web.</li>
          </ul>
        </div>

        {/* Consejos envío masivo */}
        <div className="rounded-xl p-4 border border-blue-800/40 bg-blue-950/20 mb-6 text-sm text-blue-100/90">
          <p className="font-semibold text-blue-300 mb-2">Plan seguro para tus 10.000 contactos</p>
          <ul className="list-disc list-inside text-xs space-y-1 text-blue-100/80">
            <li>Divide en campañas de <strong>{maxRecipientsPerCampaign}/día</strong> → ~50 días sin riesgo alto.</li>
            <li>La campaña se <strong>pausa sola</strong> al llegar al límite diario y continúa mañana.</li>
            <li>Si WhatsApp desconecta el dispositivo, vincula de nuevo y pulsa <strong>Reanudar</strong>.</li>
          </ul>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-green-400 mb-1"><CheckCircle className="w-4 h-4" /><span className="text-xs text-gray-400">Enviados</span></div>
            <p className="text-2xl font-black text-white">{stats?.totals?.sent ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-red-400 mb-1"><XCircle className="w-4 h-4" /><span className="text-xs text-gray-400">Fallidos</span></div>
            <p className="text-2xl font-black text-white">{stats?.totals?.failed ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-yellow-400 mb-1"><Clock className="w-4 h-4" /><span className="text-xs text-gray-400">Pendientes</span></div>
            <p className="text-2xl font-black text-white">{stats?.totals?.pending ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-emerald-400 mb-1"><Euro className="w-4 h-4" /><span className="text-xs text-gray-400">Gasto total</span></div>
            <p className="text-xl font-black text-white">{formatEurTotal(stats?.totals?.totalCostEur ?? 0)}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-cyan-400 mb-1"><Euro className="w-4 h-4" /><span className="text-xs text-gray-400">Hoy</span></div>
            <p className="text-xl font-black text-white">{formatEurTotal(stats?.todayCostEur ?? 0)}</p>
            <p className="text-xs text-gray-500">{stats?.todaySent ?? 0} msgs</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-blue-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs text-gray-400">Contactos BD</span></div>
            <p className="text-2xl font-black text-white">{stats?.totals?.contactCount ?? 0}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-purple-400 mb-1"><Phone className="w-4 h-4" /><span className="text-xs text-gray-400">Tel. perfiles web</span></div>
            <p className="text-2xl font-black text-white">{stats?.totals?.profilePhoneCount ?? 0}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Importar contactos */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Upload className="w-5 h-5 text-green-500" /> Base de datos de teléfonos</h2>
            <p className="text-gray-400 text-xs mb-3">
              Sube un Excel con <strong className="text-gray-300">una columna de teléfonos</strong> (sin cabecera, un número por fila) o pega números abajo.
              Ejemplo columna A: <code className="text-gray-300">612345678</code>, <code className="text-gray-300">623456789</code>…
            </p>
            <label className={`flex items-center gap-2 cursor-pointer bg-gray-800 border border-dashed rounded-lg px-3 py-3 text-sm mb-3 transition-colors ${isImportingExcel ? 'border-gray-600 text-gray-500 cursor-wait' : 'border-gray-700 text-gray-400 hover:border-green-600 hover:text-green-400'}`}>
              <Upload className="w-4 h-4 shrink-0" />
              <span>{isImportingExcel ? 'Importando Excel...' : 'Subir Excel con teléfonos (.xlsx, .xls, CSV)'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={handleImportExcel}
                disabled={isImportingExcel}
              />
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder={"612345678\n623456789\n34612345678"}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3 font-mono"
            />
            <div className="flex gap-2">
              <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm">
                Importar números
              </button>
              <button onClick={handleSyncProfiles} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm">
                Sync perfiles web ({stats?.totals?.profilePhoneCount ?? 0})
              </button>
            </div>
            {contacts.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto">
                <p className="text-gray-500 text-xs mb-2">Últimos {contacts.length} de {dbContactCount || contactTotal}:</p>
                {contacts.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-gray-400 py-0.5 group">
                    <span>{c.name ? `${c.name} · ` : ''}{c.phone}</span>
                    <button onClick={() => handleDeleteContact(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nueva campaña */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Send className="w-5 h-5 text-green-500" /> Nueva campaña</h2>
            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Nombre de campaña (opcional)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3"
            />
            <textarea
              value={campaignMessage}
              onChange={(e) => setCampaignMessage(e.target.value)}
              rows={6}
              placeholder="Texto del mensaje (caption). Se envía debajo de la imagen si adjuntas una..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3"
            />
            <div className="mb-3">
              <label className="text-gray-400 text-xs block mb-2 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Imagen adjunta (opcional) — el texto de arriba será el caption
              </label>
              {(campaignImagePreview || campaignImageUrl) && (
                <div className="relative mb-2 inline-block max-w-full">
                  <img
                    src={campaignImagePreview || campaignImageUrl}
                    alt="Vista previa campaña"
                    className="max-h-48 max-w-full rounded-lg border border-gray-700 object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearCampaignImage}
                    className="absolute top-2 right-2 bg-black/80 hover:bg-red-900/90 text-white rounded px-2 py-1 text-xs"
                  >
                    Quitar
                  </button>
                </div>
              )}
              <label className={`flex items-center gap-2 cursor-pointer bg-gray-800 border border-dashed rounded-lg px-3 py-3 text-sm transition-colors ${isUploadingImage ? 'border-gray-600 text-gray-500 cursor-wait' : 'border-gray-700 text-gray-400 hover:border-green-600 hover:text-green-400'}`}>
                <Upload className="w-4 h-4 shrink-0" />
                <span>{isUploadingImage ? 'Subiendo imagen...' : 'Seleccionar imagen (JPG, PNG, WEBP · máx. 10 MB)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleCampaignImageSelect}
                  disabled={isUploadingImage || isSending}
                />
              </label>
            </div>
            <select
              value={campaignSource}
              onChange={(e) => setCampaignSource(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3"
            >
              <option value="contacts_db">Todos los contactos de la BD ({dbContactCount || recipientCount})</option>
              <option value="profiles">Teléfonos de perfiles de la web ({stats?.totals?.profilePhoneCount ?? 0})</option>
              <option value="mixed">BD + perfiles web (sin duplicados)</option>
              <option value="manual">Lista manual (pegar abajo)</option>
            </select>
            {campaignSource === 'manual' && (
              <textarea
                value={manualPhones}
                onChange={(e) => setManualPhones(e.target.value)}
                rows={3}
                placeholder="Números manuales, uno por línea"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3 font-mono"
              />
            )}
            <div className="flex items-center gap-3 mb-3">
              <label className="text-gray-400 text-xs">Delay entre msgs (ms):</label>
              <input type="number" min={8000} max={60000} step={1000} value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
              <span className="text-gray-500 text-xs">Mín. {minDelayMs / 1000} s · recomendado 12–20 s</span>
            </div>
            <p className="text-gray-500 text-xs mb-1">
              Destinatarios: <span className="text-white font-bold">{recipientCount}</span> · Emisor:{' '}
              <span className="text-green-400">+{activeInstance?.owner || senderPhone || '—'}</span>
            </p>
            <p className="text-gray-500 text-xs mb-1">
              Mensajes restantes (total): <span className={`font-bold ${campaignExceedsQuota ? 'text-red-400' : 'text-green-400'}`}>{messagesRemaining.toLocaleString('es-ES')}</span>
            </p>
            <p className="text-gray-500 text-xs mb-1">
              Disponibles hoy: <span className={`font-bold ${campaignExceedsDaily ? 'text-amber-400' : 'text-green-400'}`}>{dailyRemaining.toLocaleString('es-ES')}</span>
              {campaignExceedsDaily && recipientCount > 0 && (
                <span className="text-amber-400/80"> — se pausará al llegar al límite diario</span>
              )}
            </p>
            {campaignExceedsMaxRecipients && recipientCount > 0 && (
              <p className="text-red-400 text-xs mb-1">
                Máximo {maxRecipientsPerCampaign} destinatarios por campaña. Divide en varios días ({Math.ceil(recipientCount / maxRecipientsPerCampaign)} campañas).
              </p>
            )}
            <p className="text-gray-500 text-xs mb-3">
              Coste estimado: <span className="text-emerald-400 font-bold">{formatEurTotal(recipientCount * COST_PER_MSG)}</span>
            </p>
            <button
              onClick={handleCreateCampaign}
              disabled={isSending || !canLaunchCampaign}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg"
            >
              <Play className="w-5 h-5" />
              {isSending ? 'Iniciando...' : quotaExhausted ? 'Cuota agotada' : 'Lanzar campaña'}
            </button>
            {!connected && (
              <p className="text-red-400 text-xs mt-2 text-center">Vincula tu WhatsApp arriba antes de enviar</p>
            )}
            {quotaExhausted && (
              <p className="text-red-400 text-xs mt-2 text-center">Contacta con el administrador para recargar mensajes</p>
            )}
            {canSendMessages && campaignExceedsQuota && (
              <p className="text-red-400 text-xs mt-2 text-center">Esta campaña supera tus mensajes restantes totales</p>
            )}
            {dailyExhausted && !quotaExhausted && (
              <p className="text-amber-400 text-xs mt-2 text-center">Límite diario alcanzado. Vuelve mañana o contacta al administrador.</p>
            )}
          </div>
        </div>

        {/* Test message */}
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 mb-8">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Phone className="w-5 h-5" /> Envío de prueba</h2>
          <p className="text-gray-500 text-xs mb-3">Se enviará desde: <span className="text-green-400">+{activeInstance?.owner || senderPhone || '—'}</span></p>
          <div className="flex flex-wrap gap-3">
            <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="612345678" className="flex-1 min-w-[150px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Mensaje de prueba" className="flex-[2] min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            <button onClick={handleTest} disabled={!testPhone || !connected || !canSendMessages} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">Enviar prueba</button>
          </div>
        </div>

        {/* Historial campañas */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-bold">Historial de campañas ({stats?.totals?.campaigns ?? campaigns.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-800">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Emisor</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Enviados</th>
                  <th className="px-5 py-3">Fallidos</th>
                  <th className="px-5 py-3">Gasto</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{c.instanceName || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        c.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                        c.status === 'running' ? 'bg-yellow-900/50 text-yellow-400' :
                        c.status === 'paused' ? 'bg-amber-900/50 text-amber-400' :
                        c.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                        c.status === 'cancelled' ? 'bg-gray-700 text-gray-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>{c.status === 'paused' ? 'pausada' : c.status}</span>
                    </td>
                    <td className="px-5 py-3 text-green-400">{c.sentCount}/{c.totalCount}</td>
                    <td className="px-5 py-3 text-red-400">{c.failedCount}</td>
                    <td className="px-5 py-3 text-emerald-400">{formatEurTotal(c.totalCostEur)}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(c.createdAt).toLocaleString('es-ES')}</td>
                    <td className="px-5 py-3 flex gap-2 flex-wrap">
                      <button onClick={() => openCampaign(c.id)} className="text-blue-400 hover:text-blue-300 text-xs">Ver</button>
                      {c.status === 'paused' && (
                        <button onClick={() => handleResume(c.id)} className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1"><Play className="w-3 h-3" />Reanudar</button>
                      )}
                      {(c.status === 'running' || c.status === 'pending' || c.status === 'paused') && (
                        <button onClick={() => handleCancel(c.id)} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><Ban className="w-3 h-3" />Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-500">No hay campañas aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal detalle campaña */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCampaign(null)}>
            <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold">{selectedCampaign.name}</h3>
                  {selectedCampaign.instanceName && (
                    <p className="text-gray-500 text-xs">Emisor: {selectedCampaign.instanceName}</p>
                  )}
                </div>
                <button onClick={() => setSelectedCampaign(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[60vh]">
                <p className="text-gray-400 text-sm mb-2">Mensaje: <span className="text-white whitespace-pre-wrap">{selectedCampaign.message || '—'}</span></p>
                {selectedCampaign.imageUrl && (
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs mb-1">Imagen adjunta:</p>
                    <img src={selectedCampaign.imageUrl} alt="Campaña" className="max-h-40 rounded-lg border border-gray-700" />
                  </div>
                )}
                <p className="text-emerald-400 text-sm mb-2">Gasto: {formatEurTotal(selectedCampaign.totalCostEur)} · {selectedCampaign.sentCount} enviados · {selectedCampaign.failedCount} fallidos</p>
                {selectedCampaign.status === 'paused' && selectedCampaign.pauseReason && (
                  <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-200 text-xs">
                    <p className="font-semibold text-amber-300 mb-1">Campaña pausada</p>
                    <p>{selectedCampaign.pauseReason}</p>
                    <button
                      onClick={() => handleResume(selectedCampaign.id)}
                      className="mt-3 flex items-center gap-1 text-green-400 hover:text-green-300 font-semibold"
                    >
                      <Play className="w-3.5 h-3.5" /> Reanudar envío
                    </button>
                  </div>
                )}
                <div className="space-y-1">
                  {(selectedCampaign.messages || []).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50">
                      <span className="text-gray-300">{m.name ? `${m.name} · ` : ''}{m.phone}</span>
                      <span className={m.status === 'sent' ? 'text-green-400' : m.status === 'failed' ? 'text-red-400' : 'text-gray-500'}>{m.status}{m.error ? `: ${m.error.slice(0, 40)}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
