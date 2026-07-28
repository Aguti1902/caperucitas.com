import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, lazy, Suspense } from 'react'
import CookieBanner from './components/common/CookieBanner'
import PWAInstallPrompt from './components/common/PWAInstallPrompt'
import ToastContainer from './components/common/ToastContainer'
import { initGA, trackPageView } from './utils/analytics'

// Eager: primera pintura
import LandingPage from './pages/LandingPage'

// Lazy: reduce bundle inicial
const IndexPage = lazy(() => import('./pages/IndexPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const CreateProfilePage = lazy(() => import('./pages/CreateProfilePage'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'))
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))
const NavigatePage = lazy(() => import('./pages/NavigatePage'))
const PublicProfileDetailPage = lazy(() => import('./pages/ProfileDetailPage'))
const PlusPage = lazy(() => import('./pages/PlusPage'))
const InfoPage = lazy(() => import('./pages/InfoPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const EmailSentPage = lazy(() => import('./pages/EmailSentPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminWhatsAppPage = lazy(() => import('./pages/AdminWhatsAppPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'))
const PublicRoamPage = lazy(() => import('./pages/PublicRoamPage'))
const PublicInfoPage = lazy(() => import('./pages/PublicInfoPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const CookiesPage = lazy(() => import('./pages/CookiesPage'))
const CitiesDirectoryPage = lazy(() => import('./pages/CitiesDirectoryPage'))
const NormasPage = lazy(() => import('./pages/NormasPage'))
const BlogIndexPage = lazy(() => import('./pages/BlogIndexPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const InboxPage = lazy(() => import('./pages/InboxPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function App() {
  const { isAuthenticated, hasProfile, isLoading, initAuth, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent === 'accepted') initGA();
    const onStorage = () => {
      if (localStorage.getItem('cookie_consent') === 'accepted') initGA();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('cookie_consent') !== 'accepted') return;
    trackPageView(location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    initAuth()
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => {
      logout().then(() => navigate('/'))
    }
    window.addEventListener('auth:session-expired', handleSessionExpired)
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
  }, [logout, navigate])

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <>
      <CookieBanner />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/perfiles" element={<IndexPage />} />
          <Route path="/putas/:categorySlug/en/:citySlug" element={<IndexPage />} />
          <Route path="/putas/:citySlug" element={<IndexPage />} />
          <Route path="/sexo-gratis/:categorySlug/en/:citySlug" element={<IndexPage />} />
          <Route path="/sexo-gratis/:citySlug" element={<IndexPage />} />
          <Route path="/ciudades" element={<CitiesDirectoryPage />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/profile/:id" element={<PublicProfileDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/email-sent" element={<EmailSentPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/roam" element={<PublicRoamPage />} />
          <Route path="/info" element={<PublicInfoPage />} />
          <Route path="/privacidad" element={<PrivacyPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="/normas" element={<NormasPage />} />
          <Route path="/login/:orientation" element={<LoginPage />} />
          <Route path="/register/:orientation" element={<RegisterPage />} />
          <Route
            path="/create-profile"
            element={
              isAuthenticated && !hasProfile ? (
                <CreateProfilePage />
              ) : isAuthenticated ? (
                <Navigate to="/perfiles" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/edit-profile"
            element={
              isAuthenticated && hasProfile ? (
                <EditProfilePage />
              ) : isAuthenticated ? (
                <Navigate to="/create-profile" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
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
            <Route path="inbox" element={<InboxPage />} />
            <Route path="chat/:profileId" element={<ChatPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
          <Route path="/admin/whatsapp" element={<AdminRoute><AdminWhatsAppPage /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <PWAInstallPrompt />
      <ToastContainer />
    </>
  )
}

export default App
