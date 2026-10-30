import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CheckCheck, MessagesSquare, Send, Smile, Users, X } from 'lucide-react'
import { api } from '@/services/api'
import BackNavBar from '@/components/common/BackNavBar'
import { formatLastSeen } from '@/utils/timeUtils'

interface ChatMsg {
  id: string
  nickname: string
  body: string
  guestId?: string | null
  createdAt: string
}

interface DmMsg {
  id: string
  fromGuestId: string
  toGuestId: string
  fromNickname: string
  body: string
  createdAt: string
  readAt?: string | null
  mine?: boolean
}

interface PresenceUser {
  guestId: string
  nickname: string
  lastSeenAt: string
  isOnline: boolean
  typing?: boolean
  typingTo?: string | null
}

const NICK_KEY = 'cap_globalChatNick'
const GUEST_KEY = 'cap_globalChatGuestId'
const EMOJIS = ['😀', '🔥', '❤️', '💋', '😈', '👀', '👍', '😂', '🥵', '✨', '📍', '✅']

function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem(GUEST_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `g_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(GUEST_KEY, id)
    return id
  } catch {
    return `g_${Date.now()}`
  }
}

export default function GlobalChatPage() {
  const navigate = useNavigate()
  const guestId = useMemo(() => getOrCreateGuestId(), [])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [dms, setDms] = useState<DmMsg[]>([])
  const [users, setUsers] = useState<PresenceUser[]>([])
  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem(NICK_KEY) || ''
    } catch {
      return ''
    }
  })
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [dmPeer, setDmPeer] = useState<PresenceUser | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)

  const nick = nickname.trim() || 'Anónimo'
  const onlineCount = users.filter((u) => u.isOnline && u.guestId !== guestId).length

  const peerTyping = Boolean(
    dmPeer &&
      users.some(
        (u) => u.guestId === dmPeer.guestId && u.typing && u.typingTo === guestId && u.isOnline
      )
  )

  const loadPublic = useCallback(async () => {
    try {
      const res = await api.get('/global-chat')
      setMessages(res.data.messages || [])
    } catch {
      /* ignore */
    }
  }, [])

  const loadDms = useCallback(async () => {
    if (!dmPeer) return
    try {
      const res = await api.get('/global-chat/dms', {
        params: { guestId, with: dmPeer.guestId },
      })
      setDms(res.data.messages || [])
    } catch {
      /* ignore */
    }
  }, [dmPeer, guestId])

  const heartbeat = useCallback(
    async (typing = false, typingTo: string | null = null) => {
      try {
        const res = await api.post('/global-chat/presence', {
          guestId,
          nickname: nick,
          typing,
          typingTo,
        })
        setUsers(res.data.users || [])
      } catch {
        /* ignore */
      }
    },
    [guestId, nick]
  )

  useEffect(() => {
    loadPublic()
    heartbeat(false, null)
    const t = window.setInterval(() => {
      loadPublic()
      heartbeat(false, dmPeer?.guestId || null)
      if (dmPeer) loadDms()
    }, 4000)
    return () => window.clearInterval(t)
  }, [loadPublic, heartbeat, loadDms, dmPeer])

  useEffect(() => {
    if (dmPeer) loadDms()
    else setDms([])
  }, [dmPeer, loadDms])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, dms.length, peerTyping])

  const onTyping = () => {
    if (!dmPeer) return
    heartbeat(true, dmPeer.guestId)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => {
      heartbeat(false, null)
    }, 2000)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const body = text.trim()
    if (!body) return
    setSending(true)
    try {
      localStorage.setItem(NICK_KEY, nick)
      if (dmPeer) {
        const res = await api.post('/global-chat/dms', {
          guestId,
          toGuestId: dmPeer.guestId,
          nickname: nick,
          body,
        })
        if (res.data.message) setDms((prev) => [...prev, res.data.message])
      } else {
        const res = await api.post('/global-chat', { nickname: nick, body, guestId })
        if (res.data.message) setMessages((prev) => [...prev, res.data.message])
      }
      setText('')
      setShowEmoji(false)
      heartbeat(false, null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo enviar')
    } finally {
      setSending(false)
    }
  }

  const openPrivate = (user: PresenceUser) => {
    if (user.guestId === guestId) return
    setDmPeer(user)
    setShowOnline(false)
    setText('')
  }

  const openPrivateFromMsg = (msg: ChatMsg) => {
    if (!msg.guestId || msg.guestId === guestId) return
    const known = users.find((u) => u.guestId === msg.guestId)
    setDmPeer(
      known || {
        guestId: msg.guestId,
        nickname: msg.nickname,
        lastSeenAt: new Date().toISOString(),
        isOnline: false,
      }
    )
  }

  const activeList = dmPeer ? dms : messages

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <BackNavBar backTo="/perfiles" />

      <header className="px-4 py-3 border-b border-gray-800 bg-gray-900/80">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (dmPeer) setDmPeer(null)
              else navigate('/perfiles')
            }}
            className="text-gray-400 hover:text-white"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            {dmPeer ? (
              <>
                <h1 className="text-white font-black text-lg flex items-center gap-2 truncate">
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      dmPeer.isOnline ||
                      users.find((u) => u.guestId === dmPeer.guestId)?.isOnline
                        ? 'bg-emerald-400'
                        : 'bg-gray-500'
                    }`}
                  />
                  {dmPeer.nickname}
                </h1>
                <p className="text-gray-400 text-xs truncate">
                  {peerTyping
                    ? 'Escribiendo…'
                    : users.find((u) => u.guestId === dmPeer.guestId)?.isOnline
                      ? 'En línea · chat privado'
                      : formatLastSeen(
                          users.find((u) => u.guestId === dmPeer.guestId)?.lastSeenAt ||
                            dmPeer.lastSeenAt
                        )}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-white font-black text-lg flex items-center gap-2">
                  <MessagesSquare className="w-5 h-5 text-pink-400" />
                  Chat global
                </h1>
                <p className="text-gray-400 text-xs">
                  {onlineCount} en línea · toca un apodo para chat privado
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOnline(true)}
            className="relative text-emerald-400 hover:text-emerald-300 p-2"
            title="Usuarios conectados"
          >
            <Users className="w-5 h-5" />
            {onlineCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                {onlineCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {!dmPeer && messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-12 space-y-2">
              <p>Aún no hay mensajes. ¡Sé el primero!</p>
              <p className="text-xs text-gray-600">
                Chat abierto. Puedes hablar en privado tocando un apodo o la lista de conectados.
              </p>
            </div>
          )}

          {dmPeer && dms.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-10">
              Empieza el chat privado con {dmPeer.nickname}
            </div>
          )}

          {!dmPeer &&
            messages.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => openPrivateFromMsg(m)}
                className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 hover:border-pink-700/50 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-pink-400 font-bold text-sm inline-flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.guestId && users.find((u) => u.guestId === m.guestId)?.isOnline
                          ? 'bg-emerald-400'
                          : 'bg-gray-600'
                      }`}
                    />
                    {m.nickname}
                  </span>
                  <span className="text-gray-600 text-[10px]">
                    {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{m.body}</p>
              </button>
            ))}

          {dmPeer &&
            dms.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  m.mine || m.fromGuestId === guestId
                    ? 'ml-auto bg-pink-700/80 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {(m.mine || m.fromGuestId === guestId) &&
                    (m.readAt ? (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                    ) : (
                      <Check className="w-3.5 h-3.5 opacity-70" />
                    ))}
                </div>
              </div>
            ))}

          {peerTyping && (
            <p className="text-gray-400 text-xs italic px-1">{dmPeer?.nickname} está escribiendo…</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={send}
        className="border-t border-gray-800 bg-gray-900 px-3 py-3 safe-area-bottom"
      >
        <div className="max-w-2xl mx-auto space-y-2">
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {!dmPeer && (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 24))}
              placeholder="Tu apodo"
              maxLength={24}
              className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          )}
          {showEmoji && (
            <div className="flex flex-wrap gap-1 bg-gray-800 rounded-lg p-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setText((t) => (t + e).slice(0, 400))}
                  className="text-xl p-1 hover:bg-gray-700 rounded"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="bg-gray-800 hover:bg-gray-700 text-yellow-300 rounded-lg px-3"
              aria-label="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, 400))
                onTyping()
              }}
              placeholder={dmPeer ? `Mensaje privado a ${dmPeer.nickname}…` : 'Escribe un mensaje…'}
              maxLength={400}
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-lg px-4 font-bold"
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {activeList.length === 0 && null}
        </div>
      </form>

      {showOnline && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowOnline(false)}
            aria-label="Cerrar"
          />
          <div className="relative w-full sm:max-w-md bg-gray-950 border border-gray-700 sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <p className="text-white font-black">Usuarios conectados</p>
              <button type="button" onClick={() => setShowOnline(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-2 space-y-1">
              {users.filter((u) => u.guestId !== guestId).length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">Nadie más conectado ahora</p>
              )}
              {users
                .filter((u) => u.guestId !== guestId)
                .map((u) => (
                  <button
                    key={u.guestId}
                    type="button"
                    onClick={() => openPrivate(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-left"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        u.isOnline ? 'bg-emerald-400' : 'bg-gray-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{u.nickname}</p>
                      <p className="text-gray-500 text-[11px]">
                        {u.isOnline ? 'En línea · tocar para chat privado' : formatLastSeen(u.lastSeenAt)}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
