import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, MessagesSquare } from 'lucide-react'
import { api } from '@/services/api'
import BackNavBar from '@/components/common/BackNavBar'

interface ChatMsg {
  id: string
  nickname: string
  body: string
  createdAt: string
}

const NICK_KEY = 'cap_globalChatNick'

export default function GlobalChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMsg[]>([])
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const res = await api.get('/global-chat')
      setMessages(res.data.messages || [])
    } catch {
      /* silencioso en polling */
    }
  }

  useEffect(() => {
    load()
    const t = window.setInterval(load, 4000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const body = text.trim()
    if (!body) return
    const nick = nickname.trim() || 'Anónimo'
    setSending(true)
    try {
      localStorage.setItem(NICK_KEY, nick)
      const res = await api.post('/global-chat', { nickname: nick, body })
      if (res.data.message) {
        setMessages((prev) => [...prev, res.data.message])
      }
      setText('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <BackNavBar backTo="/perfiles" />

      <header className="px-4 py-3 border-b border-gray-800 bg-gray-900/80">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/perfiles')}
            className="text-gray-400 hover:text-white"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg flex items-center gap-2">
              <MessagesSquare className="w-5 h-5 text-pink-400" />
              Chat global
            </h1>
            <p className="text-gray-400 text-xs">
              Habla con otros visitantes. Sé respetuoso. +18.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-12 space-y-2">
              <p>Aún no hay mensajes. ¡Sé el primero!</p>
              <p className="text-xs text-gray-600">Chat abierto para visitantes y anunciantes.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-pink-400 font-bold text-sm">{m.nickname}</span>
                <span className="text-gray-600 text-[10px]">
                  {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap break-words">{m.body}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={send}
        className="border-t border-gray-800 bg-gray-900 px-3 py-3 safe-area-bottom"
      >
        <div className="max-w-2xl mx-auto space-y-2">
          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 24))}
            placeholder="Tu apodo"
            maxLength={24}
            className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 400))}
              placeholder="Escribe un mensaje…"
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
    </div>
  )
}
