import { BetaAnalyticsDataClient } from '@google-analytics/data';

let client: BetaAnalyticsDataClient | null = null;

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(process.env.GA4_PROPERTY_ID && getServiceAccountCredentials());
}

function getServiceAccountCredentials(): Record<string, unknown> | null {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn('GA4_SERVICE_ACCOUNT_JSON inválido');
    return null;
  }
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
      'La cuenta de servicio no tiene permiso para leer esta propiedad GA4.',
      email ? `Añade este email en GA4 → Admin → Acceso a la propiedad → Lector: ${email}` : '',
      `Verifica que GA4_PROPERTY_ID=${propertyId} sea el ID numérico correcto (Admin → Detalles de la propiedad).`,
      'Tras añadir el permiso, espera 1–2 minutos y pulsa Actualizar.',
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (msg.includes('INVALID_ARGUMENT') && msg.includes('property')) {
    return `GA4_PROPERTY_ID incorrecto (${propertyId}). Debe ser el ID numérico de la propiedad, no G-65MTSFL92G.`;
  }

  return msg;
}

function getPropertyId(): string {
  const id = (process.env.GA4_PROPERTY_ID || '').replace(/^properties\//, '').trim();
  if (!id) throw new Error('GA4_PROPERTY_ID no configurado');
  return id;
}

function getClient(): BetaAnalyticsDataClient {
  if (!client) {
    const credentials = getServiceAccountCredentials();
    if (!credentials) {
      throw new Error('Credenciales GA4 no configuradas');
    }
    client = new BetaAnalyticsDataClient({ credentials });
  }
  return client;
}

function propertyPath(): string {
  return `properties/${getPropertyId()}`;
}

function rowMetric(row: { metricValues?: { value?: string | null }[] | null }, index = 0): number {
  return Number(row.metricValues?.[index]?.value || 0);
}

function rowDim(row: { dimensionValues?: { value?: string | null }[] | null }, index = 0): string {
  return row.dimensionValues?.[index]?.value || '(not set)';
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
    measurementId: process.env.GA4_MEASUREMENT_ID || null,
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
        detail: 'Copia el ID G-XXXXXXXXXX y añádelo en Vercel como VITE_GA_TRACKING_ID. Redeploy del frontend.',
      },
      {
        title: '4. ID de propiedad (backend)',
        detail: 'Admin → Detalles de la propiedad → copia el ID numérico (ej. 123456789) → Railway: GA4_PROPERTY_ID',
      },
      {
        title: '5. API y cuenta de servicio',
        detail: 'Google Cloud Console → APIs → activar «Google Analytics Data API» → Credenciales → Cuenta de servicio → Crear clave JSON.',
      },
      {
        title: '6. Permisos en GA4',
        detail: 'GA4 Admin → Acceso a la propiedad → Añadir usuario → email de la cuenta de servicio → Rol «Lector».',
      },
      {
        title: '7. Railway backend',
        detail: 'Pega el JSON completo de la clave en GA4_SERVICE_ACCOUNT_JSON (una sola línea). Redeploy Railway.',
      },
    ],
    links: {
      analytics: 'https://analytics.google.com/',
      cloudConsole: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
    },
  };
}

export async function fetchGa4Dashboard(): Promise<Ga4DashboardData | ReturnType<typeof getGa4SetupInstructions>> {
  if (!isGoogleAnalyticsConfigured()) {
    return getGa4SetupInstructions();
  }

  const ga = getClient();
  const property = propertyPath();

  const [realtimeUsers, realtimeCountries, realtimePages, todayReport, weekReport, topPagesReport, sourcesReport] =
    await Promise.all([
      ga.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
      }),
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
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
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
    propertyId: getPropertyId(),
    measurementId: process.env.GA4_MEASUREMENT_ID || process.env.VITE_GA_TRACKING_ID || null,
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
      const iso =
        raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;
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
