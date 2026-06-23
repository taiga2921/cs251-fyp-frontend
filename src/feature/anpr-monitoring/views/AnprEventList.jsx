import { useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { IconRefresh } from '@tabler/icons-react';

import MainCard from 'ui-component/cards/MainCard';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';

import anprMonitoringService from '../datasources/anprMonitoringService';
import { AnprMonitoringRepository } from '../repositories/AnprMonitoringRepository';
import { useAnprMonitoringController } from '../controllers/useAnprMonitoringController';
import AnprEventTable from '../components/AnprEventTable';
import AnprEmptyState from '../components/AnprEmptyState';
import AnprLiveIndicator from '../components/AnprLiveIndicator';

function AnprMonitoringTitle() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      <Typography component="span" variant="h3">
        ANPR Monitoring
      </Typography>
    </Box>
  );
}

export default function AnprEventList() {
  const repositoryRef = useRef(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new AnprMonitoringRepository(anprMonitoringService);
  }
  const controller = useAnprMonitoringController(repositoryRef.current);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (controller.loading && controller.events.length === 0) {
    return (
      <MainCard title={<AnprMonitoringTitle />}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  const titleWithLive = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
      <Typography component="span" variant="h3">
        ANPR Monitoring
      </Typography>
      <AnprLiveIndicator status={controller.liveStatus} lastUpdatedAt={controller.lastUpdatedAt} />
    </Box>
  );

  return (
    <MainCard
      title={titleWithLive}
      secondary={
        <Button
          variant="outlined"
          startIcon={<IconRefresh size={18} />}
          onClick={controller.handleRefresh}
          disabled={controller.refreshing}
        >
          {controller.refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Review ANPR detections delivered from the AI runtime through the Laravel backend, including
          plate reads, camera context, and evidence metadata.
        </Typography>

        {controller.lastUpdatedAt ? (
          <Typography variant="caption" color="text.secondary">
            Last updated:{' '}
            {new Intl.DateTimeFormat('en-MY', {
              timeZone: 'Asia/Kuala_Lumpur',
              dateStyle: 'medium',
              timeStyle: 'medium'
            }).format(controller.lastUpdatedAt)}
            {controller.liveStatus === 'reconnecting' ? ' · Live refresh failed, retrying…' : null}
          </Typography>
        ) : null}

        {controller.liveError && controller.liveStatus === 'reconnecting' ? (
          <Alert severity="warning" sx={{ py: 0.5 }}>
            {controller.liveError}
          </Alert>
        ) : null}

        {controller.error ? (
          <Alert severity="error">{controller.error}</Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            label="Search plate number"
            value={controller.filters.plateSearch}
            onChange={(e) => controller.handlePlateSearchChange(e.target.value)}
            sx={{ minWidth: { sm: 220 }, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Validity</InputLabel>
            <Select
              label="Validity"
              value={controller.filters.validity}
              onChange={(e) => controller.handleValidityFilterChange(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="valid">Valid</MenuItem>
              <MenuItem value="invalid">Invalid</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Flagged</InputLabel>
            <Select
              label="Flagged"
              value={controller.filters.flagged}
              onChange={(e) => controller.handleFlaggedFilterChange(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="unflagged">Not flagged</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {controller.events.length === 0 ? (
          <AnprEmptyState
            title="No ANPR detections found"
            description={
              controller.error
                ? 'Try refreshing after resolving the API error.'
                : 'Detections will appear here after the AI runtime delivers events to Laravel.'
            }
          />
        ) : (
          <AnprEventTable
            events={controller.events}
            highlightedEventIds={controller.highlightedEventIds}
            onViewDetails={controller.handleViewDetails}
          />
        )}

        {controller.pagination.total > 0 ? (
          <PaginationFooter
            page={controller.page}
            rowsPerPage={controller.rowsPerPage}
            filteredCount={controller.pagination.total}
            onPageChange={controller.handleChangePage}
            onRowsPerPageChange={controller.handleChangeRowsPerPage}
            isMobile={isMobile}
          />
        ) : null}
      </Stack>
    </MainCard>
  );
}
