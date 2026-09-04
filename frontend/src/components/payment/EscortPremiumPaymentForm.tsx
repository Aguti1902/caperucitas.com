import { useState, useEffect } from 'react'
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { api } from '@/services/api'
import Button from '@/components/common/Button'

let stripePromise: Promise<any> | null = null

const getStripe = async () => {
  if (!stripePromise) {
    const response = await api.get('/payments/publishable-key')
    stripePromise = loadStripe(response.data.publishableKey)
  }
  return stripePromise
}

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function EscortPremiumPaymentForm({ onSuccess, onCancel }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripe, setStripe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activatedWithoutStripe, setActivatedWithoutStripe] = useState(false)

  useEffect(() => {
    let cancelled = false
    const initialize = async () => {
      try {
        const stripeInstance = await getStripe()
        if (cancelled) return
        setStripe(stripeInstance)

        const response = await api.post('/payments/escort-premium/payment-intent')
        if (cancelled) return
        if (response.data?.clientSecret) {
          setClientSecret(response.data.clientSecret)
        } else if (response.data?.isPremium || response.data?.profile) {
          setActivatedWithoutStripe(true)
          onSuccess()
        } else {
          setError('No se pudo iniciar el pago')
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Error al crear sesión de pago')
        }
      }
    }
    initialize()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (activatedWithoutStripe) return null

  if (error) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-red-400 text-sm">{error}</p>
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Cerrar
        </Button>
      </div>
    )
  }

  if (!clientSecret || !stripe) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-gray-400 text-sm">Preparando pago...</div>
      </div>
    )
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <PaymentFormContent onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}

function PaymentFormContent({ onSuccess, onCancel }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Error al procesar el pago')
        setIsProcessing(false)
        return
      }

      setTimeout(() => onSuccess(), 1200)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el pago')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-lg p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} fullWidth>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="accent"
          isLoading={isProcessing}
          disabled={!stripe || isProcessing}
          fullWidth
        >
          Pagar 20€
        </Button>
      </div>

      <p className="text-gray-500 text-xs text-center">
        Premium 1 mes: teléfono y WhatsApp públicos en tu anuncio de escort.
      </p>
    </form>
  )
}
