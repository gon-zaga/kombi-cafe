'use client';

import { useEffect } from 'react';
import { useModal } from '@/app/ui/useModal';

export function useOnlineStatus() {
  const { showError, close } = useModal();

  useEffect(() => {
    const handleOffline = () => {
      showError(
        'No internet connection',
        'You appear to be offline. Please check your connection and try again.',
      );
    };

    const handleOnline = () => {
      close();
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showError, close]);
}
