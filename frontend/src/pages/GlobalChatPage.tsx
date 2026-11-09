import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Lock,
  LogOut,
  MessagesSquare,
  Reply,
  Send,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { api } from '@/services/api'
import { formatLastSeen } from '@/utils/timeUtils'

interface Reaction {
  emoji: string
  count: number
}

interface ChatMsg {
  id: string
  nickname: string
  body: string
  guestId?: string | null
  imageUrl?: string | null
  replyToId?: string | null
  replyTo?: { id?: string; nickname?: string; body?: string } | null
  reactions?: Reaction[]
  createdAt: string
  mine?: boolean
}

interface DmMsg {
  id: string
  fromGuestId: string
  toGuestId: string
  fromNickname: string
  body: string
  imageUrl?: string | null
  replyToId?: string | null
  replyTo?: { id?: string; nickname?: string; body?: string } | null
  reactions?: Reaction[]
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
  unreadFromThem?: number
}

const NICK_KEY = 'cap_globalChatNick'
const NICK_PIN_KEY = 'cap_globalChatNickPin'
const GUEST_KEY = 'cap_globalChatGuestId'
const EMOJIS = ['😀', '🔥', '❤️', '💋', '😈', '👀', '👍', '😂', '🥵', '✨', '📍', '✅']
const REACT_EMOJIS = ['❤️', '🔥', '😂', '👍', '💋', '😮', '😢']

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

function notifyBrowser(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo-caperucitas.jpeg' })
    }
  } catch {
    /* ignore */
  }
}

