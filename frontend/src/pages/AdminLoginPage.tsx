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
        {/* Logo 9CITAS */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo4.png" 
              alt="caperucitas.com" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/80 rounded-full mb-6 shadow-lg shadow-[#fc4d5c]/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">
            Panel de Administración
          </h1>
          <p className="text-gray-400 text-lg">
            Ingresa la contraseña de administrador
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

