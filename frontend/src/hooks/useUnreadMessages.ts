import { useEffect } from 'react'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

/** Polling del contador de mensajes nuevos (buzón). */
export function useUnreadMessages(enabled = true) {
  const { isAuthenticated, hasProfile } = useAuthStore()
  const setUnreadMessagesCount = useNotificationStore((s) => s.setUnreadMessagesCount)

  useEffect(() => {
    if (!enabled || !isAuthenticated || !hasProfile) {
      setUnreadMessagesCount(0)
      return
    }

    let cancelled = false

    const fetchCount = async () => {
      try {
        const res = await api.get('/messages/unread-count')
        if (!cancelled) {
          setUnreadMessagesCount(Number(res.data?.total) || 0)
        }
      } catch {
        // silencioso
      }
    }

    fetchCount()
    const id = window.setInterval(fetchCount, 20000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [enabled, isAuthenticated, hasProfile, setUnreadMessagesCount])
}
