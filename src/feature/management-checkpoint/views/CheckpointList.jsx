import { useParams } from 'react-router-dom';

import { Box, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';
import DetailCard from 'ui-component/cards/DetailCard';
import { SectionHeader } from 'ui-component/SectionHeader';

import { CheckpointRepository } from '../repositories/checkpointRepository';
import { useCheckpointController } from '../controllers/useCheckpointController.js';
import checkpointService from '../datasources/checkpointService';

import { CheckpointTable, CheckpointTableToolbar, ZoneProfileData } from '../components';
import { IconMap as MapIcon } from '@tabler/icons-react';

export default function CheckpointList() {
   const { zoneId } = useParams();
   // Initialize dependencies using dependency injection pattern
   const repository = new CheckpointRepository(checkpointService);
   const controller = useCheckpointController(repository, zoneId);

   // Responsive design hooks
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

   // Show loading indicator while data is being fetched
   if (controller.loading) {
      return (
         <DetailCard title="Zone Details" avatar={<MapIcon size={24} />} onBack={controller.handleBack}>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
               <CircularProgress />
            </Box>
         </DetailCard>
      );
   }

   console.log(controller.zone);

   return (
      <DetailCard title="Zone Details" avatar={<MapIcon size={24} />} onBack={controller.handleBack}>
         <ZoneProfileData info={controller.zone} isMobile={isMobile}></ZoneProfileData>

         <br />
         <SectionHeader title="List of Checkpoints"></SectionHeader>
         {/* Filtering and action toolbar */}
         <CheckpointTableToolbar
            filterText={controller.filterText}
            onFilterChange={controller.handleFilterChange}
            onAddCheckpoint={controller.handleAddCheckpoint}
         />
         {/* Main table displaying checkpoint data */}
         <CheckpointTable
            page={controller.page}
            rowsPerPage={controller.rowsPerPage}
            checkpoints={controller.checkpoints}
            onView={controller.handleViewCheckpoint}
            onEdit={controller.handleEditCheckpoint}
            onDelete={controller.handleDeleteCheckpoint}
         />
         {/* Pagination and rows per page controls */}
         <PaginationFooter
            page={controller.page}
            rowsPerPage={controller.rowsPerPage}
            filteredCount={controller.filteredCount}
            onPageChange={controller.handleChangePage}
            onRowsPerPageChange={controller.handleChangeRowsPerPage}
            isMobile={isMobile}
         />
      </DetailCard>
   );
}
