import { useState } from 'react'
import { X, Send } from 'lucide-react'
import { api } from '@/services/api'
import { showToast } from '@/store/toastStore'
import { sanitizePhoneInput } from '@/utils/phoneUtils'

type Props = {
  profileId: string
  profileTitle: string
  onClose: () => void
}

export default function GuestMessageModal({ profileId, profileTitle, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) {
      showToast('Escribe tu nombre', 'warning')
      return
    }
    if (!text.trim() || text.trim().length < 5) {
      showToast('Escribe un mensaje un poco más largo', 'warning')
      return
    }
    setIsSending(true)
    try {
      await api.post('/messages/guest', {
        toProfileId: profileId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        text: text.trim(),
      })
      showToast('Mensaje enviado correctamente', 'success')
      onClose()
    } catch (err: any) {
      showToast(err.response?.data?.error || 'No se pudo enviar el mensaje', 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-gradient-to-b from-purple-950 via-gray-950 to-gray-950 border border-purple-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-purple-900/40 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-purple-800/40">
          <div>
            <p className="text-purple-300 text-xs font-bold uppercase tracking-wider">Mensaje privado</p>
            <h2 className="text-white text-lg font-black">Escribe a {profileTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <p className="text-gray-400 text-xs leading-relaxed">
            No hace falta registrarse. El perfil recibirá tu mensaje en su bandeja de entrada.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              required
              placeholder="Tu nombre o alias"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono de contacto</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
              maxLength={40}
              placeholder="Solo números, ej: +34600000000"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              placeholder="opcional"
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-white text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mensaje *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={4}
              maxLength={2000}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-black text-base py-4 rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
            {isSending ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
