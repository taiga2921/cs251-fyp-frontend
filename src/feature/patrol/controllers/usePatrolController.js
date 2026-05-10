import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthController } from '../../authentication/controllers/useAuthController';

/**
 * Custom hook for managing patrol operations including:
 * - Patrol creation and management
 * - Real-time geolocation tracking
 * - Checkpoint geofence detection
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

  /** Geolocation tracking */
  const [watchId, setWatchId] = useState(null); // Geolocation watch ID for cleanup
  const [currentPosition, setCurrentPosition] = useState(null); // Latest GPS position
  const [locationDisplay, setLocationDisplay] = useState(''); // Formatted location string for UI

  const [distanceCalc, setDistanceCalc] = useState();
  const checkpointsRef = useRef([]);
  const checkpointLogsRef = useRef([]);

  const [patrols, setPatrols] = useState([]);

  // ============== CONSTANTS ==============

  /** Default geofence radius in meters */
  const DEFAULT_GEOFENCE_RADIUS = 20;

  /** Accuracy buffer to account for GPS inaccuracies */
  const ACCURACY_BUFFER = 10;

  /** Minimum distance between route points (in meters) to avoid too many points */
  const MIN_ROUTE_DISTANCE = 5;

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
  }, []);

  /**
   * Cleanup geolocation watch on component unmount
   */
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

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

  // ============== DATA LOADING ==============

  /**
   * Fetch all available zones from the repository
   * Transforms data for dropdown compatibility
   */
  const loadZones = async () => {
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
    } finally {
      setLoading(false);
    }
  };

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
   * 1. Creates patrol log
   * 2. Fetches checkpoints for selected zone
   * 3. Creates initial checkpoint logs
   * 4. Starts geolocation tracking
   */
  const handleStartPatrol = async () => {
    // Validate zone selection
    if (!formData.zone_id) {
      setErrors({ zone_id: 'Zone is required' });
      return;
    }

    try {
      setPatrolLoading(true);

      // 1. Create patrol log with current timestamp
      const now = new Date().toISOString();
      const patrolData = {
        guard_id: formData.guard_id,
        zone_id: formData.zone_id,
        time_start: now,
        time_end: now, // Will be updated when patrol completes
        status: 'in_progress',
        completion_percentage: 0
      };

      const newPatrol = await repository.createPatrol(patrolData);
      console.log('1. New patrol created:', newPatrol);
      setPatrols(newPatrol);

      // 2. Fetch checkpoints for the selected zone
      const checkpointList = await repository.getAllCheckpointsByZoneId(formData.zone_id);
      setCheckpoints(checkpointList);
      console.log('2. Checkpoints retrieved:', checkpointList);

      alert(`Patrol started successfully! Found ${checkpointList.length} checkpoints.`);

      // 3. Create initial checkpoint logs (unvisited state)
      const simplifiedCheckpoints = checkpointList.map((checkpoint) => ({
        guard_id: newPatrol.data.guard_id,
        checkpoint_id: checkpoint.id,
        patrol_log_id: newPatrol.data.id
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
      startGeolocationTracking();

      // Debug logging
      console.log('First checkpoint log structure:', JSON.stringify(logsData[0], null, 2));
      console.log('Checkpoint data:', JSON.stringify(checkpointList[0], null, 2));
    } catch (error) {
      console.error('Failed to start patrol:', error);
      alert('Failed to start patrol. Please try again.');
    } finally {
      setPatrolLoading(false);
    }
  };

  // ============== GEOLOCATION MANAGEMENT ==============

  /**
   * Starts continuous geolocation tracking
   * Uses high accuracy mode for better geofence detection
   */
  const startGeolocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 10000, // Maximum wait time for position
      maximumAge: 0 // Don't use cached positions
    };

    // Start watching position with combined callbacks
    const id = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position);
        checkNearbyCheckpoints(position);
        recordPatrolRoute(position); // NEW: Record route point
      },
      handleGeolocationError,
      options
    );

    setWatchId(id);
    console.log('Geolocation tracking started');
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

    // Check if we have an active patrol
    if (!patrols?.data?.id) {
      console.log('No active patrol, skipping route recording');
      return;
    }

    // Check if this is the first point or far enough from the last point
    const lastRoute = patrolRoutes[patrolRoutes.length - 1];
    let shouldRecord = true;

    if (lastRoute) {
      const distance = calculateDistance(latitude, longitude, lastRoute.latitude, lastRoute.longitude);
      shouldRecord = distance >= MIN_ROUTE_DISTANCE;
    }

    if (!shouldRecord) {
      console.log(`Skipping route point - too close (${distanceCalc?.toFixed(2)}m < ${MIN_ROUTE_DISTANCE}m)`);
      return;
    }

    try {
      // Prepare route data
      const routeData = {
        patrol_log_id: patrols.data.id,
        guard_id: formData.guard_id || currentUser?.id,
        latitude,
        longitude,
        altitude: altitude || null
      };

      console.log('Recording patrol route point:', routeData);

      // Send to backend
      const response = await repository.createPatrolRoute(routeData);

      if (response.success) {
        // Update local state
        const newRoutePoint = {
          ...response.data,
          timestamp: new Date(timestamp).toISOString(),
          accuracy
        };

        setPatrolRoutes((prev) => [...prev, newRoutePoint]);
        console.log(`📍 Route point recorded: #${patrolRoutes.length + 1}`);
      }
    } catch (error) {
      console.error('Failed to record patrol route:', error);
      // Don't throw error - we don't want to break the patrol if route recording fails
    }
  };

  /**
   * Handles geolocation errors
   * @param {GeolocationPositionError} error - Geolocation error object
   */
  const handleGeolocationError = (error) => {
    console.error(`Geolocation error (${error.code}): ${error.message}`);
  };

  /**
   * Stops geolocation tracking
   */
  const stopGeolocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      console.log('Geolocation tracking stopped');
    }
    setCpNumber(0);
  };

  // ============== GEOFENCE & DISTANCE CALCULATIONS ==============

  /**
   * Haversine formula to calculate distance between two coordinates
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in meters
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    lat1 = Number(lat1);
    lon1 = Number(lon1);
    lat2 = Number(lat2);
    lon2 = Number(lon2);

    if ([lat1, lon1, lat2, lon2].some(Number.isNaN)) return Infinity;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    setDistanceCalc(R * c);
    return R * c;
  };

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
        is_within_geofence: true
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

    // Geolocation control
    stopGeolocationTracking,

    // Validation
    validate
  };
};
