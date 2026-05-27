import { useMemo } from 'react';

import { Alert, Box, CircularProgress, Snackbar, useMediaQuery, useTheme } from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';

import { ZoneRepository } from '../repositories/zoneRepository';
import { useZoneController } from '../controllers/useZoneController';
import zoneService from '../datasources/zoneService';

import { ZoneTable, ZoneTableToolbar } from '../components';

export default function ZoneList() {
  const repository = useMemo(() => new ZoneRepository(zoneService), []);
  const controller = useZoneController(repository);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (controller.loading && controller.zones.length === 0) {
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
      {controller.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {controller.error}
        </Alert>
      ) : null}

      <ZoneTableToolbar
        filterText={controller.filterText}
        onFilterChange={controller.handleFilterChange}
        onAddZone={controller.handleAddZone}
      />

      <ZoneTable
        zones={controller.zones}
        page={controller.page}
        rowsPerPage={controller.rowsPerPage}
        onView={controller.handleViewZone}
        onEdit={controller.handleEditZone}
        onDelete={controller.handleDeleteZone}
      />

      <PaginationFooter
        page={controller.page}
        rowsPerPage={controller.rowsPerPage}
        filteredCount={controller.totalCount}
        onPageChange={controller.handleChangePage}
        onRowsPerPageChange={controller.handleChangeRowsPerPage}
        isMobile={isMobile}
      />

      <Snackbar
        open={Boolean(controller.feedback.message)}
        autoHideDuration={4000}
        onClose={controller.clearFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={controller.clearFeedback} severity={controller.feedback.type || 'info'} sx={{ width: '100%' }}>
          {controller.feedback.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
