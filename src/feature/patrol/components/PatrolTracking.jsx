import React, { useState, useEffect } from 'react';
import {
   Box,
   CircularProgress,
   LinearProgress,
   Paper,
   Typography,
   List,
   ListItem,
   ListItemIcon,
   ListItemText,
   Chip,
   IconButton
} from '@mui/material';
import { IconMapPin, IconCheck, IconCurrentLocation, IconAlertCircle } from '@tabler/icons-react';
import { geolocationService } from '../services/geolocationService';

export const PatrolTracking = ({ patrolLog, checkpointLogs, onUpdate, onComplete }) => {
   const [currentLocation, setCurrentLocation] = useState(null);
   const [trackingActive, setTrackingActive] = useState(false);
   const [loading, setLoading] = useState(false);

   // Initialize geolocation service
   useEffect(() => {
      if (patrolLog && patrolLog.status === 'in_progress') {
         startTracking();
      }

      return () => {
         geolocationService.stopWatching();
      };
   }, [patrolLog]);

   const startTracking = async () => {
      try {
         // Request permission and get initial position
         const position = await geolocationService.getCurrentPosition();
         setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
         });

         // Set checkpoints to monitor
         const checkpoints = checkpointLogs.map((log) => ({
            ...log,
            latitude: log.checkpoint?.latitude,
            longitude: log.checkpoint?.longitude
         }));

         geolocationService.setCheckpoints(checkpoints);

         // Set callback for when checkpoint is reached
         geolocationService.setCheckpointCallback(async (checkpoint) => {
            await handleCheckpointReached(checkpoint);
         });

         // Start continuous tracking
         geolocationService.startWatching(
            (position) => {
               setCurrentLocation({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy
               });
            },
            (error) => {
               console.error('Geolocation error:', error);
            }
         );

         setTrackingActive(true);
      } catch (error) {
         console.error('Failed to start tracking:', error);
      }
   };

   const handleCheckpointReached = async (checkpoint) => {
      setLoading(true);
      try {
         // Update checkpoint log in backend
         await onUpdate(checkpoint.id, {
            is_within_geofence: true,
            actual_time: new Date().toISOString(),
            latitude: currentLocation?.lat,
            longitude: currentLocation?.lng,
            accuracy_meters: currentLocation?.accuracy
         });

         // Update completion percentage
         const updated = await onUpdateCompletion(patrolLog.id);

         // If completed, trigger callback
         if (updated.status === 'completed' && onComplete) {
            onComplete(patrolLog.id);
         }
      } catch (error) {
         console.error('Failed to update checkpoint:', error);
      } finally {
         setLoading(false);
      }
   };

   const completedCount = checkpointLogs.filter((cp) => cp.is_within_geofence).length;
   const totalCount = checkpointLogs.length;
   const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
               label={trackingActive ? 'Tracking Active' : 'Tracking Inactive'}
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
            {checkpointLogs.map((checkpointLog) => (
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
                        checkpointLog.is_within_geofence
                           ? `Completed at ${new Date(checkpointLog.actual_time).toLocaleTimeString()}`
                           : 'Pending'
                     }
                  />
                  {currentLocation && !checkpointLog.is_within_geofence && (
                     <Chip
                        size="small"
                        label={`${Math.round(
                           geolocationService.calculateDistance(
                              currentLocation.lat,
                              currentLocation.lng,
                              checkpointLog.checkpoint?.latitude,
                              checkpointLog.checkpoint?.longitude
                           )
                        )}m`}
                        variant="outlined"
                     />
                  )}
               </ListItem>
            ))}
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
