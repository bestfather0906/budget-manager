import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white shadow-lg border border-gray-200 rounded-xl px-4 py-3 min-w-64 animate-in slide-in-from-bottom-2">
      {type === 'success' ? (
        <CheckCircle size={18} className="text-green-500 shrink-0" />
      ) : (
        <XCircle size={18} className="text-red-500 shrink-0" />
      )}
      <p className="text-sm text-gray-700 flex-1">{message}</p>
      <button onClick={onClose}>
        <X size={14} className="text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  )
}
