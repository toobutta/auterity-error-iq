/**
 * PWA Hook for Progressive Web App functionality
 * Handles service worker registration, updates, and offline detection
 */

import { useState, useEffect } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  deferredPrompt: any;
}

interface PWAActions {
  install: () => Promise<void>;
  update: () => void;
  checkForUpdates: () => Promise<void>;
}

export const usePWA = (): PWAState & PWAActions => {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstalled: false,
    canInstall: false,
    updateAvailable: false,
    registration: null,
    deferredPrompt: null
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('[PWA] Back online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('[PWA] Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if app is already installed
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;

      setState(prev => ({
        ...prev,
        isInstalled: isStandalone || isInWebAppiOS
      }));
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isInstalled: e.matches }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();

      setState(prev => ({
        ...prev,
        canInstall: true,
        deferredPrompt: e
      }));
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        deferredPrompt: null
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration);

          setState(prev => ({ ...prev, registration }));

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;

            switch (type) {
              case 'CACHE_UPDATED':
                console.log('[PWA] Cache updated');
                break;
              case 'SYNC_COMPLETED':
                console.log('[PWA] Background sync completed');
                break;
              default:
                console.log('[PWA] Service worker message:', type, data);
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });
    }
  }, []);

  // Install the PWA
  const install = async (): Promise<void> => {
    if (!state.deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
    } else {
      console.log('[PWA] User dismissed install prompt');
    }

    setState(prev => ({
      ...prev,
      canInstall: false,
      deferredPrompt: null
    }));
  };

  // Update the service worker
  const update = (): void => {
    if (!state.registration?.waiting) return;

    // Tell the service worker to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page to activate the new service worker
    window.location.reload();
  };

  // Check for service worker updates
  const checkForUpdates = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      console.log('[PWA] Checked for updates');
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  };

  return {
    ...state,
    install,
    update,
    checkForUpdates
  };
};

export default usePWA;
