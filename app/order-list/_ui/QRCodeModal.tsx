'use client'

import { useEffect } from 'react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-200">
          <h2 id="qr-modal-title" className="text-xl font-bold text-gray-900">
            GCash QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            aria-label="Close QR code modal"
          >
            ×
          </button>
        </div>

        {/* QR Code Image */}
        <div className="p-6 flex flex-col items-center">
          <img
            src="/qr-code.jpg"
            alt="GCash QR code for payment"
            className="max-w-full max-h-[400px] object-contain rounded-lg border border-gray-200"
          />

        </div>
      </div>
    </div>
  )
}