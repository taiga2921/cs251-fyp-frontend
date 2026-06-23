import { emitPatrolRealtimeNotification } from 'services/realtime/patrolRealtimeNotifier';

function upsertById(list, item) {
  if (!item?.id) {
    return [item, ...list];
  }
  const index = list.findIndex((row) => row.id === item.id);
  if (index === -1) {
    return [item, ...list];
  }
  const next = [...list];
  next[index] = { ...next[index], ...item };
  return next;
}

export function handleMonitoringRealtimeEvent(
  { name, payload },
  { setSessions, setStats, setSummariesBySessionId, loadStats, loadSessions }
) {
  switch (name) {
    case 'PatrolSessionStarted': {
      const session = payload?.session;
      if (session?.id) {
        setSessions((prev) => upsertById(prev, session));
      }
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1
      }));
      emitPatrolRealtimeNotification({
        severity: 'info',
        message: `Patrol started${session?.user?.name ? ` — ${session.user.name}` : ''}.`
      });
      break;
    }
    case 'PatrolSessionCompleted': {
      const session = payload?.session;
      const status = payload?.status ?? session?.status;
      if (session?.id) {
        setSessions((prev) => upsertById(prev, session));
      }
      setStats((prev) => ({
        ...prev,
        active: Math.max(0, prev.active - 1),
        completed: status === 'completed' ? prev.completed + 1 : prev.completed,
        aborted: status === 'aborted' ? prev.aborted + 1 : prev.aborted
      }));
      emitPatrolRealtimeNotification({
        severity: status === 'aborted' ? 'warning' : 'success',
        message: status === 'aborted' ? 'Patrol aborted.' : 'Patrol completed.'
      });
      void loadStats();
      void loadSessions();
      break;
    }
    case 'PatrolCheckpointSuspicious': {
      setStats((prev) => ({ ...prev, suspiciousEvents: prev.suspiciousEvents + 1 }));
      emitPatrolRealtimeNotification({
        severity: 'warning',
        message: `Suspicious checkpoint detected (${payload?.status ?? 'review'}).`
      });
      void loadSessions();
      break;
    }
    case 'PatrolCheckpointVerified': {
      emitPatrolRealtimeNotification({
        severity: 'success',
        message: 'Checkpoint verified.'
      });
      break;
    }
    case 'PatrolValidationCompleted': {
      emitPatrolRealtimeNotification({
        severity: 'info',
        message: 'Patrol validation completed.'
      });
      void loadStats();
      void loadSessions();
      break;
    }
    default:
      break;
  }
}

export function handleSessionRealtimeEvent(
  { name, payload },
  patrolSessionId,
  { setSession, setPatrolRoutes, setCheckpointEvents, setValidationResult, setSummary, loadSummary, loadCheckpointEvents, queueRoutePoint }
) {
  if (payload?.patrol_session_id && payload.patrol_session_id !== patrolSessionId) {
    return;
  }

  switch (name) {
    case 'PatrolRouteUpdated': {
      const point = {
        id: payload?.id ?? `${payload.recorded_at}-${payload.latitude}-${payload.longitude}`,
        patrol_session_id: payload.patrol_session_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy ?? null,
        recorded_at: payload.recorded_at
      };
      queueRoutePoint(point);
      break;
    }
    case 'PatrolCheckpointVerified':
    case 'PatrolCheckpointSuspicious': {
      const event = payload?.event;
      if (event?.id) {
        setCheckpointEvents((prev) => upsertById(prev, event));
      } else {
        void loadCheckpointEvents();
      }
      if (name === 'PatrolCheckpointSuspicious') {
        emitPatrolRealtimeNotification({
          severity: 'warning',
          message: `Checkpoint flagged as ${payload?.status ?? 'suspicious'}.`
        });
      }
      break;
    }
    case 'PatrolSessionCompleted': {
      const session = payload?.session;
      if (session) {
        setSession(session);
      }
      emitPatrolRealtimeNotification({
        severity: payload?.status === 'aborted' ? 'warning' : 'success',
        message: payload?.status === 'aborted' ? 'Patrol aborted.' : 'Patrol completed.'
      });
      break;
    }
    case 'PatrolValidationCompleted': {
      if (payload?.validation) {
        setValidationResult(payload.validation);
      }
      emitPatrolRealtimeNotification({
        severity: 'info',
        message: 'Validation completed for this patrol session.'
      });
      void loadSummary();
      void loadCheckpointEvents();
      // Full validation payload (incl. anomalies.items) is broadcast; if absent, summary/events refresh only.
      break;
    }
    default:
      break;
  }
}
