import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

let dataClient: BetaAnalyticsDataClient | null = null;
let adminClient: AnalyticsAdminServiceClient | null = null;

/** Parsea JSON de Railway tolerando errores habituales al pegar */
export function parseServiceAccountJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const attempts = [
    trimmed,
    trimmed.replace(/^['"]|['"]$/g, ''),
    trimmed.replace(/\\n/g, '\n'),
  ];

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as Record<string, unknown>;
      if (parsed.private_key && typeof parsed.private_key === 'string') {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n');
      }
      if (parsed.type === 'service_account' && parsed.client_email && parsed.private_key) {
        return parsed;
      }
    } catch {
      /* siguiente intento */
    }
  }

  return null;
}

export function getServiceAccountCredentials(): Record<string, unknown> | null {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  const parsed = parseServiceAccountJson(raw);
  if (!parsed) console.warn('GA4_SERVICE_ACCOUNT_JSON inválido o incompleto');
  return parsed;
}

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID?.trim() && getServiceAccountCredentials());
}

export function getServiceAccountEmail(): string | null {
  const creds = getServiceAccountCredentials();
  const email = creds?.client_email;
  return typeof email === 'string' ? email : null;
}

export function formatGa4Error(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const email = getServiceAccountEmail();
  const propertyId = process.env.GA4_PROPERTY_ID || '?';

  if (msg.includes('PERMISSION_DENIED') || msg.includes('permission')) {
    return [
      'Sin permiso para leer esta propiedad GA4.',
      email ? `Email cuenta de servicio: ${email}` : '',
      `Property ID configurado: ${propertyId}`,
      'Ve a Admin → Acceso a la PROPIEDAD (columna del medio) → añade el email como Lector.',
      'Si ya lo hiciste, el GA4_PROPERTY_ID numérico puede ser incorrecto. Usa /admin/analytics → Diagnóstico.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (msg.includes('INVALID_ARGUMENT') && msg.includes('property')) {
    return `GA4_PROPERTY_ID incorrecto (${propertyId}). Debe ser el ID numérico, no G-65MTSFL92G.`;
  }

  return msg;
}

function getPropertyId(): string {
  const id = (process.env.GA4_PROPERTY_ID || '').replace(/^properties\//, '').trim();
  if (!id) throw new Error('GA4_PROPERTY_ID no configurado');
  return id;
}

function getCredentials() {
  const credentials = getServiceAccountCredentials();
  if (!credentials) throw new Error('Credenciales GA4 no configuradas o JSON inválido');
  return credentials;
}

function getDataClient(): BetaAnalyticsDataClient {
  if (!dataClient) {
    dataClient = new BetaAnalyticsDataClient({ credentials: getCredentials() });
  }
  return dataClient;
}

function getAdminClient(): AnalyticsAdminServiceClient {
  if (!adminClient) {
    adminClient = new AnalyticsAdminServiceClient({ credentials: getCredentials() });
  }
  return adminClient;
}

function propertyPath(id?: string): string {
  return `properties/${id || getPropertyId()}`;
}

function rowMetric(row: { metricValues?: { value?: string | null }[] | null }, index = 0): number {
  return Number(row.metricValues?.[index]?.value || 0);
}

function rowDim(row: { dimensionValues?: { value?: string | null }[] | null }, index = 0): string {
  return row.dimensionValues?.[index]?.value || '(not set)';
}

export interface Ga4AccessibleProperty {
  propertyId: string;
  displayName: string;
  account: string;
}

export async function listAccessibleGa4Properties(): Promise<Ga4AccessibleProperty[]> {
  const admin = getAdminClient();
  const [summaries] = await admin.listAccountSummaries();
  const results: Ga4AccessibleProperty[] = [];

  for (const account of summaries || []) {
    for (const prop of account.propertySummaries || []) {
      const resource = prop.property || '';
      const propertyId = resource.replace('properties/', '');
      if (!propertyId) continue;
      results.push({
        propertyId,
        displayName: prop.displayName || propertyId,
        account: account.displayName || account.account || '',
      });
    }
  }
  return results;
}

export interface Ga4Diagnostics {
  jsonValid: boolean;
  serviceAccountEmail: string | null;
  configuredPropertyId: string | null;
  measurementId: string | null;
  accessibleProperties: Ga4AccessibleProperty[];
  configuredPropertyAccessible: boolean;
  realtimeTest: { ok: boolean; activeUsers?: number; error?: string };
  suggestedPropertyId: string | null;
}

export async function runGa4Diagnostics(): Promise<Ga4Diagnostics> {
  const creds = getServiceAccountCredentials();
  const configuredPropertyId = process.env.GA4_PROPERTY_ID?.trim() || null;

  const base: Ga4Diagnostics = {
    jsonValid: Boolean(creds),
    serviceAccountEmail: getServiceAccountEmail(),
    configuredPropertyId,
    measurementId: process.env.GA4_MEASUREMENT_ID || 'G-65MTSFL92G',
    accessibleProperties: [],
    configuredPropertyAccessible: false,
    realtimeTest: { ok: false, error: 'Sin credenciales' },
    suggestedPropertyId: null,
  };

  if (!creds) {
    base.realtimeTest.error = 'GA4_SERVICE_ACCOUNT_JSON inválido. Revisa que el JSON esté completo en Railway (private_key incluido).';
    return base;
  }

  try {
    base.accessibleProperties = await listAccessibleGa4Properties();
  } catch (err) {
    base.realtimeTest.error = `No se pudieron listar propiedades: ${formatGa4Error(err)}`;
    return base;
  }

  if (base.accessibleProperties.length === 0) {
    base.realtimeTest.error =
      'La cuenta de servicio no tiene acceso a ninguna propiedad GA4. Añádela en Admin → Acceso a la propiedad → Lector.';
    return base;
  }

  base.suggestedPropertyId = base.accessibleProperties[0]?.propertyId || null;

  const testPropertyId =
    configuredPropertyId && base.accessibleProperties.some((p) => p.propertyId === configuredPropertyId)
      ? configuredPropertyId
      : base.suggestedPropertyId;

  base.configuredPropertyAccessible = Boolean(
    configuredPropertyId && base.accessibleProperties.some((p) => p.propertyId === configuredPropertyId)
  );

  if (!testPropertyId) {
    base.realtimeTest.error = 'No hay property ID para probar';
    return base;
  }

  try {
    const ga = getDataClient();
    const [response] = await ga.runRealtimeReport({
      property: propertyPath(testPropertyId),
      metrics: [{ name: 'activeUsers' }],
    });
    base.realtimeTest = {
      ok: true,
      activeUsers: rowMetric(response?.rows?.[0] || {}),
    };
    if (!base.configuredPropertyAccessible && configuredPropertyId) {
      base.realtimeTest.error = `GA4_PROPERTY_ID=${configuredPropertyId} NO coincide. Usa ${testPropertyId} (${base.accessibleProperties.find((p) => p.propertyId === testPropertyId)?.displayName})`;
    }
  } catch (err) {
    base.realtimeTest = { ok: false, error: formatGa4Error(err) };
  }

  return base;
}

export interface Ga4DashboardData {
  configured: true;
  propertyId: string;
  measurementId: string | null;
  realtime: {
    activeUsers: number;
    byCountry: { country: string; users: number }[];
    byPage: { page: string; users: number }[];
  };
  today: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    newUsers: number;
  };
  last7Days: { date: string; users: number; sessions: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
  sources: { source: string; medium: string; sessions: number }[];
  fetchedAt: string;
}

export function getGa4SetupInstructions() {
  return {
    configured: false as const,
    measurementId: process.env.GA4_MEASUREMENT_ID || 'G-65MTSFL92G',
    steps: [
      {
        title: '1. Crear propiedad GA4',
        detail: 'Entra en https://analytics.google.com → Admin → Crear cuenta «Caperucitas» → Crear propiedad «caperucitas.com».',
      },
      {
        title: '2. Flujo web',
        detail: 'Admin → Flujos de datos → Añadir flujo → Web → URL https://www.caperucitas.com',
      },
      {
        title: '3. ID de medición (frontend)',
        detail: 'VITE_GA_TRACKING_ID=G-65MTSFL92G en Vercel.',
      },
      {
        title: '4. ID de propiedad (backend)',
        detail: 'Admin → Detalles de la propiedad → ID numérico (NO es G-...) → Railway: GA4_PROPERTY_ID',
      },
      {
        title: '5. API y cuenta de servicio',
        detail: 'Google Cloud → activar «Google Analytics Data API» + «Google Analytics Admin API» → Cuenta de servicio → JSON.',
      },
      {
        title: '6. Permisos en GA4',
        detail: 'Admin → columna PROPIEDAD → Acceso a la propiedad → email de la cuenta de servicio → Lector.',
      },
      {
        title: '7. Railway',
        detail: 'GA4_SERVICE_ACCOUNT_JSON = JSON completo en una línea. Pulsa Diagnóstico en este panel para verificar.',
      },
    ],
    links: {
      analytics: 'https://analytics.google.com/',
      cloudConsole: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
    },
  };
}

async function resolvePropertyIdForFetch(): Promise<string> {
  const configured = getPropertyId();
  try {
    const accessible = await listAccessibleGa4Properties();
    if (accessible.some((p) => p.propertyId === configured)) return configured;
    if (accessible.length === 1) {
      console.warn(`GA4: usando propiedad accesible ${accessible[0].propertyId} en lugar de ${configured}`);
      return accessible[0].propertyId;
    }
    if (accessible.length > 0) {
      const match = accessible.find((p) =>
        p.displayName.toLowerCase().includes('caperucita')
      );
      if (match) return match.propertyId;
    }
  } catch {
    /* usar configured */
  }
  return configured;
}

export async function fetchGa4Dashboard(): Promise<Ga4DashboardData | ReturnType<typeof getGa4SetupInstructions>> {
  if (!isGoogleAnalyticsConfigured()) {
    return getGa4SetupInstructions();
  }

  const propertyId = await resolvePropertyIdForFetch();
  const property = propertyPath(propertyId);
  const ga = getDataClient();

  const [realtimeUsers, realtimeCountries, realtimePages, todayReport, weekReport, topPagesReport, sourcesReport] =
    await Promise.all([
      ga.runRealtimeReport({ property, metrics: [{ name: 'activeUsers' }] }),
      ga.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
        dimensions: [{ name: 'country' }],
        limit: 10,
      }),
      ga.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
        dimensions: [{ name: 'unifiedScreenName' }],
        limit: 10,
      }),
      ga.runReport({
        property,
        dateRanges: [{ startDate: 'today', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'newUsers' },
        ],
      }),
      ga.runReport({
        property,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      ga.runReport({
        property,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      ga.runReport({
        property,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
    ]);

  const todayRow = todayReport[0]?.rows?.[0];

  return {
    configured: true,
    propertyId,
    measurementId: process.env.GA4_MEASUREMENT_ID || 'G-65MTSFL92G',
    realtime: {
      activeUsers: rowMetric(realtimeUsers[0]?.rows?.[0] || {}),
      byCountry: (realtimeCountries[0]?.rows || []).map((row) => ({
        country: rowDim(row, 0),
        users: rowMetric(row),
      })),
      byPage: (realtimePages[0]?.rows || []).map((row) => ({
        page: rowDim(row, 0),
        users: rowMetric(row),
      })),
    },
    today: {
      activeUsers: rowMetric(todayRow || {}),
      sessions: rowMetric(todayRow || {}, 1),
      pageViews: rowMetric(todayRow || {}, 2),
      newUsers: rowMetric(todayRow || {}, 3),
    },
    last7Days: (weekReport[0]?.rows || []).map((row) => {
      const raw = rowDim(row, 0);
      const iso = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
      return {
        date: iso,
        users: rowMetric(row, 0),
        sessions: rowMetric(row, 1),
        pageViews: rowMetric(row, 2),
      };
    }),
    topPages: (topPagesReport[0]?.rows || []).map((row) => ({
      path: rowDim(row, 0),
      views: rowMetric(row),
    })),
    sources: (sourcesReport[0]?.rows || []).map((row) => ({
      source: rowDim(row, 0),
      medium: rowDim(row, 1),
      sessions: rowMetric(row),
    })),
    fetchedAt: new Date().toISOString(),
  };
}
