'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, Toast } from '@/store/ToastStore';

const typeStyles: Record<Toast['type'], string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-600 text-white',
  info: 'bg-blue-600 text-white',
};

const positionStyles: Record<NonNullable<Toast['position']>, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

const DEFAULT_POSITION: NonNullable<Toast['position']> = 'bottom-right';

export function ToastContainer({ position = DEFAULT_POSITION }: { position?: Toast['position'] }) {
  const { toasts, removeToast } = useToastStore();
  const pos = position ?? DEFAULT_POSITION;
  const filteredToasts = toasts.filter((t) => t.position === pos || (!t.position && pos === DEFAULT_POSITION));

  return (
    <AnimatePresence>
      {filteredToasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed z-50 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-md flex items-center gap-3 ${typeStyles[toast.type]} ${positionStyles[pos]}`}
          role="alert"
          aria-live="polite"
        >
          <span className="flex-1 text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function ToastProvider() {
  const { toasts } = useToastStore();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        useToastStore.getState().removeToast(toast.id);
      }, toast.duration ?? 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <>
      <ToastContainer position="top-left" />
      <ToastContainer position="top-right" />
      <ToastContainer position="bottom-left" />
      <ToastContainer position="bottom-right" />
    </>
  );
}

export function useToast() {
  const { addToast, removeToast } = useToastStore();
  return {
    toast: (message: string, options?: { type?: Toast['type']; position?: Toast['position']; duration?: number }) => {
      addToast({ message, type: options?.type ?? 'info', position: options?.position, duration: options?.duration });
    },
    success: (message: string, options?: { position?: Toast['position']; duration?: number }) => {
      addToast({ message, type: 'success', position: options?.position, duration: options?.duration });
    },
    error: (message: string, options?: { type?: Toast['type']; position?: Toast['position']; duration?: number }) => {
      addToast({ message, type: options?.type ?? 'error', position: options?.position, duration: options?.duration });
    },
    warning: (message: string, options?: { position?: Toast['position']; duration?: number }) => {
      addToast({ message, type: 'warning', position: options?.position, duration: options?.duration });
    },
    info: (message: string, options?: { position?: Toast['position']; duration?: number }) => {
      addToast({ message, type: 'info', position: options?.position, duration: options?.duration });
    },
    dismiss: removeToast,
  };
}