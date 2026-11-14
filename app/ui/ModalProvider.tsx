'use client';

import { useEffect } from 'react';
import { useModalStore } from '@/store/ModalStore';
import { useOnlineStatus } from '@/app/lib/useOnlineStatus';
import Modal from './Modal';

export function ModalProvider() {
  const { isOpen, variant, title, message, action, close } = useModalStore();

  useOnlineStatus();

  return (
    <>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          variant={variant}
          title={title}
          message={message}
          action={action}
          onClose={close}
        />
      )}
    </>
  );
}
