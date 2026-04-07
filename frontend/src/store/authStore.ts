import { create } from 'zustand'
import { api } from '../services/api'

interface User {
  id: string
  email: string
  hasProfile: boolean
  profile?: any
  subscription?: any
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  hasProfile: boolean
  isLoading: boolean
  
  // Acciones
  setUser: (user: User | null) => void
  setToken: (accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, orientation: string, captchaToken?: string) => Promise<{ requiresVerification: boolean, email: string, orientation: string, isResend?: boolean }>
  logout: () => Promise<void>
  initAuth: () => Promise<void>
  refreshUserData: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: false,
  hasProfile: false,
  isLoading: true,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      hasProfile: user?.hasProfile || false,
    })
  },

  setToken: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken })
  },

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken })
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken } = response.data

      get().setTokens(accessToken, refreshToken)
      get().setUser(user)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión')
    }
  },

  register: async (email, password, orientation, captchaToken) => {
    try {
      const response = await api.post('/auth/register', { email, password, orientation, captchaToken })
      
      // Verificar si requiere verificación de email
      if (response.data.requiresVerification) {
        return {
          requiresVerification: true,
          email: response.data.email,
          orientation: response.data.orientation || orientation,
          isResend: response.data.isResend || false,
        }
      }

      // Si no requiere verificación (modo legacy), continuar como antes
      const { user, accessToken, refreshToken, orientation: savedOrientation } = response.data
      get().setTokens(accessToken, refreshToken)
      get().setUser(user)

      return { 
        requiresVerification: false,
        email: response.data.email,
        orientation: savedOrientation,
        isResend: false,
      }
    } catch (error: any) {
      // Distinguir entre errores de red y errores del servidor
      if (error.response) {
        // El servidor respondió con un código de error
        throw new Error(error.response.data?.error || 'Error al registrarse')
      } else if (error.request) {
        // La petición fue enviada pero no hubo respuesta
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.')
      } else {
        // Algo más salió mal
        throw new Error('Error al procesar el registro. Por favor, inténtalo de nuevo.')
      }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        hasProfile: false,
      })
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      const user = response.data
      // Un solo set para evitar múltiples re-renders
      set({
        user,
        isAuthenticated: !!user,
        hasProfile: user?.hasProfile || false,
        isLoading: false,
      })
    } catch {
      // Token inválido, limpiar todo en un solo set
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        hasProfile: false,
        isLoading: false,
      })
    }
  },

  refreshUserData: async () => {
    try {
      const response = await api.get('/auth/me')
      get().setUser(response.data)
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error)
    }
  },
}))

