import { useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { IconRefresh } from '@tabler/icons-react';

import MainCard from 'ui-component/cards/MainCard';
import LiveIndicator from 'ui-component/LiveIndicator';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';

import patrolMonitoringService from '../datasources/patrolMonitoringService';
import { PatrolMonitoringRepository } from '../repositories/patrolMonitoringRepository';
import { usePatrolMonitoringController } from '../controllers/usePatrolMonitoringController';
import PatrolSessionTable from '../components/PatrolSessionTable';
import PatrolRealtimeSnackbar from '../components/PatrolRealtimeSnackbar';

function StatCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </Paper>
  );
}

function PatrolMonitoringTitle({ liveStatus }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
      <Typography component="span" variant="h3">
        Patrol Monitoring
      </Typography>
      <LiveIndicator status={liveStatus} />
    </Box>
  );
}

export default function PatrolMonitoringDashboard() {
  const repositoryRef = useRef(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new PatrolMonitoringRepository(patrolMonitoringService);
  }
  const controller = usePatrolMonitoringController(repositoryRef.current);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (controller.loading && controller.sessions.length === 0) {
    return (
      <MainCard title={<PatrolMonitoringTitle liveStatus={controller.liveStatus} />}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={<PatrolMonitoringTitle liveStatus={controller.liveStatus} />}
      secondary={
        <Button variant="outlined" startIcon={<IconRefresh size={18} />} onClick={controller.handleRefresh}>
          Refresh
        </Button>
      }
    >
      <PatrolRealtimeSnackbar />
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Total sessions" value={controller.stats.total} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Active" value={controller.stats.active} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Completed" value={controller.stats.completed} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Aborted" value={controller.stats.aborted} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Suspicious events" value={controller.stats.suspiciousEvents} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <StatCard label="Uncertain events" value={controller.stats.uncertainEvents} />
          </Grid>
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            label="Search guard or zone"
            value={controller.filterText}
            onChange={(e) => controller.handleFilterTextChange(e.target.value)}
            sx={{ minWidth: { sm: 220 }, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={controller.statusFilter} onChange={(e) => controller.handleStatusFilterChange(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="aborted">Aborted</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Zone</InputLabel>
            <Select label="Zone" value={controller.zoneFilter} onChange={(e) => controller.handleZoneFilterChange(e.target.value)}>
              <MenuItem value="">All zones</MenuItem>
              {controller.zones.map((zone) => (
                <MenuItem key={zone.id} value={zone.id}>
                  {zone.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {controller.error ? <Alert severity="error">{controller.error}</Alert> : null}

        {controller.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        <PatrolSessionTable
          sessions={controller.sessions}
          summariesBySessionId={controller.summariesBySessionId}
          page={controller.page}
          rowsPerPage={controller.rowsPerPage}
          onViewDetails={controller.handleViewDetails}
        />

        <PaginationFooter
          page={controller.page}
          rowsPerPage={controller.rowsPerPage}
          filteredCount={controller.totalCount}
          onPageChange={controller.handleChangePage}
          onRowsPerPageChange={controller.handleChangeRowsPerPage}
          isMobile={isMobile}
        />
      </Stack>
    </MainCard>
  );
}
