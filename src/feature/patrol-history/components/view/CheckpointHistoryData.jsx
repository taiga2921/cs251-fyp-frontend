import React from 'react';
import { Box, Chip, Divider, Grid, Paper, Stack, styled, Typography, List, ListItem, ListItemText } from '@mui/material';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

const Item = styled(Box)(({ theme }) => ({
   ...theme.typography.body2,
   padding: theme.spacing(1),
   textAlign: 'center',
   color: theme.palette.text.secondary
}));

const Title = styled(Typography)(({ theme }) => ({
   fontWeight: 700,
   letterSpacing: 1.2,
   fontSize: '0.85rem',
   background: `linear-gradient(135deg, ${theme.palette.secondary.main} 100%, ${theme.palette.secondary.light} 100%)`,
   WebkitBackgroundClip: 'text',
   WebkitTextFillColor: 'transparent',
   backgroundClip: 'text',
   marginBottom: 20
}));

export function CheckpointHistoryData({ info, isMobile }) {
   const status = info.status;

   const statusConfig = {
      completed: { label: 'Completed', color: 'success' },
      in_progress: { label: 'In Progress', color: 'warning' },
      cancelled: { label: 'Cancelled', color: 'default' }
   };

   return (
      <>
         <Paper elevation={2} sx={{ p: 2 }}>
            <Title>Checkpoint Histroy Details</Title>

            <List>
               {info.map((log, index) => (
                  <React.Fragment key={log.id}>
                     <ListItem
                        sx={{
                           py: 1.5
                        }}
                     >
                        <ListItemText
                           primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                 <Typography variant="body1" sx={{ minWidth: 25, fontWeight: 'bold' }}>
                                    {index + 1}.
                                 </Typography>
                                 <Typography variant="body1" sx={{ flex: 1 }}>
                                    {log.checkpoint?.name || 'Unknown Checkpoint'}:
                                    <Typography
                                       component="span"
                                       sx={{
                                          ml: 1,
                                          color: 'text.secondary',
                                          fontWeight: 'medium'
                                       }}
                                    >
                                       {<MalaysiaTime time={log.actual_time} />}
                                    </Typography>
                                 </Typography>
                              </Box>
                           }
                           // secondary={
                           //    <Box sx={{ mt: 0.5, pl: 5 }}>
                           //       <Typography variant="caption" color="text.secondary">
                           //          {log.latitude && log.longitude
                           //             ? `Location: ${parseFloat(log.latitude).toFixed(6)}, ${parseFloat(log.longitude).toFixed(6)}`
                           //             : 'No location recorded'}
                           //       </Typography>
                           //       {log.accuracy_meters && (
                           //          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                           //             • Accuracy: {parseFloat(log.accuracy_meters).toFixed(1)}m
                           //          </Typography>
                           //       )}
                           //    </Box>
                           // }
                        />
                     </ListItem>
                     {index < info.length - 1 && <Divider />}
                  </React.Fragment>
               ))}
            </List>
         </Paper>
      </>
   );
}
