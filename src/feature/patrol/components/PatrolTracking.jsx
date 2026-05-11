import { Box, CircularProgress, LinearProgress, Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { IconMapPin, IconCheck, IconCurrentLocation } from '@tabler/icons-react';
import { calculateDistance } from '../services/geolocationService';

/**
 * Checkpoint list + live GPS readout (presentational).
 * GPS lifecycle belongs to `usePatrolController` via `feature/patrol/services/geolocationService` — this component must not start/stop watches or persist fixes.
 */
export const PatrolTracking = ({
  checkpointLogs = [],
  progress = 0,
  completedCount = 0,
  totalCount = 0,
  currentLocation = null,
  trackingActive = false
}) => {
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
          <CircularProgress variant="determinate" value={progress} size={60} thickness={4} />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="caption" component="div" color="text.secondary">
              {`${Math.round(progress)}%`}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="h6">Patrol in Progress</Typography>
          <Typography variant="body2" color="text.secondary">
            {completedCount} of {totalCount} checkpoints completed
          </Typography>
        </Box>
        <Chip
          label={trackingActive ? 'Tracking Active' : totalCount > 0 ? 'Acquiring location…' : 'Tracking Inactive'}
          color={trackingActive ? 'success' : 'default'}
          size="small"
          sx={{ ml: 'auto' }}
        />
      </Box>

      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3, height: 8, borderRadius: 4 }} />

      <Typography variant="subtitle2" gutterBottom>
        Checkpoints:
      </Typography>
      <List>
        {checkpointLogs.map((checkpointLog) => {
          const distM =
            currentLocation &&
            calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              checkpointLog.checkpoint?.latitude,
              checkpointLog.checkpoint?.longitude
            );
          const distLabel = Number.isFinite(distM) ? `${Math.round(distM)}m` : '—';

          return (
            <ListItem
              key={checkpointLog.id}
              sx={{
                bgcolor: checkpointLog.is_within_geofence ? 'action.selected' : 'transparent',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon>{checkpointLog.is_within_geofence ? <IconCheck color="green" /> : <IconMapPin />}</ListItemIcon>
              <ListItemText
                primary={checkpointLog.checkpoint?.name || `Checkpoint ${checkpointLog.id}`}
                secondary={
                  checkpointLog.is_within_geofence ? `Completed at ${new Date(checkpointLog.actual_time).toLocaleTimeString()}` : 'Pending'
                }
              />
              {currentLocation && !checkpointLog.is_within_geofence && <Chip size="small" label={distLabel} variant="outlined" />}
            </ListItem>
          );
        })}
      </List>

      {currentLocation && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <IconCurrentLocation size={16} style={{ marginRight: 8 }} />
            Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            <Typography component="span" variant="caption" sx={{ ml: 1 }}>
              (Accuracy: ±{Math.round(currentLocation.accuracy)}m)
            </Typography>
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
