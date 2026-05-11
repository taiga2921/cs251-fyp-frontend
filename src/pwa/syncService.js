import api from 'api/api';
import { db } from './db';
import { SYNC_QUEUE_TYPE_LOCATION_LOG, SYNC_STATUS_SYNCED } from './locationLogService';

export const SYNC_QUEUE_STATUS_PENDING = 'pending';
export const SYNC_QUEUE_STATUS_FAILED = 'failed';
export const SYNC_QUEUE_STATUS_SYNCING = 'syncing';
export const SYNC_QUEUE_STATUS_SYNCED = 'synced';

let activeFlush = null;

async function collectPendingOrFailedSorted() {
  const [pending, failed] = await Promise.all([
    db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_PENDING).toArray(),
    db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_FAILED).toArray()
  ]);
  return [...pending, ...failed].sort((a, b) => a.createdAt - b.createdAt);
}

async function markSyncing(id) {
  await db.sync_queue.update(id, { status: SYNC_QUEUE_STATUS_SYNCING });
}

async function markSynced(item) {
  await db.transaction('rw', db.sync_queue, db.location_logs, async () => {
    await db.sync_queue.update(item.id, { status: SYNC_QUEUE_STATUS_SYNCED });
    if (item.type === SYNC_QUEUE_TYPE_LOCATION_LOG && item.payload?.locationLogId) {
      await db.location_logs.update(item.payload.locationLogId, { syncStatus: SYNC_STATUS_SYNCED });
    }
  });
}

async function markFailed(item) {
  const retryCount = (item.retryCount ?? 0) + 1;
  const lastAttempt = Date.now();
  await db.sync_queue.update(item.id, {
    status: SYNC_QUEUE_STATUS_FAILED,
    retryCount,
    lastAttempt
  });
}

async function runFlush() {
  while (true) {
    const items = await collectPendingOrFailedSorted();
    const item = items[0];
    if (!item) break;

    if (item.payload == null || typeof item.payload !== 'object') {
      await markFailed(item);
      break;
    }

    await markSyncing(item.id);

    try {
      await api.post('/pwa/sync', item.payload);
      await markSynced(item);
    } catch {
      try {
        await markFailed(item);
      } catch (metaErr) {
        console.warn('[sync] failed to update queue after error', metaErr);
      }
      break;
    }
  }
}

/**
 * Processes sync_queue items one at a time (oldest first). Serialized — concurrent calls share one run.
 * Errors are contained; does not throw to callers for normal sync/API failures.
 */
export function flushSyncQueue() {
  if (!activeFlush) {
    activeFlush = runFlush()
      .catch((err) => {
        console.warn('[sync] flush aborted', err);
      })
      .finally(() => {
        activeFlush = null;
      });
  }
  return activeFlush;
}
