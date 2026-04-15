import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  X,
  Trash2,
  UserX,
  Search,
  Ghost,
  Clock,
} from 'lucide-react';
import { getAllReports, deleteReport, deleteUser } from '../services/admin.api';
import AdminHeader from '../components/admin/AdminHeader';
import AdminNav from '../components/admin/AdminNav';

interface Report {
  id: string;
  reason: string;
  createdAt: string;
  reporterIp?: string;
  reporterProfile: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    user?: { email: string };
  } | null;
  reportedProfile: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    user: { id: string; email: string };
    _count: { reportsReceived: number };
  };
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  scam:        { label: 'Engaño o estafa',    color: 'bg-red-900/40 text-red-400 border-red-600/40' },
  fake_photos: { label: 'Fotos falsas',       color: 'bg-orange-900/40 text-orange-400 border-orange-600/40' },
  underage:    { label: 'Es menor de edad',   color: 'bg-yellow-900/40 text-yellow-400 border-yellow-600/40' },
};

type FilterReason = 'all' | 'scam' | 'fake_photos' | 'underage';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filtered, setFiltered] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterReason>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadReports(); }, []);

  useEffect(() => {
    let result = [...reports];
    if (filter !== 'all') result = result.filter(r => r.reason === filter);
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(r =>
        r.reportedProfile.title.toLowerCase().includes(term) ||
        r.reportedProfile.user.email.toLowerCase().includes(term) ||
        r.reporterProfile?.title.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }, [filter, search, reports]);

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (reportId: string) => {
    if (!confirm('¿Descartar esta denuncia?')) return;
    setActionLoading(reportId);
    try {
      await deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch {
      alert('Error al descartar la denuncia');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, reportId: string) => {
    if (!confirm('¿ELIMINAR este usuario y todos sus datos? Esta acción es irreversible.')) return;
    setActionLoading(reportId);
    try {
      await deleteUser(userId);
      setReports(prev => prev.filter(r => r.reportedProfile.user.id !== userId));
    } catch {
      alert('Error al eliminar el usuario');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    all: reports.length,
    scam: reports.filter(r => r.reason === 'scam').length,
    fake_photos: reports.filter(r => r.reason === 'fake_photos').length,
    underage: reports.filter(r => r.reason === 'underage').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando denuncias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminHeader />
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Gestión de denuncias</h1>
          <p className="text-gray-400 text-sm mt-1">Revisa y actúa sobre las denuncias recibidas en Caperucitas.com</p>
        </div>

        {/* Tarjetas de resumen por tipo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { key: 'all',        label: 'Todas',              count: counts.all,        color: 'text-white',        bg: 'bg-gray-800' },
            { key: 'scam',       label: 'Engaño / estafa',   count: counts.scam,       color: 'text-red-400',      bg: 'bg-red-900/20' },
            { key: 'fake_photos',label: 'Fotos falsas',      count: counts.fake_photos,color: 'text-orange-400',   bg: 'bg-orange-900/20' },
            { key: 'underage',   label: 'Menor de edad',     count: counts.underage,   color: 'text-yellow-400',   bg: 'bg-yellow-900/20' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as FilterReason)}
              className={`rounded-xl p-4 border text-left transition ${
                filter === item.key
                  ? 'border-red-600 ' + item.bg
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className={`text-2xl font-black ${item.color}`}>{item.count}</div>
              <div className="text-gray-400 text-xs mt-1">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email del perfil denunciado..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>

        {/* Lista de denuncias */}
        {filtered.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-16 border border-gray-800 text-center">
            <Shield className="w-14 h-14 text-green-600 mx-auto mb-3" />
            <p className="text-white font-semibold">No hay denuncias</p>
            <p className="text-gray-500 text-sm mt-1">Todo está en orden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(report => {
              const reasonInfo = REASON_LABELS[report.reason] ?? { label: report.reason, color: 'bg-gray-700 text-gray-300 border-gray-600' };
              const isAnonymous = !report.reporterProfile;
              const loading = actionLoading === report.id;

              return (
                <div
                  key={report.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
                >
                  {/* Header de la denuncia */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-950/50">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${reasonInfo.color}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {reasonInfo.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Perfil denunciado */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Perfil denunciado</p>
                        <div className="flex items-center gap-3">
                          {report.reportedProfile.photos[0] ? (
                            <img
                              src={report.reportedProfile.photos[0].url}
                              alt={report.reportedProfile.title}
                              className="w-14 h-14 rounded-xl object-cover border-2 border-red-600/40"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                              <UserX className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-white font-bold truncate">{report.reportedProfile.title}</p>
                            <p className="text-gray-400 text-sm truncate">{report.reportedProfile.user.email}</p>
                            <p className="text-orange-400 text-xs mt-0.5">
                              {report.reportedProfile._count.reportsReceived} denuncias en total
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Denunciante */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Denunciante</p>
                        {isAnonymous ? (
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                              <Ghost className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-gray-400 font-semibold">Denuncia anónima</p>
                              {report.reporterIp && (
                                <p className="text-gray-600 text-xs mt-0.5">IP: {report.reporterIp}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {report.reporterProfile!.photos[0] ? (
                              <img
                                src={report.reporterProfile!.photos[0].url}
                                alt={report.reporterProfile!.title}
                                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-700"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                                <UserX className="w-6 h-6 text-gray-600" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-white font-bold truncate">{report.reporterProfile!.title}</p>
                              <p className="text-gray-400 text-sm truncate">{report.reporterProfile!.user?.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-800">
                      <button
                        onClick={() => handleDeleteUser(report.reportedProfile.user.id, report.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar usuario denunciado
                      </button>
                      <button
                        onClick={() => handleDismiss(report.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Descartar denuncia
                      </button>
                      <a
                        href={`/profile/${report.reportedProfile.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
                      >
                        Ver perfil →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
