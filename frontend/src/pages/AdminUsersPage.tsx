import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { getAllProfiles, deleteUser, exportEmails, verifyUserEmail } from '../services/admin.api';
import AdminHeader from '../components/admin/AdminHeader';
import AdminNav from '../components/admin/AdminNav';
import { showToast } from '@/store/toastStore';

interface Profile {
  id: string;
  title: string;
  orientation: string;
  gender: string;
  age: number;
  city: string;
  phone?: string;
  whatsapp?: string;
  isFake: boolean;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
  photos: Array<{ url: string; type: string }>;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
  } | null;
  _count: {
    reportsReceived: number;
  };
}

type FilterType = 'all' | 'real' | 'fake' | 'reported';

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emailExport, setEmailExport] = useState<string | null>(null);

  useEffect(() => { loadProfiles(); }, []);

  useEffect(() => {
    let result = [...profiles];
    if (filterType === 'real') result = result.filter(p => !p.isFake);
    else if (filterType === 'fake') result = result.filter(p => p.isFake);
    else if (filterType === 'reported') result = result.filter(p => p._count.reportsReceived > 0);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.user?.email.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.phone?.includes(term) ||
        p.whatsapp?.includes(term)
      );
    }
    setFiltered(result);
  }, [searchTerm, filterType, profiles]);

  const loadProfiles = async () => {
    try {
      const data = await getAllProfiles();
      setProfiles(data.profiles);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario y todos sus datos? Esta acción es irreversible.')) return;
    setActionLoading(userId);
    try {
      await deleteUser(userId);
      setProfiles(prev => prev.filter(p => p.user?.id !== userId));
    } catch {
      showToast('Error al eliminar el usuario', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (userId: string) => {
    setActionLoading(userId + '_verify');
    try {
      await verifyUserEmail(userId);
      setProfiles(prev => prev.map(p =>
        p.user?.id === userId
          ? { ...p, user: { ...p.user, emailVerified: true } }
          : p
      ));
    } catch {
      showToast('✓ Usuario verificado correctamente', 'success');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportEmails = async () => {
    try {
      const emails = await exportEmails();
      setEmailExport(emails);
    } catch {
      showToast('Error al exportar emails', 'error');
    }
  };

  const counts = {
    all: profiles.length,
    real: profiles.filter(p => !p.isFake).length,
    fake: profiles.filter(p => p.isFake).length,
    reported: profiles.filter(p => p._count.reportsReceived > 0).length,
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `Todos (${counts.all})` },
    { key: 'real', label: `Reales (${counts.real})` },
    { key: 'fake', label: `Ficticios (${counts.fake})` },
    { key: 'reported', label: `Denunciados (${counts.reported})` },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando perfiles...</p>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-white">Gestión de usuarios</h1>
              <p className="text-gray-400 text-sm mt-1">Controla todos los perfiles publicados en Caperucitas.com</p>
            </div>
            <button
              onClick={handleExportEmails}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition"
            >
              <Download className="w-4 h-4" />
              Exportar emails
            </button>
          </div>

          {/* Modal exportar emails */}
          {emailExport !== null && (
            <div className="mt-4 bg-gray-900 rounded-xl border border-blue-600/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">Emails registrados</span>
                <button onClick={() => setEmailExport(null)} className="text-gray-400 hover:text-white text-xs">✕ Cerrar</button>
              </div>
              <textarea
                readOnly
                value={emailExport}
                className="w-full h-40 bg-gray-800 text-gray-300 text-xs rounded-lg p-3 font-mono focus:outline-none resize-none"
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
              <p className="text-gray-500 text-xs mt-1">Haz clic en el área de texto para seleccionar todos los emails</p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email, ciudad, teléfono..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  filterType === f.key
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-16 border border-gray-800 text-center">
            <Users className="w-14 h-14 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No se encontraron perfiles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(profile => {
              const coverPhoto = profile.photos.find(p => p.type === 'cover');
              const hasReports = profile._count.reportsReceived > 0;
              return (
                <div
                  key={profile.id}
                  className={`bg-gray-900 rounded-xl border transition ${
                    hasReports ? 'border-orange-600/40' : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Foto */}
                    <div className="shrink-0">
                      {coverPhoto ? (
                        <img
                          src={coverPhoto.url}
                          alt={profile.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center">
                          <Users className="w-7 h-7 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-base truncate">{profile.title}</h3>
                        {profile.isFake && (
                          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">Ficticio</span>
                        )}
                        {profile.isOnline && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 text-green-400 rounded text-xs">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                            Online
                          </span>
                        )}
                        {hasReports && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/40 text-orange-400 rounded text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {profile._count.reportsReceived} denuncia{profile._count.reportsReceived > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {profile.age} años · {profile.city || '—'}
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {profile.phone}
                          </span>
                        )}
                        {profile.whatsapp && profile.whatsapp !== profile.phone && (
                          <span className="flex items-center gap-1 text-green-400">
                            WA: {profile.whatsapp}
                          </span>
                        )}
                      </div>

                      {profile.user && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>{profile.user.email}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Registrado: {new Date(profile.user.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          {profile.user.emailVerified ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Email verificado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="w-3 h-3" />
                              Sin verificar
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="shrink-0 flex flex-col gap-2">
                      <a
                        href={`/profile/${profile.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver perfil
                      </a>
                      {profile.user && !profile.user.emailVerified && (
                        <button
                          onClick={() => handleVerify(profile.user!.id)}
                          disabled={actionLoading === profile.user.id + '_verify'}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm transition disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verificar
                        </button>
                      )}
                      {profile.user && (
                        <button
                          onClick={() => handleDelete(profile.user!.id)}
                          disabled={actionLoading === profile.user.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      )}
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
