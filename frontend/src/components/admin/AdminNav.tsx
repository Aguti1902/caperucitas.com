import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, AlertTriangle, Users, MessageCircle } from 'lucide-react';

export default function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="admin-nav bg-black/80 backdrop-blur-sm border-b border-[#fc4d5c]/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold transition relative ${
              isActive('/admin/dashboard')
                ? 'text-[#fc4d5c]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
            {isActive('/admin/dashboard') && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/50 rounded-t-full"></div>
            )}
          </button>
          
          <button
            onClick={() => navigate('/admin/reports')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold transition relative ${
              isActive('/admin/reports')
                ? 'text-[#fc4d5c]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Denuncias
            {isActive('/admin/reports') && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/50 rounded-t-full"></div>
            )}
          </button>
          
          <button
            onClick={() => navigate('/admin/users')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold transition relative ${
              isActive('/admin/users')
                ? 'text-[#fc4d5c]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuarios
            {isActive('/admin/users') && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/50 rounded-t-full"></div>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/whatsapp')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold transition relative ${
              isActive('/admin/whatsapp')
                ? 'text-[#fc4d5c]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
            {isActive('/admin/whatsapp') && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc4d5c] to-[#fc4d5c]/50 rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

