import { useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { logoutAdmin } from '../../services/admin.api';

export default function AdminHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <header className="bg-black border-b border-[#fc4d5c]/30 shadow-lg shadow-[#fc4d5c]/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo 9CITAS - Imagen */}
            <div className="flex items-center">
              <img 
                src="/logo4.png" 
                alt="caperucitas.com" 
                className="h-14 w-auto object-contain"
              />
            </div>
            
            <div className="h-12 w-px bg-[#fc4d5c]/30"></div>
            
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-[#fc4d5c]" />
              <span className="text-xl font-bold text-white">
                Panel Admin
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/80 hover:from-[#fc4d5c]/90 hover:to-[#fc4d5c]/70 text-white rounded-lg transition-all font-semibold shadow-lg shadow-[#fc4d5c]/20"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}

