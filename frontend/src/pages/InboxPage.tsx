import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import ProtectedImage from '@/components/common/ProtectedImage'
import { Trash2, Mail } from 'lucide-react'
import { showToast } from '@/store/toastStore'

export default function InboxPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<any[]>([])
  const [guestMessages, setGuestMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [convRes, guestRes] = await Promise.all([
        api.get('/messages/conversations').catch(() => ({ data: { conversations: [] } })),
        api.get('/messages/guest-inbox').catch(() => ({ data: { messages: [] } })),
      ])
      setConversations(convRes.data.conversations || [])
      setGuestMessages(guestRes.data.messages || [])
      api.put('/messages/guest-inbox/read').catch(() => {})
    } catch (error) {
      console.error('Error al cargar bandeja:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation()
    if (!confirm('¿Borrar esta conversación?')) return
    setDeletingId(profileId)
    try {
      await api.delete(`/messages/${profileId}`)
      setConversations((prev) => prev.filter((c) => c.profile.id !== profileId))
      showToast('Conversación eliminada', 'success')
    } catch {
      showToast('No se pudo eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteGuest = async (id: string) => {
    if (!confirm('¿Borrar este mensaje?')) return
    setDeletingId(id)
    try {
      await api.delete(`/messages/guest/${id}`)
      setGuestMessages((prev) => prev.filter((m) => m.id !== id))
      if (selectedGuest?.id === id) setSelectedGuest(null)
      showToast('Mensaje eliminado', 'success')
    } catch {
      showToast('No se pudo eliminar', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const empty = conversations.length === 0 && guestMessages.length === 0

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-2">Buzón</h1>
        <p className="text-gray-400 text-sm">
          Mensajes de contacto y chats. Puedes borrarlos cuando quieras.
        </p>
      </div>

      {empty ? (
        <div className="text-center py-12 px-4">
          <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">Aún no tienes mensajes</p>
          <p className="text-gray-500 mt-2 text-sm">
            Si activas «Mensaje» en tu perfil, aquí verás los contactos que te escriban
          </p>
        </div>
      ) : (
        <>
          {guestMessages.length > 0 && (
            <section className="mb-6">
              <h2 className="px-4 text-sm font-bold text-purple-300 uppercase tracking-wider mb-2">
                Contactos sin cuenta ({guestMessages.length})
              </h2>
              <div className="divide-y divide-gray-800 border-y border-gray-800">
                {guestMessages.map((msg) => (
                  <div key={msg.id} className="flex items-stretch gap-2 px-2 hover:bg-gray-900/80">
                    <button
                      type="button"
                      onClick={() => setSelectedGuest(msg)}
                      className="flex-1 text-left p-3 min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-white truncate">{msg.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{msg.text}</p>
                      {(msg.phone || msg.email) && (
                        <p className="text-xs text-purple-300/80 mt-1 truncate">
                          {[msg.phone, msg.email].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuest(msg.id)}
                      disabled={deletingId === msg.id}
                      className="px-3 text-gray-500 hover:text-red-400"
                      title="Borrar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {conversations.length > 0 && (
            <section>
              <h2 className="px-4 text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Chats
              </h2>
              <div className="divide-y divide-gray-800">
                {conversations.map((conv) => {
                  const coverPhoto = conv.profile.photos?.find((p: any) => p.type === 'cover')
                  const timeAgo = formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })

                  return (
                    <div
                      key={conv.profile.id}
                      className="w-full flex items-center gap-3 p-4 hover:bg-gray-900 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/app/chat/${conv.profile.id}`)}
                        className="flex-1 flex items-center gap-4 text-left min-w-0"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800">
                            {coverPhoto ? (
                              <ProtectedImage
                                src={coverPhoto.url}
                                alt={conv.profile.title}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                ?
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {conv.profile.title}
                            </h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {timeAgo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {conv.lastMessage.text || '📷 Foto'}
                          </p>
                        </div>

                        {conv.unreadCount > 0 && (
                          <div className="flex-shrink-0 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {conv.unreadCount}
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(e, conv.profile.id)}
                        disabled={deletingId === conv.profile.id}
                        className="flex-shrink-0 p-2 text-gray-500 hover:text-red-400 transition-colors"
                        title="Borrar conversación"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Cerrar"
            onClick={() => setSelectedGuest(null)}
          />
          <div className="relative w-full max-w-md bg-gray-950 border border-purple-700/50 rounded-2xl p-5 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-1">{selectedGuest.name}</h3>
            <p className="text-xs text-gray-500 mb-3">
              {formatDistanceToNow(new Date(selectedGuest.createdAt), { addSuffix: true, locale: es })}
            </p>
            {(selectedGuest.phone || selectedGuest.email) && (
              <div className="text-sm text-purple-300 mb-3 space-y-1">
                {selectedGuest.phone && <p>📞 {selectedGuest.phone}</p>}
                {selectedGuest.email && <p>✉️ {selectedGuest.email}</p>}
              </div>
            )}
            <p className="text-gray-200 text-sm whitespace-pre-wrap mb-4">{selectedGuest.text}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGuest(selectedGuest.id)}
                className="flex-1 py-3 rounded-xl bg-red-900/60 text-red-300 font-semibold"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
