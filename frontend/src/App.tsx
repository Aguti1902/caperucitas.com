import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import CookieBanner from './components/common/CookieBanner'

// Páginas
import IndexPage from './pages/IndexPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CreateProfilePage from './pages/CreateProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import DashboardLayout from './components/layout/DashboardLayout'
import NavigatePage from './pages/NavigatePage'
import PublicProfileDetailPage from './pages/ProfileDetailPage'
import PlusPage from './pages/PlusPage'
import InfoPage from './pages/InfoPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import EmailSentPage from './pages/EmailSentPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminReportsPage from './pages/AdminReportsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminRoute from './components/admin/AdminRoute'
import PublicRoamPage from './pages/PublicRoamPage'
import PublicInfoPage from './pages/PublicInfoPage'

function App() {
  const { isAuthenticated, hasProfile, isLoading, initAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    initAuth()
  }, [])

  // Escuchar evento de sesión expirada y hacer logout limpio sin reload
  useEffect(() => {
    const handleSessionExpired = () => {
      logout().then(() => navigate('/'))
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [logout, navigate])

  // Mostrar pantalla de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <CookieBanner />
      <Routes>
        {/* Rutas públicas - accesibles sin login */}
        <Route path="/" element={<IndexPage />} />
        <Route path="/profile/:id" element={<PublicProfileDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-sent" element={<EmailSentPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Páginas públicas informativas */}
        <Route path="/roam" element={<PublicRoamPage />} />
        <Route path="/info" element={<PublicInfoPage />} />

        {/* Rutas legacy con orientación - redirigir */}
        <Route path="/login/:orientation" element={<LoginPage />} />
        <Route path="/register/:orientation" element={<RegisterPage />} />

        {/* Ruta de crear perfil */}
        <Route
          path="/create-profile"
          element={
            isAuthenticated && !hasProfile ? (
              <CreateProfilePage />
            ) : isAuthenticated ? (
              <Navigate to="/app" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Rutas protegidas para escorts (requieren autenticación y perfil) */}
        <Route
          path="/app"
          element={
            isAuthenticated && hasProfile ? (
              <DashboardLayout />
            ) : isAuthenticated ? (
              <Navigate to="/create-profile" />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<NavigatePage />} />
          <Route path="profile/:id" element={<PublicProfileDetailPage />} />
          <Route path="plus" element={<PlusPage />} />
          <Route path="info" element={<InfoPage />} />
          <Route path="edit-profile" element={<EditProfilePage />} />
        </Route>

        {/* Rutas de admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/login" />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
