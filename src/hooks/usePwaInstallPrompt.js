import { useCallback, useEffect, useState } from 'react';

function safeReadStandalone() {
  if (typeof window === 'undefined') return false;
  try {
    const mqStandalone = window.matchMedia?.('(display-mode: standalone)');
    const mqFullscreen = window.matchMedia?.('(display-mode: fullscreen)');
    const standaloneMq = Boolean(mqStandalone?.matches);
    const fullscreenMq = Boolean(mqFullscreen?.matches);
    let iosStandalone = false;
    if (typeof navigator !== 'undefined' && navigator != null) {
      iosStandalone = Boolean(navigator.standalone);
    }
    return standaloneMq || fullscreenMq || iosStandalone;
  } catch (e) {
    console.warn('[PWA] safeReadStandalone failed:', e);
    return false;
  }
}

/**
 * Safari < 14 / some WebViews only implement addListener on MediaQueryList, not addEventListener.
 * Calling the wrong API throws and can break the React tree on mobile.
 */
function subscribeMediaQueryChange(mql, handler) {
  if (!mql || typeof handler !== 'function') return () => {};
  try {
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => {
        try {
          mql.removeEventListener('change', handler);
        } catch (e) {
          console.warn('[PWA] MediaQueryList removeEventListener failed:', e);
        }
      };
    }
    if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
      return () => {
        try {
          mql.removeListener(handler);
        } catch (e) {
          console.warn('[PWA] MediaQueryList removeListener failed:', e);
        }
      };
    }
  } catch (e) {
    console.warn('[PWA] MediaQueryList subscribe failed:', e);
  }
  return () => {};
}

/**
 * Captures the PWA install prompt and exposes when the Install button should show.
 * All browser APIs are guarded so unsupported mobile browsers never crash the app.
 */
export default function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => safeReadStandalone());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let unsubStandalone = () => {};
    let unsubFullscreen = () => {};

    const onBeforeInstallPrompt = (event) => {
      try {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        setDeferredPrompt(event);
      } catch (e) {
        console.warn('[PWA] beforeinstallprompt handler failed:', e);
      }
    };

    const onAppInstalled = () => {
      try {
        setIsInstalled(true);
        setDeferredPrompt(null);
      } catch (e) {
        console.warn('[PWA] appinstalled handler failed:', e);
      }
    };

    try {
      const mqStandalone = window.matchMedia?.('(display-mode: standalone)');
      const mqFullscreen = window.matchMedia?.('(display-mode: fullscreen)');

      const syncStandalone = () => {
        try {
          setIsStandalone(safeReadStandalone());
        } catch (e) {
          console.warn('[PWA] syncStandalone failed:', e);
        }
      };

      syncStandalone();

      if (mqStandalone) {
        unsubStandalone = subscribeMediaQueryChange(mqStandalone, syncStandalone);
      }
      if (mqFullscreen) {
        unsubFullscreen = subscribeMediaQueryChange(mqFullscreen, syncStandalone);
      }
    } catch (e) {
      console.warn('[PWA] matchMedia setup failed (install listeners still active):', e);
    }

    try {
      window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.addEventListener('appinstalled', onAppInstalled);
    } catch (e) {
      console.warn('[PWA] window install event listeners failed:', e);
    }

    return () => {
      try {
        unsubStandalone();
        unsubFullscreen();
        window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.removeEventListener('appinstalled', onAppInstalled);
      } catch (e) {
        console.warn('[PWA] usePwaInstallPrompt cleanup failed:', e);
      }
    };
  }, []);

  const showInstallButton = Boolean(deferredPrompt) && !isStandalone && !isInstalled;

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt || typeof deferredPrompt.prompt !== 'function') {
      console.warn('[PWA] promptInstall: deferred prompt or prompt() unavailable');
      return;
    }
    try {
      await deferredPrompt.prompt();
      const choice = deferredPrompt.userChoice;
      if (choice && typeof choice.then === 'function') {
        await choice;
      }
    } catch (e) {
      console.warn('[PWA] promptInstall failed:', e);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return {
    deferredPrompt,
    showInstallButton,
    promptInstall,
    isStandalone,
    isInstalled
  };
}
