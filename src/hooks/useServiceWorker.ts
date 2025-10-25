import React, { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    updateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setState(prev => ({ ...prev, registration, isRegistered: true }));

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setState(prev => ({ ...prev, isInstalling: true }));

            newWorker.addEventListener('statechange', () => {
              const currentState: string = newWorker.state;
              setState(prev => ({
                ...prev,
                isInstalling: currentState === 'installing',
                isWaiting: currentState === 'waiting',
                updateAvailable: currentState === 'waiting',
              }));
            });
          }
        });

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, [state.isSupported]);

  const updateServiceWorker = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const getCacheInfo = async () => {
    if (!state.registration?.active) return null;

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, size: keys.length };
        })
      );
      return cacheInfo;
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return null;
    }
  };

  return {
    ...state,
    updateServiceWorker,
    getCacheInfo,
  };
};
