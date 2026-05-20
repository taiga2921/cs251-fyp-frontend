import { useRef } from 'react';

import { usePatrolReplayController } from '../controllers/usePatrolReplayController';
import PatrolReplayControls from '../components/PatrolReplayControls';
import { isReplaySessionAllowed } from '../utils/patrolReplayUtils';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import MainCard from 'ui-component/cards/MainCard';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

import patrolMonitoringService from '../datasources/patrolMonitoringService';
import { PatrolMonitoringRepository } from '../repositories/patrolMonitoringRepository';
import { usePatrolSessionDetailController } from '../controllers/usePatrolSessionDetailController';
import PatrolStatusChip from '../components/PatrolStatusChip';
import PatrolConfidenceCard from '../components/PatrolConfidenceCard';
import CheckpointStatusSummary from '../components/CheckpointStatusSummary';
import PatrolRouteMap from '../components/PatrolRouteMap';
import PatrolAnomalyList from '../components/PatrolAnomalyList';
import PatrolRealtimeSnackbar from '../components/PatrolRealtimeSnackbar';

export default function PatrolSessionDetail() {
  const repositoryRef = useRef(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new PatrolMonitoringRepository(patrolMonitoringService);
  }
  const controller = usePatrolSessionDetailController(repositoryRef.current);
  const replayEnabled = isReplaySessionAllowed(controller.session?.status);
  const replay = usePatrolReplayController({
    patrolRoutes: controller.patrolRoutes,
    anomalies: controller.anomalies,
    checkpointEvents: controller.checkpointEvents,
    replayEnabled
  });

  if (controller.loading) {
    return (
      <MainCard title="Patrol Session Detail">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (controller.error) {
    return (
      <MainCard title="Patrol Session Detail">
        <Alert severity="error" sx={{ mb: 2 }}>
          {controller.error}
        </Alert>
        <Button variant="outlined" onClick={controller.handleBack}>
          Back to list
        </Button>
      </MainCard>
    );
  }

  const session = controller.session;

  return (
    <MainCard
      title="Patrol Session Detail"
      secondary={
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={controller.handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={controller.handleReRunValidation}
            disabled={controller.validating}
          >
            {controller.validating ? 'Validating…' : 'Re-run Validation'}
          </Button>
        </Stack>
      }
    >
      <PatrolRealtimeSnackbar />
      <Stack spacing={2}>
        <Typography variant="caption" color="text.secondary">
          {controller.isConnected
            ? 'Live session updates (WebSocket)'
            : controller.isRealtimeEnabled
              ? `Polling fallback (${controller.connectionState})`
              : 'Polling only (realtime disabled)'}
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Guard
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {session?.user?.name ?? '—'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Zone
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {session?.zone?.name ?? '—'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Status
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <PatrolStatusChip kind="patrol" value={session?.status} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Started
              </Typography>
              <Typography variant="body1">
                <MalaysiaTime time={session?.started_at} />
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Ended
              </Typography>
              <Typography variant="body1">
                <MalaysiaTime time={session?.ended_at} />
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography variant="caption" color="text.secondary">
                Session ID
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {controller.patrolSessionId}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {controller.validationMessage ? (
          <Alert severity="success">{controller.validationMessage}</Alert>
        ) : null}
        {controller.validationError ? (
          <Alert severity="error">{controller.validationError}</Alert>
        ) : null}

        {controller.validationResult ? (
          <Alert severity="info">
            Validation: {controller.validationResult.total_segments ?? 0} segments,{' '}
            {controller.validationResult.total_gaps ?? 0} gaps,{' '}
            {controller.validationResult.checkpoint_results?.length ?? 0} checkpoint results.
          </Alert>
        ) : null}

        <CheckpointStatusSummary summary={controller.summary} />

        <PatrolConfidenceCard summary={controller.summary} loading={controller.summaryLoading} />
        {controller.summaryError ? <Alert severity="warning">{controller.summaryError}</Alert> : null}

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Patrol route map
          </Typography>
          <PatrolReplayControls
            replayEnabled={replayEnabled}
            canReplay={replay.canReplay}
            hasEnoughPoints={replay.hasEnoughPoints}
            routeCount={replay.routeCount}
            isPlaying={replay.isPlaying}
            replayProgress={replay.replayProgress}
            replayTime={replay.replayTime}
            currentRoutePoint={replay.currentRoutePoint}
            speedMultiplier={replay.speedMultiplier}
            replayFinished={replay.replayFinished}
            currentSegmentAnomaly={replay.currentSegmentAnomaly}
            onPlay={replay.play}
            onPause={replay.pause}
            onStop={replay.stop}
            onSeek={replay.seek}
            onSpeedChange={replay.setSpeedMultiplier}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: controller.validationResult ? 8 : 12 }}>
              <PatrolRouteMap
                routes={controller.patrolRoutes}
                checkpointEvents={controller.checkpointEvents}
                anomalies={controller.anomalies}
                selectedAnomaly={controller.selectedAnomaly}
                showAnomalies={controller.showAnomalies}
                replayPoint={replay.currentRoutePoint}
                replayActive={replay.replayActive}
                replayProgressIndex={replay.currentIndex}
                highlightedCheckpointIds={replay.passedCheckpointIds}
                loading={controller.routesLoading}
                error={controller.routesError}
                onLargeGapDetected={controller.handleLargeGapDetected}
              />
            </Grid>
            {controller.anomalies.length > 0 || controller.validationResult ? (
              <Grid size={{ xs: 12, lg: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Suspicious movement
                </Typography>
                <PatrolAnomalyList
                  anomalies={controller.anomalies}
                  selectedAnomalyId={controller.selectedAnomaly?.id ?? null}
                  showAnomalies={controller.showAnomalies}
                  onSelectAnomaly={controller.setSelectedAnomaly}
                />
              </Grid>
            ) : null}
          </Grid>
        </Paper>

        <Box>
          <Typography variant="h6" gutterBottom>
            Checkpoint events
          </Typography>
          {controller.eventsLoading ? (
            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Checkpoint</TableCell>
                    <TableCell>Detection</TableCell>
                    <TableCell align="center">Confidence</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Detected</TableCell>
                    <TableCell>Processed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {controller.checkpointEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No checkpoint events for this patrol.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    controller.checkpointEvents.map((event) => (
                      <TableRow key={event.id} hover>
                        <TableCell>{event.checkpoint?.name ?? event.checkpoint_id}</TableCell>
                        <TableCell>{event.detection_type ?? '—'}</TableCell>
                        <TableCell align="center">
                          {event.confidence_score != null ? `${event.confidence_score}%` : '—'}
                        </TableCell>
                        <TableCell>
                          <PatrolStatusChip kind="checkpoint" value={event.status} />
                        </TableCell>
                        <TableCell>
                          <MalaysiaTime time={event.detected_at} />
                        </TableCell>
                        <TableCell>
                          <MalaysiaTime time={event.processed_at} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Stack>
    </MainCard>
  );
}
