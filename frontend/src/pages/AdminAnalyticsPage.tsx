import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  RefreshCw,
  Users,
  Eye,
  Globe,
  TrendingUp,
  Radio,
  ExternalLink,
  AlertTriangle,
  MousePointerClick,
  UserPlus,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import { getAnalyticsDashboard } from '../services/admin.api';

interface Ga4Setup {
  configured: false;
  measurementId?: string | null;
  steps: { title: string; detail: string }[];
  links: { analytics: string; cloudConsole: string };
  error?: string;
}

interface Ga4Data {
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

type AnalyticsResponse = Ga4Data | Ga4Setup;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const result = await getAnalyticsDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al cargar analíticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const setup = data && !data.configured ? (data as Ga4Setup) : null;
  const ga = data && data.configured ? (data as Ga4Data) : null;
  const maxWeekUsers = ga ? Math.max(...ga.last7Days.map((d) => d.users), 1) : 1;

  return (
    <AdminLayout
      title="Analíticas Web"
      subtitle="Google Analytics 4 · caperucitas.com"
      icon={<BarChart3 className="w-7 h-7 text-[#fc4d5c]" />}
      actions={
        <div className="flex gap-2">
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Abrir GA4
          </a>
          <button
            onClick={() => { setIsLoading(true); load().finally(() => setIsLoading(false)); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      }
    >
      {(error || setup?.error) && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error || setup?.error}
        </div>
      )}

      {setup && (
        <div className="bg-gray-900 rounded-xl border border-amber-700/50 p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-2">Configura Google Analytics para caperucitas.com</h2>
          <p className="text-gray-400 text-sm mb-6">
            Aún no hay conexión con GA4. Sigue estos pasos para ver usuarios en directo, visitas y páginas más vistas desde este panel.
          </p>
          <div className="space-y-4">
            {setup.steps.map((step) => (
              <div key={step.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fc4d5c]/20 text-[#fc4d5c] flex items-center justify-center shrink-0 text-sm font-bold">
                  {step.title.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{step.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-6">
            <a
              href={setup.links.analytics}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#fc4d5c] hover:bg-[#e03d4c] text-white rounded-lg text-sm font-semibold"
            >
              Crear cuenta GA4
            </a>
            <a
              href={setup.links.cloudConsole}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm"
            >
              Activar API en Google Cloud
            </a>
          </div>
        </div>
      )}

      {ga && (
        <>
          {/* Tiempo real */}
          <div className="bg-gradient-to-br from-green-950/40 to-gray-900 rounded-xl border border-green-700/40 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Radio className="w-5 h-5 text-green-400 animate-pulse" />
                Usuarios en directo
              </h2>
              <span className="text-xs text-gray-500">
                Actualizado: {new Date(ga.fetchedAt).toLocaleTimeString('es-ES')}
              </span>
            </div>
            <p className="text-5xl font-black text-green-400 mb-1">{ga.realtime.activeUsers}</p>
            <p className="text-gray-500 text-sm mb-6">personas navegando ahora mismo</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-2 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Por país</p>
                <div className="space-y-1">
                  {ga.realtime.byCountry.length === 0 && <p className="text-gray-600 text-xs">Sin datos aún</p>}
                  {ga.realtime.byCountry.map((c) => (
                    <div key={c.country} className="flex justify-between text-sm">
                      <span className="text-gray-300">{c.country}</span>
                      <span className="text-green-400 font-semibold">{c.users}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-2 flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> Página activa</p>
                <div className="space-y-1">
                  {ga.realtime.byPage.length === 0 && <p className="text-gray-600 text-xs">Sin datos aún</p>}
                  {ga.realtime.byPage.map((p) => (
                    <div key={p.page} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-300 truncate">{p.page}</span>
                      <span className="text-green-400 font-semibold shrink-0">{p.users}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs hoy */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 text-blue-400 mb-1"><Users className="w-4 h-4" /><span className="text-xs text-gray-400">Usuarios hoy</span></div>
              <p className="text-2xl font-black text-white">{ga.today.activeUsers}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 text-purple-400 mb-1"><TrendingUp className="w-4 h-4" /><span className="text-xs text-gray-400">Sesiones hoy</span></div>
              <p className="text-2xl font-black text-white">{ga.today.sessions}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 text-cyan-400 mb-1"><Eye className="w-4 h-4" /><span className="text-xs text-gray-400">Páginas vistas hoy</span></div>
              <p className="text-2xl font-black text-white">{ga.today.pageViews}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 text-emerald-400 mb-1"><UserPlus className="w-4 h-4" /><span className="text-xs text-gray-400">Usuarios nuevos hoy</span></div>
              <p className="text-2xl font-black text-white">{ga.today.newUsers}</p>
            </div>
          </div>

          {/* Gráfico 7 días */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
            <h2 className="text-white font-bold mb-4">Últimos 7 días</h2>
            <div className="flex items-end gap-2 h-40">
              {ga.last7Days.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{d.users}</span>
                  <div
                    className="w-full bg-[#fc4d5c]/80 rounded-t"
                    style={{ height: `${Math.max(8, (d.users / maxWeekUsers) * 100)}%` }}
                    title={`${d.sessions} sesiones · ${d.pageViews} vistas`}
                  />
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{formatDate(d.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top páginas */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-bold mb-4">Páginas más visitadas (7 días)</h2>
              <div className="space-y-2">
                {ga.topPages.map((p) => (
                  <div key={p.path} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-300 truncate font-mono text-xs">{p.path}</span>
                    <span className="text-[#fc4d5c] font-semibold shrink-0">{p.views}</span>
                  </div>
                ))}
                {ga.topPages.length === 0 && <p className="text-gray-600 text-sm">Sin datos todavía</p>}
              </div>
            </div>

            {/* Fuentes tráfico */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-white font-bold mb-4">Origen del tráfico (7 días)</h2>
              <div className="space-y-2">
                {ga.sources.map((s) => (
                  <div key={`${s.source}-${s.medium}`} className="flex justify-between text-sm">
                    <span className="text-gray-300">{s.source} / {s.medium}</span>
                    <span className="text-purple-400 font-semibold">{s.sessions}</span>
                  </div>
                ))}
                {ga.sources.length === 0 && <p className="text-gray-600 text-sm">Sin datos todavía</p>}
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-xs mt-6 text-center">
            Propiedad GA4: {ga.propertyId}
            {ga.measurementId ? ` · Medición: ${ga.measurementId}` : ''}
          </p>
        </>
      )}
    </AdminLayout>
  );
}
