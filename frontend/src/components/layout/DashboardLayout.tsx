import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../common/Logo'
import InstallPWA from '../common/InstallPWA'
import Toast from '../common/Toast'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useState } from 'react'
import Modal from '../common/Modal'
import { User, LogOut, Zap, Info, Globe } from 'lucide-react'

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { toasts, removeToast } = useToastStore()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { path: '/app', label: 'Navegar', Icon: Globe },
    { path: '/app/plus', label: 'ROAM', Icon: Zap },
    { path: '/app/info', label: 'Info', Icon: Info },
  ]

  return (
    <div className="dashboard-layout min-h-screen bg-gray-950" style={{ height: '100vh', overflow: 'hidden', position: 'fixed', width: '100%' }}>
      {/* Header fijo */}
      <header
        className="bg-gray-900 border-b border-gray-800"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, height: '56px' }}
      >
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-between h-14">
          <div className="flex-shrink-0">
            <Logo size="sm" className="h-8 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/edit-profile')}
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm"
              title="Editar mi perfil"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-medium">Mi Perfil</span>
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main
        style={{
          position: 'fixed',
          top: '56px',
          bottom: '64px',
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav
        className="bg-gray-900 border-t border-gray-800"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, height: '64px' }}
      >
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.Icon
              const active = location.pathname === item.path

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`nav-bottom-item relative ${active ? 'active' : ''}`}
                >
                  <Icon className={`w-6 h-6 mb-1 ${active ? 'text-red-500' : ''}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}

            {/* Volver al inicio público */}
            <button
              onClick={() => navigate('/')}
              className="nav-bottom-item"
            >
              <Globe className="w-6 h-6 mb-1 text-gray-400" />
              <span>Inicio</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modal de logout */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar sesión"
        maxWidth="sm"
      >
        <p className="text-gray-300 mb-6">¿Estás seguro de que quieres cerrar sesión?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogoutModal(false)}
            className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </Modal>

      {/* Componente PWA Install */}
      <InstallPWA />

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  )
}
