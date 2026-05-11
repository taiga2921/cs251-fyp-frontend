import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';

import { db } from 'pwa/db';
import { flushSyncQueue, SYNC_QUEUE_STATUS_FAILED, SYNC_QUEUE_STATUS_PENDING } from 'pwa/syncService';
import { useNetworkStatus } from 'pwa/useNetworkStatus';

const POLL_INTERVAL_MS = 3000;

function formatTimestamp(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
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
  const [syncing, setSyncing] = useState(false);
  const [errorText, setErrorText] = useState('');

  const loadPanelStats = useCallback(async () => {
    try {
      const [pendingCount, failedCount] = await Promise.all([
        db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_PENDING).count(),
        db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_FAILED).count()
      ]);

      setPendingQueueCount(pendingCount);
      setFailedQueueCount(failedCount);

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
    };

    void tick();
    const timerId = setInterval(() => {
      void tick();
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timerId);
    };
  }, [loadPanelStats]);

  const handleRetrySync = async () => {
    try {
      setSyncing(true);
      setErrorText('');
      await flushSyncQueue();
      await loadPanelStats();
    } catch (error) {
      setErrorText(error?.message || 'Retry sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const queueSummary = useMemo(() => pendingQueueCount + failedQueueCount, [pendingQueueCount, failedQueueCount]);

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
      </Box>

      {errorText ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {errorText}
        </Alert>
      ) : null}
    </Paper>
  );
}
