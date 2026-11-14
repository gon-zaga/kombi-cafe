'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  variant: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}

const variantStyles: Record<'error' | 'success' | 'info' | 'warning', { icon: string; titleColor: string }> = {
  error: { icon: 'bg-red-100 text-red-600', titleColor: 'text-red-800' },
  success: { icon: 'bg-green-100 text-green-600', titleColor: 'text-green-800' },
  info: { icon: 'bg-blue-100 text-blue-600', titleColor: 'text-blue-800' },
  warning: { icon: 'bg-yellow-100 text-yellow-600', titleColor: 'text-yellow-800' },
};

const variantIcons: Record<'error' | 'success' | 'info' | 'warning', string> = {
  error: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  success: 'M5 13l4 4L19 7',
  info: 'M12 9v4m0 4h.01M13 16h-1v-4h-1v1m0-0h.01M12 12a3 3 0 100-6 3 3 0 000 6z',
  warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
};

export default function Modal({
  isOpen,
  variant,
  title,
  message,
  action,
  onClose,
}: ModalProps) {
  const style = variantStyles[variant];

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-modal-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.icon}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={variantIcons[variant]} />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="global-modal-title" className={`text-lg font-bold ${style.titleColor} font-roboto-slab`}>
                {title}
              </h2>
              <p className="text-dark-brown/70 mt-1 break-words">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-dark-brown/50 hover:text-dark-brown text-2xl leading-none p-1 -mt-1"
          >
            ×
          </button>
        </div>
        {action && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-dark-brown rounded-xl hover:bg-dark-brown/90 transition-colors"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
