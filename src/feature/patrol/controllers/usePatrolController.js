import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCATION_SOURCE } from 'pwa/locationLogService';
import { db } from 'pwa/db';
import {
  flushSyncQueue,
  SYNC_QUEUE_STATUS_FAILED,
  SYNC_QUEUE_STATUS_PENDING,
  SYNC_RESULT_STATUS_CONFLICT,
  SYNC_RESULT_STATUS_EXHAUSTED,
  SYNC_RESULT_STATUS_VALIDATION_FAILED
} from 'pwa/syncService';
import { useAuthController } from '../../authentication/controllers/useAuthController';
import {
  capturePatrolLocationSnapshot,
  calculateDistance as haversineDistanceMeters,
  startPatrolTracking,
  stopPatrolTracking
} from '../services/geolocationService';

/**
 * Custom hook for managing patrol operations including:
 * - Patrol creation and management
 * - Real-time geolocation tracking (via `feature/patrol/services/geolocationService` — not raw `navigator.geolocation`)
 * - Checkpoint proximity checks (auto-completion deferred — see milestone notes)
 * - Progress monitoring
 * - Patrol route footprint tracking
 */
export const usePatrolController = (repository) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthController();

  // ============== STATE MANAGEMENT ==============

  /** Patrol form data */
  const [formData, setFormData] = useState({
    guard_id: '', // Current authenticated guard
    zone_id: '', // Selected patrol zone
    time_start: '', // Patrol start time
    time_end: '', // Patrol end time
    status: 'in_progress', // Default status
    completion_percentage: 0 // Progress tracker
  });

  /** Available zones for dropdown selection */
  const [zoneOptions, setZoneOptions] = useState([]);

  /** Form validation errors */
  const [errors, setErrors] = useState({});

  /** Loading states */
  const [loading, setLoading] = useState(true); // Initial data loading
  const [patrolLoading, setPatrolLoading] = useState(false); // Patrol operations

  /** Checkpoint data */
  const [checkpoints, setCheckpoints] = useState([]); // All checkpoints in selected zone
  const [cpNumber, setCpNumber] = useState(0); // Total checkpoint count

  /** Checkpoint log data */
  const [checkpointLogs, setCheckpointLogs] = useState([]); // Individual checkpoint visit records

  /** Patrol routes data */
  const [patrolRoutes, setPatrolRoutes] = useState([]); // Guard's geolocation footprint

  /** Geolocation tracking — browser watch is owned by patrol geolocationService singleton */
  const [currentPosition, setCurrentPosition] = useState(null); // Latest GPS position
  const [locationDisplay, setLocationDisplay] = useState(''); // Formatted location string for UI

  const [distanceCalc, setDistanceCalc] = useState();
  const checkpointsRef = useRef([]);
  const checkpointLogsRef = useRef([]);
  /** Set synchronously when a patrol session is created — `patrols` state is stale inside the same async start flow */
  const activePatrolSessionIdRef = useRef(null);
  /** Last coords POSTed to `/patrol-routes` — avoids stale `patrolRoutes` closure in the GPS watch */
  const lastPostedRouteCoordsRef = useRef(null);
  /** Guard user id for the active patrol session (resume snapshot when React state is stale) */
  const activeGuardUserIdRef = useRef(null);
  /** Debounce rapid visibility/focus resume captures */
  const lastResumeCaptureAtRef = useRef(0);
  /** Latest geofence/route helpers for resume handler (avoids stale useCallback closures) */
  const checkNearbyCheckpointsRef = useRef(() => {});
  const recordPatrolRouteRef = useRef(async () => {});

  const [patrols, setPatrols] = useState([]);

  /** Gap-aware summary from `GET /patrol-sessions/{id}/summary` (after patrol stop) */
  const [patrolSummary, setPatrolSummary] = useState(null);
  const [patrolSummaryLoading, setPatrolSummaryLoading] = useState(false);
  const [patrolSummaryError, setPatrolSummaryError] = useState(null);
  const [summaryMayBeIncomplete, setSummaryMayBeIncomplete] = useState(false);

  /** Stop-patrol finalization: sync → validate → summary */
  const [validatingPatrol, setValidatingPatrol] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validationWarning, setValidationWarning] = useState(null);
  const [finalizingStep, setFinalizingStep] = useState('idle');

  // ============== CONSTANTS ==============

  /** Default geofence radius in meters */
  const DEFAULT_GEOFENCE_RADIUS = 20;

  /** Accuracy buffer to account for GPS inaccuracies */
  const ACCURACY_BUFFER = 10;

  /** Minimum distance between route points (in meters) to avoid too many points */
  const MIN_ROUTE_DISTANCE = 5;

  /** Cooldown between resume-based GPS snapshots (visibility/focus) */
  const RESUME_CAPTURE_COOLDOWN_MS = 5000;

  const FINALIZING_STEP = {
    IDLE: 'idle',
    SYNCING: 'syncing',
    VALIDATING: 'validating',
    LOADING_SUMMARY: 'loading_summary',
    COMPLETED: 'completed',
    FAILED: 'failed'
  };

  // ============== DATA LOADING ==============

  /**
   * Fetch all available zones from the repository
   * Transforms data for dropdown compatibility
   */
  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const data = await repository.getAllZones();
      const options = data.map((zone) => ({
        value: zone.id,
        label: zone.name
      }));
      setZoneOptions(options);
    } catch (error) {
      console.error('Failed to load zones:', error);
      setZoneOptions([]);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  // ============== EFFECTS & INITIALIZATION ==============

  /**
   * Prefill guard_id when currentUser is available
   * Runs when currentUser or guard_id changes
   */
  useEffect(() => {
    if (currentUser?.id && !formData.guard_id) {
      setFormData((prev) => ({ ...prev, guard_id: currentUser.id }));
    }
  }, [currentUser, formData.guard_id]);

  /**
   * Load available zones on component mount
   */
  useEffect(() => {
    loadZones();
  }, [loadZones]);

  /**
   * Cleanup patrol GPS watch on unmount (`stopPatrolTracking` clears the singleton watch in patrol geolocationService).
   */
  useEffect(() => {
    return () => {
      stopPatrolTracking();
    };
  }, []);

  // Update refs when state changes
  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);

  useEffect(() => {
    checkpointLogsRef.current = checkpointLogs;
  }, [checkpointLogs]);

  /**
   * Haversine distance (meters) for checkpoint proximity + route spacing; delegates math to patrol geolocationService
   * and updates `distanceCalc` for UI parity with the previous implementation.
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const d = haversineDistanceMeters(lat1, lon1, lat2, lon2);
    if (Number.isFinite(d)) {
      setDistanceCalc(d);
      return d;
    }
    setDistanceCalc(undefined);
    return Infinity;
  }, []);

  // ============== FORM HANDLING ==============

  /**
   * Creates a change handler for form fields
   * @param {string} field - Field name to update
   * @returns {Function} Event handler function
   */
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  /**
   * Validates all form fields before submission
   * @returns {boolean} True if validation passes, false otherwise
   */
  const validate = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.guard_id) newErrors.guard_id = 'Guard is required';
    if (!formData.zone_id) newErrors.zone_id = 'Zone is required';
    if (!formData.time_start) newErrors.time_start = 'Start time is required';
    if (!formData.time_end) newErrors.time_end = 'End time is required';
    // Logical validations
    else if (new Date(formData.time_end) < new Date(formData.time_start)) {
      newErrors.time_end = 'End time cannot be before start time';
    }

    // Range validations
    if (formData.completion_percentage < 0 || formData.completion_percentage > 100) {
      newErrors.completion_percentage = 'Completion percentage must be between 0 and 100';
    }

    // Enum validations
    if (formData.status && !['in_progress', 'completed', 'cancelled'].includes(formData.status)) {
      newErrors.status = 'Invalid status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============== NAVIGATION HELPERS ==============

  const handleAddPatrol = () => navigate('/admin/patrolManagement/add');
  const handleViewPatrol = (patrolId) => navigate(`/admin/patrolManagement/view/${patrolId}`);
  const handleEditPatrol = (patrolId) => navigate(`/admin/patrolManagement/edit/${patrolId}`);

  // ============== PATROL OPERATIONS ==============

  /**
   * Main function to start a new patrol
   * 1. Creates **`patrol_sessions`** row (UUID); same id is **`patrolId`** for PWA `saveLocationLog` / `POST /pwa/sync`.
   * 2. Fetches checkpoints for selected zone
   * 3. Creates Laravel **`checkpoint_events`** placeholders (`pending`)
   * 4. Starts geolocation tracking (unchanged architecture)
   */
  const handleStartPatrol = async () => {
    // Validate zone selection
    if (!formData.zone_id) {
      setErrors({ zone_id: 'Zone is required' });
      return;
    }

    try {
      setPatrolLoading(true);
      lastPostedRouteCoordsRef.current = null;
      setPatrolSummary(null);
      setPatrolSummaryError(null);
      setPatrolSummaryLoading(false);
      setSummaryMayBeIncomplete(false);
      setValidatingPatrol(false);
      setValidationError(null);
      setValidationResult(null);
      setValidationWarning(null);
      setFinalizingStep(FINALIZING_STEP.IDLE);

      // 1. Create patrol session (canonical id for GPS IndexedDB + `/api/pwa/sync`)
      const now = new Date().toISOString();
      const patrolData = {
        guard_id: formData.guard_id,
        zone_id: formData.zone_id,
        time_start: now,
        time_end: now,
        status: 'in_progress',
        completion_percentage: 0
      };

      const newPatrol = await repository.createPatrol(patrolData);
      activePatrolSessionIdRef.current = newPatrol?.data?.id ?? null;
      setPatrols(newPatrol);

      // 2. Fetch checkpoints for the selected zone (repository + patrolService return a plain array)
      const checkpointList = await repository.getAllCheckpointsByZoneId(formData.zone_id);
      setCheckpoints(checkpointList);

      alert(`Patrol started successfully! Found ${checkpointList.length} checkpoints.`);

      // 3. Create initial checkpoint logs (unvisited state)
      const simplifiedCheckpoints = checkpointList.map((checkpoint) => ({
        patrol_session_id: newPatrol.data.id,
        checkpoint_id: checkpoint.id
      }));

      const cpLogs = await repository.createBatchCheckpointLogs(simplifiedCheckpoints);

      // Extract actual log data from API responses
      const logsData = cpLogs.map((response) => response.data);
      setCheckpointLogs(logsData);

      // Initialize empty patrol routes array
      setPatrolRoutes([]);

      // 4. Update UI state and start tracking
      setCpNumber(checkpointList.length);

      const patrolSessionId = newPatrol.data.id;
      const guardUserId = newPatrol.data.guard_id ?? formData.guard_id ?? currentUser?.id;
      activeGuardUserIdRef.current = guardUserId ?? null;
      await startGeolocationTracking(patrolSessionId, guardUserId);
    } catch (error) {
      console.error('Failed to start patrol:', error);
      alert('Failed to start patrol. Please try again.');
    } finally {
      setPatrolLoading(false);
    }
  };

  // ============== GEOLOCATION MANAGEMENT ==============

  /**
   * Starts patrol GPS via domain geolocation service (single watch / IndexedDB persistence — no direct `navigator.geolocation` here).
   * 1) `capturePatrolLocationSnapshot` — one-shot fix + `saveLocationLog` (PWA layer).
   * 2) `startPatrolTracking` — continuous watch with the same persistence path.
   */
  /** @param {string} patrolSessionId `patrol_sessions.id` — persisted as `patrolId` for PWA location logs */
  const startGeolocationTracking = async (patrolSessionId, guardUserId) => {
    const patrolId = patrolSessionId;
    const userId = guardUserId;

    if (!patrolId || userId == null || userId === '') {
      console.error('Cannot start patrol tracking without patrol session id and guard id');
      return;
    }

    try {
      const { position: firstPosition } = await capturePatrolLocationSnapshot({
        patrolId,
        userId,
        source: LOCATION_SOURCE.LIVE
      });

      handlePositionUpdate(firstPosition);
      checkNearbyCheckpoints(firstPosition);

      await recordPatrolRoute(firstPosition);

      await startPatrolTracking({
        patrolId,
        userId,
        skipInitialPersistAndFetch: true,
        onPosition: (position) => {
          handlePositionUpdate(position);
          checkNearbyCheckpoints(position);
          recordPatrolRoute(position);
        },
        onError: handleGeolocationError
      });
    } catch (error) {
      handleGeolocationError(error);
    }
  };

  /**
   * Handles successful position updates
   * @param {GeolocationPosition} position - Current GPS position
   */
  const handlePositionUpdate = (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp;

    // Format position for display
    const dateObj = new Date(timestamp);
    const displayText = `${dateObj.toLocaleString()}\nLat: ${latitude.toFixed(6)}\nLong: ${longitude.toFixed(6)}\nAcc: ${accuracy ? accuracy.toFixed(2) + 'm' : 'N/A'}`;

    setLocationDisplay(displayText);
  };

  /**
   * Records a patrol route point when position updates
   * Filters out points that are too close to previous points
   * @param {GeolocationPosition} position - Current GPS position
   */
  const recordPatrolRoute = async (position) => {
    const { latitude, longitude, altitude, accuracy } = position.coords;
    const timestamp = position.timestamp;

    const patrolSessionId = activePatrolSessionIdRef.current ?? patrols?.data?.id;
    if (!patrolSessionId) {
      return;
    }

    const lastPosted = lastPostedRouteCoordsRef.current;
    let shouldRecord = true;
    let spacingM = 0;

    if (lastPosted) {
      spacingM = haversineDistanceMeters(latitude, longitude, lastPosted.latitude, lastPosted.longitude);
      shouldRecord = Number.isFinite(spacingM) ? spacingM >= MIN_ROUTE_DISTANCE : true;
    }

    if (!shouldRecord) {
      return;
    }

    try {
      const routeData = {
        patrol_session_id: patrolSessionId,
        patrol_log_id: patrolSessionId,
        guard_id: formData.guard_id || currentUser?.id,
        latitude,
        longitude,
        altitude: altitude || null,
        accuracy: Number.isFinite(accuracy) ? accuracy : null,
        timestamp
      };

      const response = await repository.createPatrolRoute(routeData);

      if (response.success) {
        lastPostedRouteCoordsRef.current = { latitude, longitude };

        const newRoutePoint = {
          ...response.data,
          timestamp: new Date(timestamp).toISOString(),
          accuracy
        };

        setPatrolRoutes((prev) => [...prev, newRoutePoint]);
      }
    } catch (error) {
      console.error('Failed to record patrol route:', error);
      // Don't throw error - we don't want to break the patrol if route recording fails
    }
  };

  /**
   * Handles geolocation errors from patrol geolocationService (normalized `{ code, message }` or browser `PositionError`).
   */
  const handleGeolocationError = (error) => {
    const code = error?.code ?? 'unknown';
    const message = error?.message ?? String(error);
    console.error(`Geolocation error (${code}): ${message}`, error);
  };

  /**
   * Stops patrol GPS watch via patrol geolocationService (singleton — single source of truth for the watch).
   * @param {{ resetCheckpointUi?: boolean }} [options] — defer `cpNumber` reset during stop-patrol finalization UX
   */
  const stopGeolocationTracking = ({ resetCheckpointUi = true } = {}) => {
    stopPatrolTracking();
    activePatrolSessionIdRef.current = null;
    activeGuardUserIdRef.current = null;
    lastPostedRouteCoordsRef.current = null;
    lastResumeCaptureAtRef.current = 0;
    if (resetCheckpointUi) {
      setCpNumber(0);
    }
  };

  // ============== GEOFENCE & DISTANCE CALCULATIONS ==============

  /**
   * Checks if current position is near any unvisited checkpoints
   * Updates checkpoint logs when guard enters geofence
   * @param {GeolocationPosition} position - Current GPS position
   * @param {{ detectionContext?: 'continuous' | 'resume' }} [options]
   */
  const checkNearbyCheckpoints = (position, options = {}) => {
    const detectionContext = options.detectionContext ?? 'continuous';
    const { latitude, longitude, accuracy } = position.coords;

    // Store position for other components
    setCurrentPosition(position);

    // Get latest values from refs
    const currentCheckpoints = checkpointsRef.current;
    const currentCheckpointLogs = checkpointLogsRef.current;

    // Validate prerequisites using ref values
    if (!currentCheckpoints || currentCheckpoints.length === 0) {
      return;
    }

    if (!currentCheckpointLogs || currentCheckpointLogs.length === 0) {
      return;
    }

    // Check each checkpoint using ref values
    currentCheckpoints.forEach(async (checkpoint) => {
      try {
        const checkpointLat = parseFloat(checkpoint.latitude);
        const checkpointLon = parseFloat(checkpoint.longitude);

        if (!checkpointLat || !checkpointLon) {
          console.warn(`Checkpoint "${checkpoint.name}" has invalid coordinates`);
          return;
        }

        const distance = calculateDistance(latitude, longitude, checkpointLat, checkpointLon);
        const isWithinGeofence = distance <= DEFAULT_GEOFENCE_RADIUS + (accuracy || ACCURACY_BUFFER);

        if (isWithinGeofence) {
          // Find log using ref value
          const logIndex = currentCheckpointLogs.findIndex((log) => log.checkpoint_id === checkpoint.id);

          const log = logIndex !== -1 ? currentCheckpointLogs[logIndex] : null;
          const alreadyVerified = log?.is_within_geofence === true || log?.status === 'verified';
          if (logIndex !== -1 && !alreadyVerified) {
            await markCheckpointAsReached(checkpoint, position, logIndex, { detectionContext });
          }
        }
      } catch (error) {
        console.error(`Error checking checkpoint "${checkpoint.name}":`, error);
      }
    });
  };

  checkNearbyCheckpointsRef.current = checkNearbyCheckpoints;
  recordPatrolRouteRef.current = recordPatrolRoute;

  /**
   * Marks a checkpoint as reached and updates records
   * @param {Object} checkpoint - Checkpoint object
   * @param {GeolocationPosition} position - Current GPS position
   * @param {number} logIndex - Index of the log in checkpointLogsRef
   * @param {{ detectionContext?: 'continuous' | 'resume' }} [options]
   */
  const markCheckpointAsReached = async (checkpoint, position, logIndex, options = {}) => {
    const detectionContext = options.detectionContext ?? 'continuous';
    const { latitude, longitude, accuracy } = position.coords;
    const currentCheckpointLogs = checkpointLogsRef.current;

    // Check if logIndex is valid
    if (logIndex === -1 || logIndex >= currentCheckpointLogs.length) {
      console.warn(`Invalid logIndex ${logIndex} for checkpoint "${checkpoint.name}"`);
      return;
    }

    const log = currentCheckpointLogs[logIndex];

    // Skip if already marked as reached (local or server-verified)
    if (log.is_within_geofence || log.status === 'verified') {
      return;
    }

    // Prepare updated log
    const updatedLog = {
      ...log,
      latitude,
      longitude,
      accuracy_meters: accuracy,
      is_within_geofence: true,
      actual_time: new Date().toISOString()
    };

    // Create updated logs array for progress calculation
    const updatedLogs = [...currentCheckpointLogs];
    updatedLogs[logIndex] = updatedLog;

    // Calculate new progress based on updated logs
    const newCompletedCount = updatedLogs.filter((cp) => cp.is_within_geofence).length;
    const newTotalCount = updatedLogs.length;
    const newProgress = newTotalCount > 0 ? (newCompletedCount / newTotalCount) * 100 : 0;

    // Determine if patrol is completed (all checkpoints visited)
    const isPatrolCompleted = newProgress === 100;

    // Update local state
    setCheckpointLogs(updatedLogs);

    // Also update the ref
    checkpointLogsRef.current = updatedLogs;

    // Update backend - checkpoint log first
    try {
      const patchPayload = {
        latitude,
        longitude,
        accuracy_meters: accuracy,
        is_within_geofence: true,
        actual_time: updatedLog.actual_time
      };

      if (detectionContext === 'resume') {
        const poorAccuracy = !Number.isFinite(accuracy) || accuracy > DEFAULT_GEOFENCE_RADIUS;
        patchPayload.status = poorAccuracy ? 'uncertain' : 'verified';
        patchPayload.detection_type = 'resume';
        patchPayload.confidence_score = 65;
      }

      await repository.updateCheckpointLog(updatedLog.id, patchPayload);

      // Prepare patrol update data
      const patrolUpdateData = {
        completion_percentage: newProgress
      };

      // Only set status to 'completed' if all checkpoints are done
      if (isPatrolCompleted) {
        patrolUpdateData.status = 'completed';
        patrolUpdateData.time_end = new Date().toISOString(); // Set actual end time
      }

      // Update patrol
      if (patrols?.data?.id) {
        await repository.updatePatrol(patrols.data.id, patrolUpdateData);
      }
    } catch (error) {
      console.error(`Failed to update checkpoint "${checkpoint.name}":`, error);
    }
  };

  /**
   * PWA resume: one-shot GPS when the tab regains visibility or window focus (does not start/stop the watch).
   */
  const handlePatrolResume = useCallback(async () => {
    const patrolSessionId = activePatrolSessionIdRef.current;
    if (!patrolSessionId) {
      return;
    }

    const now = Date.now();
    if (now - lastResumeCaptureAtRef.current < RESUME_CAPTURE_COOLDOWN_MS) {
      return;
    }
    lastResumeCaptureAtRef.current = now;

    const userId = activeGuardUserIdRef.current ?? formData.guard_id ?? currentUser?.id;
    if (userId == null || userId === '') {
      return;
    }

    try {
      const { position } = await capturePatrolLocationSnapshot({
        patrolId: patrolSessionId,
        userId,
        source: LOCATION_SOURCE.RESUME
      });

      handlePositionUpdate(position);
      checkNearbyCheckpointsRef.current(position, { detectionContext: 'resume' });
      await recordPatrolRouteRef.current(position);
    } catch (error) {
      handleGeolocationError(error);
    }
  }, [formData.guard_id, currentUser?.id]);

  /**
   * Re-check checkpoints after app resume (background tab / screen off gap).
   */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handlePatrolResume();
      }
    };

    const onWindowFocus = () => {
      handlePatrolResume();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [handlePatrolResume]);

  /**
   * Updates a specific checkpoint log
   * @param {string} checkpointId - ID of the checkpoint
   * @param {Object} updates - Fields to update
   */
  const updateCheckpointLog = async (checkpointId, updates) => {
    try {
      const logIndex = checkpointLogs.findIndex((log) => log.checkpoint_id === checkpointId);

      if (logIndex !== -1) {
        const log = checkpointLogs[logIndex];

        // Update backend
        await repository.updateCheckpointLog(log.id, updates);

        // Update local state
        const updatedLog = { ...log, ...updates };
        const updatedLogs = [...checkpointLogs];
        updatedLogs[logIndex] = updatedLog;
        setCheckpointLogs(updatedLogs);

        return updatedLog;
      }
    } catch (error) {
      console.error('Error updating checkpoint log:', error);
      throw error;
    }
  };

  const extractApiErrorMessage = useCallback((error) => {
    const data = error?.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (data?.message) {
      return data.message;
    }
    if (data?.data?.message) {
      return data.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }, []);

  const inspectSyncQueue = useCallback(async () => {
    const [pendingCount, failedRows] = await Promise.all([
      db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_PENDING).count(),
      db.sync_queue.where('status').equals(SYNC_QUEUE_STATUS_FAILED).toArray()
    ]);

    const validationFailedCount = failedRows.filter(
      (row) => row.resultStatus === SYNC_RESULT_STATUS_VALIDATION_FAILED
    ).length;
    const conflictCount = failedRows.filter((row) => row.resultStatus === SYNC_RESULT_STATUS_CONFLICT).length;
    const exhaustedCount = failedRows.filter((row) => row.resultStatus === SYNC_RESULT_STATUS_EXHAUSTED).length;

    return {
      pendingCount,
      failedCount: failedRows.length,
      validationFailedCount,
      conflictCount,
      exhaustedCount,
      hasProblems: pendingCount > 0 || failedRows.length > 0
    };
  }, []);

  const fetchPatrolSummary = useCallback(
    async (patrolSessionId) => {
      if (!patrolSessionId) {
        return;
      }

      setPatrolSummaryLoading(true);
      setPatrolSummaryError(null);

      try {
        const envelope = await repository.getPatrolSummary(patrolSessionId);
        if (envelope?.success === false) {
          throw new Error(envelope?.message || 'Failed to load patrol summary');
        }
        setPatrolSummary(envelope?.data ?? null);
      } catch (error) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Failed to load patrol summary';
        setPatrolSummary(null);
        setPatrolSummaryError(message);
        console.error('Failed to fetch patrol summary:', error);
      } finally {
        setPatrolSummaryLoading(false);
      }
    },
    [repository]
  );

  /**
   * Stop patrol: GPS off → session update → PWA sync → backend validate → summary.
   */
  const completePatrol = async () => {
    if (validatingPatrol || finalizingStep !== FINALIZING_STEP.IDLE) {
      return;
    }

    const patrolSessionId = patrols?.data?.id ?? activePatrolSessionIdRef.current;
    if (!patrolSessionId) {
      console.error('No active patrol to complete');
      alert('No active patrol found');
      return;
    }

    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

    try {
      setPatrolLoading(true);
      setValidationError(null);
      setValidationResult(null);
      setValidationWarning(null);
      setPatrolSummaryError(null);

      stopGeolocationTracking({ resetCheckpointUi: false });

      await repository.updatePatrol(patrolSessionId, {
        status: 'completed',
        time_end: new Date().toISOString(),
        completion_percentage: progress
      });

      setFinalizingStep(FINALIZING_STEP.SYNCING);

      let mayBeIncomplete = !isOnline;

      if (isOnline) {
        try {
          await flushSyncQueue();
        } catch (syncError) {
          console.warn('[patrol] flushSyncQueue before validation failed', syncError);
          mayBeIncomplete = true;
          setValidationWarning((prev) =>
            prev ?? 'Sync flush failed. Backend validation may be incomplete.'
          );
        }

        const queueState = await inspectSyncQueue();
        if (queueState.hasProblems) {
          mayBeIncomplete = true;
          setValidationWarning((prev) =>
            prev ?? 'Some logs could not be synced. Backend validation may be incomplete.'
          );
        }
      } else {
        setValidationWarning('Patrol saved locally. Validation will be available after sync.');
      }

      setSummaryMayBeIncomplete(mayBeIncomplete);

      if (isOnline) {
        setFinalizingStep(FINALIZING_STEP.VALIDATING);
        setValidatingPatrol(true);
        try {
          const envelope = await repository.validatePatrolSession(patrolSessionId);
          if (envelope?.success === false) {
            throw new Error(envelope?.message || 'Patrol validation failed');
          }
          setValidationResult(envelope?.data ?? null);
        } catch (validationErr) {
          const message = extractApiErrorMessage(validationErr);
          setValidationError(message);
          setValidationWarning(
            (prev) =>
              prev ??
              'Validation failed. Summary may reflect provisional checkpoint data only.'
          );
          console.error('[patrol] backend validation failed', validationErr);
        } finally {
          setValidatingPatrol(false);
        }
      }

      setFinalizingStep(FINALIZING_STEP.LOADING_SUMMARY);
      await fetchPatrolSummary(patrolSessionId);

      setFinalizingStep(FINALIZING_STEP.COMPLETED);
      alert('Patrol completed successfully!');
    } catch (error) {
      console.error('Failed to complete patrol:', error);
      setFinalizingStep(FINALIZING_STEP.FAILED);
      alert(extractApiErrorMessage(error) || 'Failed to complete patrol');
    } finally {
      setPatrolLoading(false);
      setValidatingPatrol(false);
      setCpNumber(0);
    }
  };

  // ============== PROGRESS CALCULATION ==============

  /** Safely get checkpoint logs as array */
  const checkpointLogsArray = Array.isArray(checkpointLogs) ? checkpointLogs : [];

  /** Count of completed checkpoints (within geofence) */
  const completedCount = checkpointLogsArray.filter((cp) => cp.is_within_geofence).length;

  /** Total number of checkpoints */
  const totalCount = checkpointLogsArray.length;

  /** Progress percentage (0-100) */
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ============== EXPOSED API ==============

  return {
    // State
    locationDisplay,
    formData,
    errors,
    loading,
    zoneOptions,
    checkpoints,
    patrolLoading,
    cpNumber,
    progress,
    completedCount,
    totalCount,
    checkpointLogs,
    patrolRoutes, // NEW: Expose patrol routes
    currentPosition,
    distanceCalc,
    patrols,
    patrolSummary,
    patrolSummaryLoading,
    patrolSummaryError,
    summaryMayBeIncomplete,
    validatingPatrol,
    validationError,
    validationResult,
    validationWarning,
    finalizingStep,
    isFinalizingPatrol:
      validatingPatrol ||
      (finalizingStep !== FINALIZING_STEP.IDLE && finalizingStep !== FINALIZING_STEP.COMPLETED),

    // Form handlers
    handleChange,

    // Navigation
    handleAddPatrol,
    handleViewPatrol,
    handleEditPatrol,

    // Patrol operations
    handleStartPatrol,
    completePatrol,
    updateCheckpointLog,

    // Geolocation control
    stopGeolocationTracking,

    // Validation
    validate
  };
};