export default function GlobalChatPage() {
  const navigate = useNavigate()
  const guestId = useMemo(() => getOrCreateGuestId(), [])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [dms, setDms] = useState<DmMsg[]>([])
  const [users, setUsers] = useState<PresenceUser[]>([])
  const [unreadByFrom, setUnreadByFrom] = useState<Record<string, number>>({})
  const [nickname, setNickname] = useState(() => {
    try {
      return localStorage.getItem(NICK_KEY) || ''
    } catch {
      return ''
    }
  })
  const [nickPin, setNickPin] = useState(() => {
    try {
      return localStorage.getItem(NICK_PIN_KEY) || ''
    } catch {
      return ''
    }
  })
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [onlineTab, setOnlineTab] = useState<'all' | 'private'>('all')
  const [dmPeer, setDmPeer] = useState<PresenceUser | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string; body: string } | null>(null)
  const [menuMsg, setMenuMsg] = useState<{ id: string; mine: boolean; channel: 'public' | 'dm' } | null>(
    null
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const knownDmIds = useRef<Set<string>>(new Set())
  const notifAsked = useRef(false)

  const nick = nickname.trim() || 'Anónimo'
  const onlineCount = users.filter((u) => u.isOnline && u.guestId !== guestId).length
  const totalUnread = Object.values(unreadByFrom).reduce((a, b) => a + b, 0)
  const peerTyping = Boolean(
    dmPeer &&
      users.some(
        (u) => u.guestId === dmPeer.guestId && u.typing && u.typingTo === guestId && u.isOnline
      )
  )

  const askNotifications = () => {
    if (notifAsked.current) return
    notifAsked.current = true
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }

  const loadPublic = useCallback(async () => {
    try {
      const res = await api.get('/global-chat', { params: { guestId } })
      setMessages(res.data.messages || [])
      setError('')
    } catch (err: any) {
      const msg = err.response?.data?.error || ''
      if (/demasiad/i.test(msg)) {
        setError('El chat está muy activo. Espera unos segundos y vuelve a entrar.')
      }
    }
  }, [guestId])

  const loadDms = useCallback(async () => {
    if (!dmPeer) return
    try {
      const res = await api.get('/global-chat/dms', {
        params: { guestId, with: dmPeer.guestId },
      })
      const list: DmMsg[] = res.data.messages || []
      for (const m of list) {
        if (!m.mine && !knownDmIds.current.has(m.id)) {
          notifyBrowser(`Privado de ${m.fromNickname}`, m.body || '📷 Foto')
        }
        knownDmIds.current.add(m.id)
      }
      setDms(list)
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
        if (res.data.unreadByFrom) setUnreadByFrom(res.data.unreadByFrom)
      } catch {
        /* ignore */
      }
    },
    [guestId, nick]
  )

  const persistNick = async () => {
    try {
      localStorage.setItem(NICK_KEY, nick)
      if (nickPin) localStorage.setItem(NICK_PIN_KEY, nickPin)
      else localStorage.removeItem(NICK_PIN_KEY)
      if (nick && nick !== 'Anónimo') {
        await api.post('/global-chat/claim-nick', {
          guestId,
          nickname: nick,
          pin: nickPin || undefined,
        })
      }
    } catch (err: any) {
      const msg = err.response?.data?.error
      if (msg) setError(msg)
    }
  }

  useEffect(() => {
    askNotifications()
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
    if (dmPeer) {
      knownDmIds.current = new Set()
      loadDms()
    } else setDms([])
  }, [dmPeer, loadDms])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, dms.length, peerTyping])

  const onTyping = () => {
    if (!dmPeer) return
    heartbeat(true, dmPeer.guestId)
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => heartbeat(false, null), 2000)
  }

  const sendPayload = async (payload: { body?: string; imageUrl?: string }) => {
    setSending(true)
    setError('')
    try {
      await persistNick()
      const common = {
        guestId,
        nickname: nick,
        nickPin: nickPin || undefined,
        body: payload.body || '',
        imageUrl: payload.imageUrl,
        replyToId: replyTo?.id,
      }
      if (dmPeer) {
        const res = await api.post('/global-chat/dms', {
          ...common,
          toGuestId: dmPeer.guestId,
        })
        if (res.data.message) {
          knownDmIds.current.add(res.data.message.id)
          setDms((prev) => [...prev, res.data.message])
        }
      } else {
        const res = await api.post('/global-chat', common)
        if (res.data.message) setMessages((prev) => [...prev, res.data.message])
      }
      setText('')
      setReplyTo(null)
      setShowEmoji(false)
      heartbeat(false, null)
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo enviar')
    } finally {
      setSending(false)
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    await sendPayload({ body })
  }

  const uploadPhoto = async (file: File) => {
    setError('')
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/global-chat/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await sendPayload({ imageUrl: res.data.imageUrl, body: text.trim() })
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo subir la foto')
      setSending(false)
    }
  }

  const reactTo = async (messageId: string, channel: 'public' | 'dm', emoji: string) => {
    try {
      const res = await api.post('/global-chat/react', { guestId, messageId, channel, emoji })
      const reactions = res.data.reactions || []
      if (channel === 'dm') {
        setDms((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
      } else {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
      }
    } catch {
      /* ignore */
    }
    setMenuMsg(null)
  }

  const deleteMsg = async (messageId: string, channel: 'public' | 'dm') => {
    try {
      await api.post('/global-chat/delete', { guestId, messageId, channel })
      if (channel === 'dm') setDms((prev) => prev.filter((m) => m.id !== messageId))
      else setMessages((prev) => prev.filter((m) => m.id !== messageId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo borrar')
    }
    setMenuMsg(null)
  }

  const openPrivate = (user: PresenceUser) => {
    if (user.guestId === guestId) return
    setDmPeer(user)
    setShowOnline(false)
    setText('')
    setReplyTo(null)
    askNotifications()
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
        unreadFromThem: unreadByFrom[msg.guestId] || 0,
      }
    )
  }

  const backToPublicChat = () => {
    setDmPeer(null)
    setReplyTo(null)
    setText('')
    heartbeat(false, null)
  }

  const exitChat = () => {
    navigate('/perfiles')
  }

  const renderReactions = (reactions: Reaction[] | undefined, id: string, channel: 'public' | 'dm') => {
    if (!reactions?.length) return null
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              reactTo(id, channel, r.emoji)
            }}
            className="text-xs bg-black/30 rounded-full px-1.5 py-0.5"
          >
            {r.emoji} {r.count}
          </button>
        ))}
      </div>
    )
  }

  const filteredUsers = users
    .filter((u) => u.guestId !== guestId)
    .filter((u) => (onlineTab === 'private' ? (unreadByFrom[u.guestId] || 0) > 0 : true))

  // También incluir remitentes de privados que ya no están en presence
  const privateOnlyExtra =
    onlineTab === 'private'
      ? Object.keys(unreadByFrom)
          .filter((id) => id !== guestId && !users.some((u) => u.guestId === id) && unreadByFrom[id] > 0)
          .map((id) => ({
            guestId: id,
            nickname: `Usuario`,
            lastSeenAt: new Date().toISOString(),
            isOnline: false,
            unreadFromThem: unreadByFrom[id],
          }))
      : []

  return (
    <div className="h-[100dvh] bg-gray-950 flex flex-col overflow-hidden">
      {/* Cabecera mínima fija */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-800 bg-gray-900 flex items-center gap-2">
        {dmPeer ? (
          <button
            type="button"
            onClick={backToPublicChat}
            className="inline-flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-black px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLVER AL CHAT
          </button>
        ) : (
          <button
            type="button"
            onClick={exitChat}
            className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-semibold px-2 py-1.5"
          >
            <LogOut className="w-4 h-4" />
            Salir del chat
          </button>
        )}
        <div className="flex-1 min-w-0 text-center">
          {dmPeer ? (
            <p className="text-white font-bold text-sm truncate flex items-center justify-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  users.find((u) => u.guestId === dmPeer.guestId)?.isOnline
                    ? 'bg-emerald-400'
                    : 'bg-gray-500'
                }`}
              />
              Privado · {dmPeer.nickname}
            </p>
          ) : (
            <p className="text-white font-black text-sm inline-flex items-center gap-1.5 justify-center">
              <MessagesSquare className="w-4 h-4 text-pink-400" />
              Chat global
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOnlineTab(totalUnread > 0 ? 'private' : 'all')
            setShowOnline(true)
          }}
          className="relative text-emerald-400 hover:text-emerald-300 p-2"
          title="Usuarios / privados"
        >
          <Users className="w-5 h-5" />
          {(onlineCount > 0 || totalUnread > 0) && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalUnread > 0 ? totalUnread : onlineCount}
            </span>
          )}
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {!dmPeer && messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-12 space-y-2">
              <p>Aún no hay mensajes. ¡Sé el primero!</p>
              <p className="text-xs text-gray-600">
                Toca un apodo para privado · el aviso de privado aparece en el apodo y en Usuarios
              </p>
            </div>
          )}

          {!dmPeer &&
            messages.map((m) => {
              const unreadFrom = m.guestId ? unreadByFrom[m.guestId] || 0 : 0
              return (
                <div
                  key={m.id}
                  className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setMenuMsg({
                      id: m.id,
                      mine: Boolean(m.mine || m.guestId === guestId),
                      channel: 'public',
                    })
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openPrivateFromMsg(m)}
                    className="flex items-baseline justify-between gap-2 mb-1 w-full text-left"
                  >
                    <span className="text-pink-400 font-bold text-sm inline-flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          m.guestId && users.find((u) => u.guestId === m.guestId)?.isOnline
                            ? 'bg-emerald-400'
                            : 'bg-gray-600'
                        }`}
                      />
                      {m.nickname}
                      {unreadFrom > 0 && (
                        <span className="ml-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          ✉ {unreadFrom} PRIVADO
                        </span>
                      )}
                    </span>
                    <span className="text-gray-600 text-[10px]">
                      {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                  {m.replyTo && (
                    <div className="text-[11px] text-gray-400 border-l-2 border-pink-600 pl-2 mb-1 truncate">
                      ↳ {m.replyTo.nickname}: {m.replyTo.body}
                    </div>
                  )}
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
                      <img src={m.imageUrl} alt="foto" className="rounded-lg max-h-56 object-cover" />
                    </a>
                  )}
                  <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  {renderReactions(m.reactions, m.id, 'public')}
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setReplyTo({ id: m.id, nickname: m.nickname, body: m.body })}
                      className="text-[10px] text-gray-500 hover:text-pink-400 inline-flex items-center gap-0.5"
                    >
                      <Reply className="w-3 h-3" /> Responder
                    </button>
                    {m.guestId && m.guestId !== guestId && (
                      <button
                        type="button"
                        onClick={() => openPrivateFromMsg(m)}
                        className={`text-[10px] font-bold inline-flex items-center gap-0.5 ${
                          unreadFrom > 0 ? 'text-red-400' : 'text-sky-400'
                        }`}
                      >
                        Privado{unreadFrom > 0 ? ` (${unreadFrom})` : ''}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

          {dmPeer && dms.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-10">
              Empieza el chat privado con {dmPeer.nickname}
            </div>
          )}

          {dmPeer &&
            dms.map((m) => {
              const mine = m.mine || m.fromGuestId === guestId
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    mine
                      ? 'ml-auto bg-pink-700/80 text-white'
                      : 'bg-gray-900 border border-gray-800 text-gray-100'
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setMenuMsg({ id: m.id, mine: Boolean(mine), channel: 'dm' })
                  }}
                >
                  {m.replyTo && (
                    <div className="text-[11px] opacity-80 border-l-2 border-white/40 pl-2 mb-1 truncate">
                      ↳ {m.replyTo.nickname}: {m.replyTo.body}
                    </div>
                  )}
                  {m.imageUrl && (
                    <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
                      <img src={m.imageUrl} alt="foto" className="rounded-lg max-h-56 object-cover" />
                    </a>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  {renderReactions(m.reactions, m.id, 'dm')}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyTo({ id: m.id, nickname: m.fromNickname, body: m.body })
                      }
                      className="text-[10px] opacity-70 hover:opacity-100 inline-flex items-center gap-0.5"
                    >
                      <Reply className="w-3 h-3" /> Responder
                    </button>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] opacity-70">
                        {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {mine &&
                        (m.readAt ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                        ) : (
                          <Check className="w-3.5 h-3.5 opacity-70" />
                        ))}
                    </div>
                  </div>
                </div>
              )
            })}

          {peerTyping && (
            <p className="text-gray-400 text-xs italic px-1">{dmPeer?.nickname} está escribiendo…</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {menuMsg && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setMenuMsg(null)} />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-t-2xl p-4 space-y-3">
            <p className="text-white font-bold text-sm">Reaccionar</p>
            <div className="flex flex-wrap gap-2">
              {REACT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => reactTo(menuMsg.id, menuMsg.channel, e)}
                  className="text-2xl bg-gray-800 rounded-xl px-3 py-2"
                >
                  {e}
                </button>
              ))}
            </div>
            {menuMsg.mine && (
              <button
                type="button"
                onClick={() => deleteMsg(menuMsg.id, menuMsg.channel)}
                className="w-full inline-flex items-center justify-center gap-2 bg-red-700/80 hover:bg-red-600 text-white font-bold py-3 rounded-xl"
              >
                <Trash2 className="w-4 h-4" /> Borrar mensaje
              </button>
            )}
            <button
              type="button"
              onClick={() => setMenuMsg(null)}
              className="w-full text-gray-400 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Barra inferior fija: apodo + PIN + compositor (anexo: barra abajo) */}
      <form
        onSubmit={send}
        className="flex-shrink-0 border-t border-gray-800 bg-gray-900 px-3 py-2.5 safe-area-bottom"
      >
        <div className="max-w-2xl mx-auto space-y-2">
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          {!dmPeer && (
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                onBlur={() => persistNick()}
                placeholder="Tu apodo"
                maxLength={24}
                className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <div className="relative w-[88px]">
                <Lock className="w-3.5 h-3.5 text-gray-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  value={nickPin}
                  onChange={(e) => setNickPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => persistNick()}
                  placeholder="PIN"
                  maxLength={6}
                  title="Contraseña opcional del apodo"
                  className="w-full bg-gray-800 text-white text-sm rounded-lg pl-7 pr-2 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>
          )}
          {dmPeer && (
            <button
              type="button"
              onClick={backToPublicChat}
              className="w-full text-xs font-black text-pink-300 border border-pink-700/60 rounded-lg py-2 hover:bg-pink-900/30"
            >
              ⊗ VOLVER AL CHAT
            </button>
          )}
          {replyTo && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">
              <Reply className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
              <span className="flex-1 truncate">
                Respondiendo a <strong>{replyTo.nickname}</strong>: {replyTo.body}
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-gray-800 hover:bg-gray-700 text-sky-300 rounded-lg px-3"
              aria-label="Enviar foto"
              disabled={sending}
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadPhoto(f)
                e.target.value = ''
              }}
            />
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, 400))
                onTyping()
              }}
              placeholder={dmPeer ? `Privado a ${dmPeer.nickname}…` : 'Escribe un mensaje…'}
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
          <div className="relative w-full sm:max-w-md bg-gray-950 border border-gray-700 sm:rounded-2xl rounded-t-2xl max-h-[75vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <p className="text-white font-black">Usuarios</p>
              <button type="button" onClick={() => setShowOnline(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 px-3 pt-3">
              <button
                type="button"
                onClick={() => setOnlineTab('all')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg ${
                  onlineTab === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Todos ({onlineCount})
              </button>
              <button
                type="button"
                onClick={() => setOnlineTab('private')}
                className={`flex-1 text-xs font-bold py-2 rounded-lg ${
                  onlineTab === 'private' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                Privados nuevos {totalUnread > 0 ? `(${totalUnread})` : ''}
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-2 space-y-1">
              {[...filteredUsers, ...privateOnlyExtra].length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">
                  {onlineTab === 'private'
                    ? 'No tienes privados sin leer'
                    : 'Nadie más conectado ahora'}
                </p>
              )}
              {[...filteredUsers, ...privateOnlyExtra].map((u) => {
                const unread = unreadByFrom[u.guestId] || u.unreadFromThem || 0
                return (
                  <button
                    key={u.guestId}
                    type="button"
                    onClick={() => openPrivate(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-900 text-left ${
                      unread > 0 ? 'ring-1 ring-red-500/60 bg-red-950/30' : ''
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        u.isOnline ? 'bg-emerald-400' : 'bg-gray-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate flex items-center gap-2">
                        {u.nickname}
                        {unread > 0 && (
                          <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            ✉ {unread}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        {unread > 0
                          ? 'Te ha escrito por privado — tocar para abrir'
                          : u.isOnline
                            ? 'En línea · tocar para chat privado'
                            : formatLastSeen(u.lastSeenAt)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
