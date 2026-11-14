'use client';

import { useModalStore } from '@/store/ModalStore';

export function useModal() {
  const open = useModalStore((state) => state.open);
  const close = useModalStore((state) => state.close);

  return {
    showError: (
      title: string,
      message: string,
      action?: { label: string; onClick: () => void },
    ) => {
      open({ variant: 'error', title, message, action });
    },
    showInfo: (
      title: string,
      message: string,
      action?: { label: string; onClick: () => void },
    ) => {
      open({ variant: 'info', title, message, action });
    },
    showWarning: (
      title: string,
      message: string,
      action?: { label: string; onClick: () => void },
    ) => {
      open({ variant: 'warning', title, message, action });
    },
    close,
  };
}
