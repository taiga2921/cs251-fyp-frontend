import { useMemo, useRef } from 'react';
import { Box, CircularProgress, Paper, Button } from '@mui/material';

import { PatrolRepository } from '../repositories/patrolRepository';
import { usePatrolController } from '../controllers/usePatrolController';
import patrolService from '../datasources/patrolService';
import { PatrolTracking } from '../components/PatrolTracking';
import PatrolPwaStatusPanel from '../components/PatrolPwaStatusPanel';

import { SelectFieldContainer } from 'ui-component/SelectFieldContainer';
import { IconPlayerPlay } from '@tabler/icons-react';

// import { PatrolTable, PatrolTableToolbar } from '../components';

/**
 * Main view component for patrol list.
 * Orchestrates the integration of toolbar, table, and pagination components.
 * Handles dependency injection and loading states.
 */

export default function PatrolHome() {
  // Stable repository instance — `new` each render would change `useCallback` deps and re-fetch zones forever.
  const repositoryRef = useRef(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new PatrolRepository(patrolService);
  }
  const controller = usePatrolController(repositoryRef.current);

  const patrolCurrentLocation = useMemo(() => {
    const pos = controller.currentPosition;
    if (!pos?.coords) return null;
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy
    };
  }, [controller.currentPosition]);

  const patrolTrackingActive = Boolean(patrolCurrentLocation) && controller.cpNumber > 0;
  const patrolId = controller.patrols?.data?.id ?? null;

  return (
    <>
      <Box>
        <Paper
          sx={{
            height: '100%',
            // display: 'flex',
            p: 1.5,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <SelectFieldContainer
            label="Zone"
            name="zone"
            value={controller.formData.zone_id}
            onChange={controller.handleChange('zone_id')}
            error={!!controller.errors.zone_id}
            helperText={controller.errors.zone_id}
            options={controller.zoneOptions}
            placeholder="Select a zone"
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={controller.handleStartPatrol}
              disabled={controller.patrolLoading || !controller.formData.zone_id}
              startIcon={controller.patrolLoading ? <CircularProgress size={18} /> : <IconPlayerPlay size={18} />}
            >
              {controller.patrolLoading ? 'Starting...' : 'Start Patrol'}
            </Button>
          </Box>
          {/* <Box sx={{ mt: 2 }}>{controller.locationDisplay}</Box> */}
        </Paper>

        <PatrolPwaStatusPanel patrolId={patrolId} trackingActive={patrolTrackingActive} />

        <Box hidden={controller.cpNumber === 0}>
          <PatrolTracking
            checkpointLogs={controller.checkpointLogs}
            progress={controller.progress}
            completedCount={controller.completedCount}
            totalCount={controller.totalCount}
            currentLocation={patrolCurrentLocation}
            trackingActive={patrolTrackingActive}
          />
          <Box sx={{ mt: 2 }}>{controller.distanceCalc}</Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="secondary" onClick={controller.completePatrol}>
              Stop Patrol
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
