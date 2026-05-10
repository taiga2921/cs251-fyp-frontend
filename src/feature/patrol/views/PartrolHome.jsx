import {
   Box,
   CircularProgress,
   useTheme,
   useMediaQuery,
   Paper,
   FormControl,
   InputLabel,
   Select,
   MenuItem,
   Button,
   Typography,
   LinearProgress
} from '@mui/material';

import { PatrolRepository } from '../repositories/patrolRepository';
import { usePatrolController } from '../controllers/usePatrolController';
import patrolService from '../datasources/patrolService';

import { SelectFieldContainer } from 'ui-component/SelectFieldContainer';
import { IconMapRoute, IconPlayerPlay } from '@tabler/icons-react';

// import { PatrolTable, PatrolTableToolbar } from '../components';

/**
 * Main view component for patrol list.
 * Orchestrates the integration of toolbar, table, and pagination components.
 * Handles dependency injection and loading states.
 */

export default function PatrolHome() {
   // Initialize dependencies using dependency injection pattern
   const repository = new PatrolRepository(patrolService);
   const controller = usePatrolController(repository);

   // Responsive design hooks
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

            <Paper sx={{ p: 3, mt: 2 }} hidden={controller.cpNumber == 0}>
               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                     <CircularProgress variant="determinate" value={controller.progress} size={60} thickness={4} />
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
                           {`${Math.round(controller.progress)}%`}
                        </Typography>
                     </Box>
                  </Box>

                  <Box>
                     <Typography variant="h6">Patrol in Progress</Typography>
                     <Typography variant="body2" color="text.secondary">
                        {controller.completedCount} of {controller.cpNumber} checkpoints completed
                     </Typography>
                  </Box>
               </Box>

               <br />
               <Box sx={{ mt: 2 }}>{controller.locationDisplay}</Box>

               <br />
               <Box sx={{ mt: 2 }}>{controller.distanceCalc}</Box>

               <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                     variant="contained"
                     color="secondary"
                     onClick={controller.completePatrol}
                     // disabled={controller.patrolLoading || !controller.formData.zone_id}
                     // startIcon={controller.patrolLoading ? <CircularProgress size={18} /> : <IconPlayerPlay size={18} />}
                  >
                     Stop Patrol
                  </Button>
               </Box>
            </Paper>
         </Box>
      </>
   );
}
