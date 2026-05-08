import { Box, CircularProgress, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useParams } from 'react-router-dom';
import DetailCard from 'ui-component/cards/DetailCard';
import LeafletMap from '../components/LeafletMap';

import { CheckpointRepository } from '../repositories/checkpointRepository';
import checkpointService from '../datasources/checkpointService';
import { useCheckpointViewController } from '../controllers/useCheckpointViewController';
import { CheckpointProfileData } from '../components';

import { IconMapPin as PinIcon } from '@tabler/icons-react';

export default function CheckpointView() {
   const { checkpointId } = useParams();
   const controller = useCheckpointViewController(new CheckpointRepository(checkpointService), checkpointId);

   // Responsive design hooks
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

   if (controller.loading) {
      return (
         <DetailCard title="Checkpoint Details" avatar={<PinIcon size={24} />} onBack={controller.handleBack}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
               <CircularProgress size={60} thickness={4} />
            </Box>
         </DetailCard>
      );
   }

   if (!controller.checkpoint) {
      return (
         <DetailCard title="Checkpoint Details" avatar={<PinIcon size={24} />} onBack={controller.handleBack}>
            <Box sx={{ p: 6, textAlign: 'center' }}>
               <Typography variant="h3" color="text.secondary">
                  Checkpoint not found
               </Typography>
            </Box>
         </DetailCard>
      );
   }

   return (
      <>
         <DetailCard title="Checkpoint Details" avatar={<PinIcon size={24} />} onBack={controller.handleBack}>
            {/* Checkpoint Profile Data */}
            <CheckpointProfileData info={controller.checkpoint.data} isMobile={isMobile}></CheckpointProfileData>

            <br />
            <LeafletMap checkpoint={controller.checkpoint.data} />
         </DetailCard>
      </>
   );
}
