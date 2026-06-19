import { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Crown,
  Mail,
  Target,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { getStats } from '../services/admin.api';
import AdminHeader from '../components/admin/AdminHeader';
import AdminNav from '../components/admin/AdminNav';

interface Stats {
  users: {
    total: number;
    verified: number;
    unverified: number;
    online: number;
    activeLast24h: number;
    newLast7days: number;
    newLast30days: number;
  };
  profiles: {
    total: number;
    real: number;
    fake: number;
  };
  activity: {
    reports: number;
    blocks: number;
  };
  subscriptions: {
    active: number;
    conversionRate: string;
  };
  conversion: {
    emailVerificationRate: string;
    profileCompletionRate: string;
  };
  registrationsByDay: { date: string; count: number }[];
  mostReportedProfiles: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoadError('');
      const data = await getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setLoadError(error.response?.data?.error || 'No se pudieron cargar las estadísticas del servidor');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo-caperucitas.jpeg" alt="Caperucitas" className="h-20 w-auto rounded-xl animate-pulse" />
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const maxReg = Math.max(...(stats?.registrationsByDay.map(d => d.count) || [1]), 1);

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Panel de Control</h1>
            <p className="text-gray-400 text-sm mt-1">Caperucitas.com · Vista general</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {loadError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-xl text-sm">
            {loadError}. Pulsa «Actualizar» o vuelve a iniciar sesión en el panel admin.
          </div>
        )}

        {/* KPIs principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Usuarios totales */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <Users className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-3xl font-black text-white">{stats?.users.total ?? 0}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Usuarios totales</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-green-400 font-semibold">+{stats?.users.newLast7days ?? 0}</span>
              <span className="text-gray-500">esta semana</span>
            </div>
          </div>

          {/* Perfiles reales */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-pink-600/20 rounded-lg">
                <Target className="w-5 h-5 text-pink-400" />
              </div>
              <span className="text-3xl font-black text-white">{stats?.profiles.real ?? 0}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Perfiles publicados</p>
            <div className="mt-2 text-xs text-gray-500">
              Total con ficticios: {stats?.profiles.total ?? 0}
            </div>
          </div>

          {/* Denuncias */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-600/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-3xl font-black text-white">{stats?.activity.reports ?? 0}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Denuncias totales</p>
            <div className="mt-2 text-xs text-gray-500">
              {stats?.activity.blocks ?? 0} bloqueos registrados
            </div>
          </div>

          {/* Suscripciones activas */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-3xl font-black text-white">{stats?.subscriptions.active ?? 0}</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">Suscripciones activas</p>
            <div className="mt-2 text-xs text-gray-500">
              Conversión: {stats?.subscriptions.conversionRate ?? '0'}%
            </div>
          </div>
        </div>

        {/* Fila secundaria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Verificación email */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-bold">Verificación email</h3>
            </div>
            <div className="text-4xl font-black text-white mb-1">{stats?.conversion.emailVerificationRate ?? '0'}%</div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${stats?.conversion.emailVerificationRate ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{stats?.users.verified ?? 0} verificados</span>
              <span>{stats?.users.unverified ?? 0} sin verificar</span>
            </div>
          </div>

          {/* Completado de perfil */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-bold">Perfiles completados</h3>
            </div>
            <div className="text-4xl font-black text-white mb-1">{stats?.conversion.profileCompletionRate ?? '0'}%</div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${stats?.conversion.profileCompletionRate ?? 0}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {stats?.profiles.real ?? 0} perfiles reales de {stats?.users.total ?? 0} usuarios
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-bold">Últimos 30 días</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Nuevos usuarios</span>
                <span className="text-white font-bold">+{stats?.users.newLast30days ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Activos (24h)</span>
                <span className="text-white font-bold">{stats?.users.activeLast24h ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Online ahora</span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                  {stats?.users.online ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de registros */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-bold">Nuevos registros — últimos 7 días</h3>
            </div>
            <span className="text-sm text-gray-400">
              Total: <span className="text-red-400 font-bold">{stats?.users.newLast7days ?? 0}</span>
            </span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {stats?.registrationsByDay.map((day, idx) => {
              const h = maxReg > 0 ? (day.count / maxReg) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <div
                      className="w-full bg-red-600 hover:bg-red-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(h, day.count > 0 ? 8 : 0)}%` }}
                      title={`${day.count} registros`}
                    />
                    {day.count > 0 && (
                      <span className="absolute -top-6 text-xs font-bold text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 uppercase">
                    {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top denunciados */}
        {stats?.mostReportedProfiles && stats.mostReportedProfiles.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-bold">Perfiles más denunciados</h3>
            </div>
            <div className="space-y-3">
              {stats.mostReportedProfiles.map((profile, idx) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500/40 transition"
                >
                  <span className="w-7 h-7 flex items-center justify-center bg-orange-600/20 text-orange-400 rounded-full text-sm font-black shrink-0">
                    {idx + 1}
                  </span>
                  {profile.photos?.[0] && (
                    <img
                      src={profile.photos[0].url}
                      alt={profile.title}
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{profile.title}</p>
                    <p className="text-gray-400 text-xs truncate">{profile.user?.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-orange-400 font-black text-xl">{profile._count.reportsReceived}</div>
                    <div className="text-gray-500 text-xs">denuncias</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">
          Última actualización: {lastUpdated.toLocaleTimeString('es-ES')} · Auto-refresco cada 60s
        </p>
      </main>
    </div>
  );
}
