import { Box, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';

import { ZoneRepository } from '../repositories/zoneRepository';
import { useZoneController } from '../controllers/useZoneController';
import zoneService from '../datasources/zoneService';

import { ZoneTable, ZoneTableToolbar } from '../components';

/**
 * Main view component for zone list.
 * Orchestrates the integration of toolbar, table, and pagination components.
 * Handles dependency injection and loading states.
 */

export default function ZoneList() {
   // Initialize dependencies using dependency injection pattern
   const repository = new ZoneRepository(zoneService);
   const controller = useZoneController(repository);

   // Responsive design hooks
   const theme = useTheme();
   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

   // Show loading indicator while data is being fetched
   if (controller.loading) {
      return (
         <MainCard title="Zone Management">
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
               <CircularProgress />
            </Box>
         </MainCard>
      );
   }

   return (
      <MainCard title="Zone Management">
         {/* Filtering and action toolbar */}
         <ZoneTableToolbar
            filterText={controller.filterText}
            onFilterChange={controller.handleFilterChange}
            onAddZone={controller.handleAddZone}
         />

         {/* Main table displaying zone data */}
         <ZoneTable
            zones={controller.zones}
            page={controller.page}
            rowsPerPage={controller.rowsPerPage}
            onView={controller.handleViewZone}
            onEdit={controller.handleEditZone}
            onDelete={controller.handleDeleteZone}
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
      </MainCard>
   );
}
