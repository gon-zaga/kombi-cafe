import { create } from 'zustand';

export type ModalVariant = 'error' | 'success' | 'info' | 'warning';

export interface ModalAction {
  label: string;
  onClick: () => void;
}

interface ModalState {
  isOpen: boolean;
  variant: ModalVariant;
  title: string;
  message: string;
  action?: ModalAction;
  open: (params: { variant?: ModalVariant; title: string; message: string; action?: ModalAction }) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  variant: 'error',
  title: '',
  message: '',
  action: undefined,
  open: (params) =>
    set({
      isOpen: true,
      variant: params.variant ?? 'error',
      title: params.title,
      message: params.message,
      action: params.action,
    }),
  close: () =>
    set({
      isOpen: false,
      variant: 'error',
      title: '',
      message: '',
      action: undefined,
    }),
}));
