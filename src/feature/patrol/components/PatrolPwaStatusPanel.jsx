import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';

import { db } from 'pwa/db';
import {
  getExistingPushSubscription,
  getNotificationPermission,
  isPushNotificationSupported,
  sendTestNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from 'pwa/pushNotificationService';
import {
  flushSyncQueue,
  resetTerminalSyncFailures,
  SYNC_QUEUE_STATUS_FAILED,
  SYNC_QUEUE_STATUS_PENDING,
  SYNC_RESULT_STATUS_CONFLICT,
  SYNC_RESULT_STATUS_EXHAUSTED,
  SYNC_RESULT_STATUS_VALIDATION_FAILED
} from 'pwa/syncService';
import { useNetworkStatus } from 'pwa/useNetworkStatus';

const POLL_INTERVAL_MS = 3000;

function formatTimestamp(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function permissionChipColor(permission) {
  if (permission === 'granted') return 'success';
  if (permission === 'denied') return 'error';
  if (permission === 'default') return 'warning';
  return 'default';
}

/**
 * PWA/GPS telemetry panel for the patrol page.
 * Read-only status surface: no GPS lifecycle or geolocation API calls.
 */
export default function PatrolPwaStatusPanel({ patrolId, trackingActive }) {
  const isOnline = useNetworkStatus();
  const [locationLogCount, setLocationLogCount] = useState(0);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState(null);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [failedQueueCount, setFailedQueueCount] = useState(0);
  const [validationFailedCount, setValidationFailedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [exhaustedCount, setExhaustedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermission());
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  const pushSupported = isPushNotificationSupported();

  const refreshPushState = useCallback(async () => {
    setNotificationPermission(getNotificationPermission());
    if (!pushSupported) {
      setPushSubscribed(false);
      return;
    }
    try {
      const subscription = await getExistingPushSubscription();
      setPushSubscribed(Boolean(subscription));
    } catch {
      setPushSubscribed(false);
    }
  }, [pushSupported]);

  const loadPanelStats = useCallback(async () => {
    try {
      const [pendingCount, failedRows] = await Promise.all([
        db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_PENDING).count(),
        db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_FAILED).toArray()
      ]);

      setPendingQueueCount(pendingCount);
      setFailedQueueCount(failedRows.length);
      setValidationFailedCount(failedRows.filter((row) => row.resultStatus === SYNC_RESULT_STATUS_VALIDATION_FAILED).length);
      setConflictCount(failedRows.filter((row) => row.resultStatus === SYNC_RESULT_STATUS_CONFLICT).length);
      setExhaustedCount(failedRows.filter((row) => row.resultStatus === SYNC_RESULT_STATUS_EXHAUSTED).length);

      if (!patrolId) {
        setLocationLogCount(0);
        setLastSavedTimestamp(null);
        setErrorText('');
        return;
      }

      const rows = await db.location_logs.where('patrolId').equals(patrolId).toArray();
      setLocationLogCount(rows.length);

      const latest = rows.reduce((maxTs, row) => {
        const ts = Number(row?.timestamp);
        return Number.isFinite(ts) && ts > maxTs ? ts : maxTs;
      }, 0);

      setLastSavedTimestamp(latest > 0 ? latest : null);
      setErrorText('');
    } catch (error) {
      setErrorText(error?.message || 'Failed to load PWA patrol stats');
    }
  }, [patrolId]);

  useEffect(() => {
    let active = true;

    const tick = async () => {
      if (!active) return;
      await loadPanelStats();
      await refreshPushState();
    };

    void tick();
    const timerId = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timerId);
    };
  }, [loadPanelStats, refreshPushState]);

  const handleRetrySync = async () => {
    try {
      setSyncing(true);
      setErrorText('');
      await resetTerminalSyncFailures();
      await flushSyncQueue();
      await loadPanelStats();
    } catch (error) {
      setErrorText(error?.message || 'Retry sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setPushBusy(true);
      setPushMessage('');
      await subscribeToPushNotifications();
      await refreshPushState();
      setPushMessage('Push notifications enabled.');
    } catch (error) {
      setPushMessage(error?.message || 'Failed to enable notifications');
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setPushBusy(true);
      setPushMessage('');
      const result = await sendTestNotification();
      if (result?.success === false) {
        throw new Error(result?.message || 'Test notification failed');
      }
      setPushMessage('Test notification sent. Check your device notifications.');
    } catch (error) {
      setPushMessage(error?.message || 'Failed to send test notification');
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setPushBusy(true);
      setPushMessage('');
      await unsubscribeFromPushNotifications();
      await refreshPushState();
      setPushMessage('Push notifications disabled.');
    } catch (error) {
      setPushMessage(error?.message || 'Failed to disable notifications');
      await refreshPushState();
    } finally {
      setPushBusy(false);
    }
  };

  const queueSummary = useMemo(() => pendingQueueCount + failedQueueCount, [pendingQueueCount, failedQueueCount]);

  const needsSyncAttention = failedQueueCount > 0 || validationFailedCount > 0 || conflictCount > 0 || exhaustedCount > 0;

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6">PWA / GPS Status</Typography>
        <Button variant="outlined" size="small" onClick={handleRetrySync} disabled={syncing || queueSummary === 0}>
          {syncing ? 'Syncing...' : 'Retry Sync'}
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
        <Chip label={isOnline ? 'Online' : 'Offline'} color={isOnline ? 'success' : 'warning'} size="small" />
        <Chip label={trackingActive ? 'GPS Active' : 'GPS Inactive'} color={trackingActive ? 'success' : 'default'} size="small" />
        <Chip label={patrolId ? `Patrol #${patrolId}` : 'No Active Patrol'} color={patrolId ? 'primary' : 'default'} size="small" />
      </Stack>

      {needsSyncAttention ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some patrol logs require attention. Backend validation may be incomplete.
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
        <Typography variant="body2">Last saved location:</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatTimestamp(lastSavedTimestamp)}
        </Typography>

        <Typography variant="body2">Local location logs:</Typography>
        <Typography variant="body2" color="text.secondary">
          {locationLogCount}
        </Typography>

        <Typography variant="body2">Pending sync queue:</Typography>
        <Typography variant="body2" color="text.secondary">
          {pendingQueueCount}
        </Typography>

        <Typography variant="body2">Failed sync queue:</Typography>
        <Typography variant="body2" color="text.secondary">
          {failedQueueCount}
        </Typography>

        <Typography variant="body2">Validation failed:</Typography>
        <Typography variant="body2" color="text.secondary">
          {validationFailedCount}
        </Typography>

        <Typography variant="body2">Sync conflicts:</Typography>
        <Typography variant="body2" color="text.secondary">
          {conflictCount}
        </Typography>

        <Typography variant="body2">Retries exhausted:</Typography>
        <Typography variant="body2" color="text.secondary">
          {exhaustedCount}
        </Typography>
      </Box>

      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Push notifications
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          <Chip label={`Permission: ${notificationPermission}`} color={permissionChipColor(notificationPermission)} size="small" />
          {pushSupported ? (
            <Chip label={pushSubscribed ? 'Subscribed' : 'Not subscribed'} color={pushSubscribed ? 'success' : 'default'} size="small" />
          ) : (
            <Chip label="Not supported" size="small" />
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="contained"
            size="small"
            onClick={handleEnableNotifications}
            disabled={!pushSupported || pushBusy || pushSubscribed || notificationPermission === 'denied'}
          >
            Enable Notifications
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDisableNotifications}
            disabled={!pushSupported || pushBusy || !pushSubscribed}
          >
            Disable Notifications
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={handleSendTestNotification}
            disabled={!pushSupported || pushBusy || !pushSubscribed || notificationPermission !== 'granted'}
          >
            Send Test Notification
          </Button>
        </Stack>

        {pushMessage ? (
          <Alert
            severity={
              pushMessage.includes('enabled') || pushMessage.includes('disabled') || pushMessage.includes('Test notification sent')
                ? 'success'
                : 'warning'
            }
            sx={{ mt: 1.5 }}
          >
            {pushMessage}
          </Alert>
        ) : null}
      </Box>

      {errorText ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {errorText}
        </Alert>
      ) : null}
    </Paper>
  );
}
