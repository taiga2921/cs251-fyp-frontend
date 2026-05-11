import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LOCATION_SOURCE } from 'pwa/locationLogService';
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

  const [patrols, setPatrols] = useState([]);

  // ============== CONSTANTS ==============

  /** Default geofence radius in meters */
  const DEFAULT_GEOFENCE_RADIUS = 20;

  /** Accuracy buffer to account for GPS inaccuracies */
  const ACCURACY_BUFFER = 10;

  /** Minimum distance between route points (in meters) to avoid too many points */
  const MIN_ROUTE_DISTANCE = 5;

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

  /**
   * Debug effect: Log when all prerequisites for checkpoint checking are met
   */
  useEffect(() => {
    if (currentPosition && checkpoints.length > 0 && checkpointLogs.length > 0) {
      console.log('All systems ready: Checking checkpoints with new position');
    }
  }, [currentPosition, checkpoints, checkpointLogs]);

  // Update refs when state changes
  useEffect(() => {
    checkpointsRef.current = checkpoints;
    console.log('checkpointsRef updated:', checkpoints.length);
  }, [checkpoints]);

  useEffect(() => {
    checkpointLogsRef.current = checkpointLogs;
    console.log('checkpointLogsRef updated:', checkpointLogs.length);
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
      console.log('1. New patrol session created:', newPatrol);
      activePatrolSessionIdRef.current = newPatrol?.data?.id ?? null;
      setPatrols(newPatrol);

      // 2. Fetch checkpoints for the selected zone (repository + patrolService return a plain array)
      const checkpointList = await repository.getAllCheckpointsByZoneId(formData.zone_id);
      setCheckpoints(checkpointList);
      console.log('2. Checkpoints retrieved:', checkpointList.length, 'items');

      alert(`Patrol started successfully! Found ${checkpointList.length} checkpoints.`);

      // 3. Create initial checkpoint logs (unvisited state)
      const simplifiedCheckpoints = checkpointList.map((checkpoint) => ({
        patrol_session_id: newPatrol.data.id,
        checkpoint_id: checkpoint.id
      }));

      const cpLogs = await repository.createBatchCheckpointLogs(simplifiedCheckpoints);
      console.log('3. Checkpoint logs created:', cpLogs);

      // Extract actual log data from API responses
      const logsData = cpLogs.map((response) => response.data);
      setCheckpointLogs(logsData);
      console.log('4. Checkpoint logs initialized:', logsData);

      // Initialize empty patrol routes array
      setPatrolRoutes([]);

      // 4. Update UI state and start tracking
      setCpNumber(checkpointList.length);

      const patrolSessionId = newPatrol.data.id;
      const guardUserId = newPatrol.data.guard_id ?? formData.guard_id ?? currentUser?.id;
      await startGeolocationTracking(patrolSessionId, guardUserId);

      // Debug logging
      console.log('First checkpoint log structure:', JSON.stringify(logsData[0], null, 2));
      if (checkpointList.length > 0) {
        console.log('Checkpoint data:', JSON.stringify(checkpointList[0], null, 2));
      }
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
      console.log('[patrol-debug] before capturePatrolLocationSnapshot', { patrolId, userId });
      const { position: firstPosition, record: firstSavedRecord } = await capturePatrolLocationSnapshot({
        patrolId,
        userId,
        source: LOCATION_SOURCE.LIVE
      });
      console.log('[patrol-debug] after capturePatrolLocationSnapshot success', {
        lat: firstPosition.coords.latitude,
        lng: firstPosition.coords.longitude,
        savedRecord: firstSavedRecord
      });

      handlePositionUpdate(firstPosition);
      checkNearbyCheckpoints(firstPosition);

      console.log('[patrol-debug] before recordPatrolRoute (first snapshot)');
      await recordPatrolRoute(firstPosition);

      console.log('[patrol-debug] before startPatrolTracking (watch)');
      await startPatrolTracking({
        patrolId,
        userId,
        skipInitialPersistAndFetch: true,
        onLocationSaved: (record) => {
          console.log('[patrol-debug] onLocationSaved (watch)', record);
        },
        onPosition: (position) => {
          handlePositionUpdate(position);
          checkNearbyCheckpoints(position);
          recordPatrolRoute(position);
        },
        onError: handleGeolocationError
      });

      console.log('[patrol-debug] after startPatrolTracking — watch active');
      console.log('Patrol geolocation tracking started (patrol/services/geolocationService)');
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
    console.log(`Position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}, Accuracy: ${accuracy}m`);
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
      console.log('[patrol-debug] recordPatrolRoute: no patrol session id (ref/state), skipping POST /patrol-routes');
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
      console.log(`[patrol-debug] Skipping route point — spacing ${spacingM.toFixed(2)}m < ${MIN_ROUTE_DISTANCE}m`);
      return;
    }

    console.log('[patrol-debug] recordPatrolRoute: before createPatrolRoute API', {
      patrolSessionId,
      lat: latitude,
      lng: longitude,
      firstSampleOfSession: !lastPosted
    });

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
      console.log('[patrol-debug] createPatrolRoute response:', response);

      if (response.success) {
        lastPostedRouteCoordsRef.current = { latitude, longitude };

        const newRoutePoint = {
          ...response.data,
          timestamp: new Date(timestamp).toISOString(),
          accuracy
        };

        setPatrolRoutes((prev) => {
          const next = [...prev, newRoutePoint];
          console.log('[patrol-debug] Route point stored in state after POST', { count: next.length });
          console.log(`📍 Route point recorded: #${next.length}`);
          return next;
        });
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
    console.error('[patrol-debug] geolocation error handler:', { code, message, error });
    console.error(`Geolocation error (${code}): ${message}`);
  };

  /**
   * Stops patrol GPS watch via patrol geolocationService (singleton — single source of truth for the watch).
   */
  const stopGeolocationTracking = () => {
    stopPatrolTracking();
    activePatrolSessionIdRef.current = null;
    lastPostedRouteCoordsRef.current = null;
    console.log('Patrol geolocation tracking stopped');
    setCpNumber(0);
  };

  // ============== GEOFENCE & DISTANCE CALCULATIONS ==============

  /**
   * Checks if current position is near any unvisited checkpoints
   * Updates checkpoint logs when guard enters geofence
   * @param {GeolocationPosition} position - Current GPS position
   */
  const checkNearbyCheckpoints = (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    // Store position for other components
    setCurrentPosition(position);

    // Get latest values from refs
    const currentCheckpoints = checkpointsRef.current;
    const currentCheckpointLogs = checkpointLogsRef.current;

    console.log('=== Checking checkpoints ===');
    console.log('Checkpoints available:', currentCheckpoints?.length || 0);
    console.log('Checkpoint logs available:', currentCheckpointLogs?.length || 0);
    console.log('Current position:', { lat: latitude, lng: longitude });

    // Validate prerequisites using ref values
    if (!currentCheckpoints || currentCheckpoints.length === 0) {
      console.log('No checkpoints available for checking');
      return;
    }

    if (!currentCheckpointLogs || currentCheckpointLogs.length === 0) {
      console.log('No checkpoint logs available yet');
      return;
    }

    console.log(`Checking ${currentCheckpoints.length} checkpoints...`);

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

        console.log(`Checkpoint "${checkpoint.name}": ${distance.toFixed(2)}m away`);

        if (isWithinGeofence) {
          // Find log using ref value
          const logIndex = currentCheckpointLogs.findIndex((log) => log.checkpoint_id === checkpoint.id);

          console.log(`Found logIndex ${logIndex} for checkpoint "${checkpoint.name}"`);

          if (logIndex !== -1 && !currentCheckpointLogs[logIndex].is_within_geofence) {
            await markCheckpointAsReached(checkpoint, position, logIndex);
          }
        }
      } catch (error) {
        console.error(`Error checking checkpoint "${checkpoint.name}":`, error);
      }
    });
  };

  /**
   * Marks a checkpoint as reached and updates records
   * @param {Object} checkpoint - Checkpoint object
   * @param {GeolocationPosition} position - Current GPS position
   * @param {number} logIndex - Index of the log in checkpointLogsRef
   */
  const markCheckpointAsReached = async (checkpoint, position, logIndex) => {
    const { latitude, longitude, accuracy } = position.coords;
    const currentCheckpointLogs = checkpointLogsRef.current;

    console.log('markCheckpointAsReached called for:', checkpoint.name, 'logIndex:', logIndex);

    // Check if logIndex is valid
    if (logIndex === -1 || logIndex >= currentCheckpointLogs.length) {
      console.warn(`Invalid logIndex ${logIndex} for checkpoint "${checkpoint.name}"`);
      return;
    }

    const log = currentCheckpointLogs[logIndex];

    // Skip if already marked as reached
    if (log.is_within_geofence) {
      console.log(`Checkpoint "${checkpoint.name}" already marked as reached`);
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

    console.log(`Progress update: ${newCompletedCount}/${newTotalCount} = ${newProgress}%`);

    // Determine if patrol is completed (all checkpoints visited)
    const isPatrolCompleted = newProgress === 100;

    // Update local state
    setCheckpointLogs(updatedLogs);

    // Also update the ref
    checkpointLogsRef.current = updatedLogs;

    // Update backend - checkpoint log first
    try {
      await repository.updateCheckpointLog(updatedLog.id, {
        latitude,
        longitude,
        accuracy_meters: accuracy,
        is_within_geofence: true,
        actual_time: updatedLog.actual_time
      });
      console.log(`✅ Checkpoint "${checkpoint.name}" marked as reached`);

      // Prepare patrol update data
      const patrolUpdateData = {
        completion_percentage: newProgress
      };

      // Only set status to 'completed' if all checkpoints are done
      if (isPatrolCompleted) {
        patrolUpdateData.status = 'completed';
        patrolUpdateData.time_end = new Date().toISOString(); // Set actual end time
        console.log('🎉 Patrol completed! All checkpoints visited.');
      }

      // Update patrol
      if (patrols?.data?.id) {
        await repository.updatePatrol(patrols.data.id, patrolUpdateData);
        console.log(`📊 Patrol updated: ${newProgress}% complete${isPatrolCompleted ? ' (COMPLETED)' : ''}`);
      }
    } catch (error) {
      console.error(`Failed to update checkpoint "${checkpoint.name}":`, error);
    }
  };

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

  /**
   * Manually complete the patrol
   */
  const completePatrol = async () => {
    if (!patrols?.data?.id) {
      console.error('No active patrol to complete');
      alert('No active patrol found');
      return;
    }

    try {
      await repository.updatePatrol(patrols.data.id, {
        status: 'completed',
        time_end: new Date().toISOString(),
        completion_percentage: progress
      });

      // Stop geolocation tracking
      stopGeolocationTracking();

      alert('Patrol completed successfully!');
      console.log('Patrol marked as completed manually');
    } catch (error) {
      console.error('Failed to complete patrol:', error);
      alert('Failed to complete patrol');
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
