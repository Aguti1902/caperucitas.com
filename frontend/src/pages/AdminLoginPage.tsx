import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { loginAdmin } from '../services/admin.api';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginAdmin(password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo Caperucitas */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-caperucitas.jpeg"
              alt="Caperucitas.com"
              className="h-20 w-auto object-contain rounded-xl"
            />
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            Panel Admin · Caperucitas.com
          </h1>
          <p className="text-gray-400 text-sm">
            Acceso restringido a administradores
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-[#fc4d5c]/30 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-[#fc4d5c]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#fc4d5c] focus:border-[#fc4d5c] transition"
                placeholder="Ingresa la contraseña de admin"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-[#fc4d5c]/10 border border-[#fc4d5c]/50 text-[#fc4d5c] px-4 py-3 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/80 text-white py-3 rounded-xl font-bold hover:from-[#fc4d5c]/90 hover:to-[#fc4d5c]/70 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#fc4d5c]/30"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        {/* Volver al sitio */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-[#fc4d5c] transition text-sm font-semibold"
          >
            ← Volver al sitio
          </button>
        </div>
      </div>
    </div>
  );
}

