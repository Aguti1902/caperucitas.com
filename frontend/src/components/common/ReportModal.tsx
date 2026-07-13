import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';

interface ReportModalProps {
  profileId: string;
  profileTitle: string;
  onClose: () => void;
  onReportSent: () => void;
  isAuthenticated?: boolean;
}

const REPORT_REASONS = [
  { value: 'scam', label: '🎭 Engaño o estafa', description: 'El perfil es engañoso o intenta estafar' },
  { value: 'fake_photos', label: '🖼️ Fotos falsas', description: 'Las fotos no corresponden a la persona real' },
  { value: 'underage', label: '🔞 Es menor de edad', description: 'La persona parece ser menor de 18 años' },
  { value: 'money_request', label: '💰 Pide dinero o regalos', description: 'Solicita compensación económica (prohibido en Sexo gratis)' },
];

export default function ReportModal({ profileId, profileTitle, onClose, onReportSent, isAuthenticated }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Por favor, selecciona un motivo de denuncia');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = isAuthenticated ? '/reports' : '/reports/public';
      await api.post(endpoint, {
        reportedProfileId: profileId,
        reason: selectedReason,
      });

      onReportSent();
      onClose();
    } catch (err: any) {
      console.error('Error al enviar denuncia:', err);
      if (err.response?.data?.error === 'Ya has denunciado este perfil') {
        setError('Ya has denunciado este perfil anteriormente');
      } else {
        setError('Error al enviar la denuncia. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Denunciar perfil</h2>
              <p className="text-sm text-gray-400">{profileTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            Selecciona el motivo de tu denuncia. Solo puedes denunciar a cada perfil una vez.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedReason === reason.value
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    setError('');
                  }}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{reason.label}</div>
                    <div className="text-sm text-gray-400">{reason.description}</div>
                  </div>
                  {selectedReason === reason.value && (
                    <div className="text-primary text-xl">✓</div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Info */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              ℹ️ <strong>Importante:</strong> Tu denuncia será revisada por nuestro equipo. 
              El abuso de este sistema puede resultar en la suspensión de tu cuenta.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 rounded-full bg-gray-800 text-white font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar denuncia'}
          </button>
        </div>
      </div>
    </div>
  );
}

