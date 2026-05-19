/** Background Sync tag — must match `registration.sync.register()` and SW `sync` handler. */
export const PWA_SYNC_QUEUE_TAG = 'pwa-sync-queue';

/** Posted from SW to all window clients when a background sync event fires. */
export const PWA_SYNC_REQUEST_MESSAGE_TYPE = 'PWA_SYNC_REQUEST';

export function isBackgroundSyncSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window;
}

/**
 * Registers a one-shot Background Sync for the patrol sync queue (no-op when unsupported).
 * @returns {Promise<boolean>} true when registration succeeded
 */
export async function registerPwaSyncQueueBackgroundSync() {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(PWA_SYNC_QUEUE_TAG);
    console.info('[PWA] Background Sync registered:', PWA_SYNC_QUEUE_TAG);
    return true;
  } catch (err) {
    console.warn('[PWA] Background Sync registration failed', err);
    return false;
  }
}
