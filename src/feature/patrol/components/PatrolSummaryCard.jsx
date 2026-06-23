import { useMemo, useState } from 'react';
import { Alert, Box, Chip, CircularProgress, Collapse, Grid, IconButton, Paper, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function formatDurationSeconds(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return '0s';
  }
  if (value < 60) {
    return `${Math.round(value)}s`;
  }
  const mins = Math.floor(value / 60);
  const secs = Math.round(value % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function confidenceChipProps(level) {
  const normalized = String(level ?? '').toLowerCase();
  if (normalized === 'high') {
    return { label: 'High confidence', color: 'success' };
  }
  if (normalized === 'medium') {
    return { label: 'Medium confidence', color: 'warning' };
  }
  return { label: 'Low confidence', color: 'error' };
}

function checkpointStatusChip(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'verified') return { label: 'Verified', color: 'success' };
  if (normalized === 'suspicious') return { label: 'Suspicious', color: 'warning' };
  if (normalized === 'uncertain') return { label: 'Uncertain', color: 'info' };
  if (normalized === 'rejected') return { label: 'Rejected', color: 'error' };
  return { label: status || 'Unknown', color: 'default' };
}

function countAnomalies(anomalies) {
  if (!anomalies || typeof anomalies !== 'object') {
    return 0;
  }

  let count = 0;
  const timestampIssues = anomalies.timestamp_issues ?? {};
  count += (timestampIssues.duplicate_ids ?? []).length;
  count += (timestampIssues.invalid_ids ?? []).length;
  count += (timestampIssues.out_of_order_ids ?? []).length;

  const segmentAnomalies = anomalies.segment_anomalies ?? [];
  if (Array.isArray(segmentAnomalies)) {
    count += segmentAnomalies.filter((row) => row?.major || row?.minor || row?.speed_anomaly || row?.gps_jump).length;
  }

  return count;
}

function countCheckpointResults(results, status) {
  if (!Array.isArray(results)) {
    return 0;
  }
  return results.filter((row) => String(row?.status ?? '').toLowerCase() === status).length;
}

function StatItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

function FinalizingProgress({ finalizingStep }) {
  if (!finalizingStep || finalizingStep === 'idle' || finalizingStep === 'completed') {
    return null;
  }

  const messages = {
    syncing: 'Syncing logs…',
    validating: 'Validating patrol…',
    loading_summary: 'Loading summary…',
    failed: 'Patrol finalization failed'
  };

  const message = messages[finalizingStep] ?? 'Finalizing patrol…';

  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {finalizingStep !== 'failed' ? <CircularProgress size={22} /> : null}
      <Typography variant="body2">{message}</Typography>
    </Stack>
  );
}

function ValidationSection({ finalizingStep, validatingPatrol, validationError, validationWarning, validationResult }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isValidating = validatingPatrol || finalizingStep === 'validating';
  const results = validationResult?.checkpoint_results ?? [];
  const hasResults = Array.isArray(results) && results.length > 0;

  const validationCounts = useMemo(
    () => ({
      verified: countCheckpointResults(results, 'verified'),
      suspicious: countCheckpointResults(results, 'suspicious'),
      uncertain: countCheckpointResults(results, 'uncertain'),
      rejected: countCheckpointResults(results, 'rejected')
    }),
    [results]
  );

  const anomalyCount = countAnomalies(validationResult?.anomalies);

  if (!isValidating && !validationError && !validationWarning && !validationResult) {
    return null;
  }

  return (
    <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="subtitle2" gutterBottom>
        Backend validation
      </Typography>

      {isValidating ? (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Running server-side validation…
          </Typography>
        </Stack>
      ) : null}

      {validationError ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {validationError}
        </Alert>
      ) : null}

      {validationWarning ? (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {validationWarning}
        </Alert>
      ) : null}

      {validationResult ? (
        <Stack spacing={1.5}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Segments" value={validationResult.total_segments ?? 0} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="GPS gaps" value={validationResult.total_gaps ?? 0} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Anomalies" value={anomalyCount} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Location logs" value={validationResult.total_location_logs ?? 0} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Verified" value={validationCounts.verified} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Suspicious" value={validationCounts.suspicious} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Uncertain" value={validationCounts.uncertain} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatItem label="Rejected" value={validationCounts.rejected} />
            </Grid>
          </Grid>

          {hasResults ? (
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Checkpoint results ({results.length})
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                  aria-label="Toggle checkpoint validation details"
                >
                  <ExpandMoreIcon
                    sx={{
                      transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </IconButton>
              </Stack>
              <Collapse in={detailsOpen}>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {results.map((row) => {
                    const chip = checkpointStatusChip(row.status);
                    return (
                      <Stack
                        key={row.checkpoint_id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                        sx={{
                          py: 0.75,
                          px: 1,
                          borderRadius: 1,
                          bgcolor: 'action.hover'
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {row.checkpoint_name ?? row.checkpoint_id}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap">
                          <Chip label={chip.label} color={chip.color} size="small" />
                          {row.detection_type ? <Chip label={row.detection_type} size="small" variant="outlined" /> : null}
                          <Chip label={`${row.confidence_score ?? '—'}%`} size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Collapse>
            </Box>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

/**
 * Gap-aware patrol session summary from `GET /patrol-sessions/{id}/summary`,
 * plus backend validation results from `POST /patrol-sessions/{id}/validate`.
 */
export default function PatrolSummaryCard({
  summary,
  loading,
  error,
  summaryMayBeIncomplete = false,
  finalizingStep = 'idle',
  validatingPatrol = false,
  validationError = null,
  validationWarning = null,
  validationResult = null
}) {
  const showFinalizing = finalizingStep && finalizingStep !== 'idle' && finalizingStep !== 'completed';

  if (showFinalizing && !summary && !loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Stack spacing={2}>
          <FinalizingProgress finalizingStep={finalizingStep} />
          <ValidationSection
            finalizingStep={finalizingStep}
            validatingPatrol={validatingPatrol}
            validationError={validationError}
            validationWarning={validationWarning}
            validationResult={validationResult}
          />
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Stack spacing={2}>
          {summaryMayBeIncomplete ? (
            <Alert severity="warning">Some offline logs may not have synced yet. Summary may be incomplete.</Alert>
          ) : null}
          <FinalizingProgress finalizingStep={finalizingStep} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography variant="body2">Loading patrol summary…</Typography>
          </Stack>
          <ValidationSection
            finalizingStep={finalizingStep}
            validatingPatrol={validatingPatrol}
            validationError={validationError}
            validationWarning={validationWarning}
            validationResult={validationResult}
          />
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} sx={{ mt: 2 }}>
        <ValidationSection
          finalizingStep={finalizingStep}
          validatingPatrol={validatingPatrol}
          validationError={validationError}
          validationWarning={validationWarning}
          validationResult={validationResult}
        />
        <Alert severity="error">{error}</Alert>
      </Stack>
    );
  }

  if (!summary && !validationResult) {
    return null;
  }

  const chip = confidenceChipProps(summary?.confidence_level);
  const score = summary?.confidence_score ?? '—';

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Stack spacing={2}>
        {summaryMayBeIncomplete ? (
          <Alert severity="warning">Some offline logs may not have synced yet. Summary may be incomplete.</Alert>
        ) : null}

        <ValidationSection
          finalizingStep={finalizingStep}
          validatingPatrol={validatingPatrol}
          validationError={validationError}
          validationWarning={validationWarning}
          validationResult={validationResult}
        />

        {summary ? (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="h6">Patrol summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  Final summary after backend validation
                </Typography>
              </Box>
              <Chip label={chip.label} color={chip.color} size="small" />
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Confidence score
              </Typography>
              <Typography variant="h4" fontWeight={700} color={`${chip.color}.main`}>
                {score}
                <Typography component="span" variant="h6" color="text.secondary">
                  {' '}
                  / 100
                </Typography>
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <StatItem label="Completion" value={`${summary.completion_percentage ?? 0}%`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <StatItem label="Location logs" value={summary.total_location_logs ?? 0} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <StatItem label="GPS gaps" value={summary.total_gaps ?? 0} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <StatItem label="Longest gap" value={formatDurationSeconds(summary.longest_gap_seconds)} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <StatItem label="Total gap time" value={formatDurationSeconds(summary.total_gap_seconds)} />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Checkpoints (summary)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <StatItem label="Verified" value={summary.verified_checkpoints ?? 0} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <StatItem label="Pending" value={summary.pending_checkpoints ?? 0} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <StatItem label="Uncertain" value={summary.uncertain_checkpoints ?? 0} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <StatItem label="Suspicious" value={summary.suspicious_checkpoints ?? 0} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <StatItem label="Rejected" value={summary.rejected_checkpoints ?? 0} />
                </Grid>
              </Grid>
            </Box>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}
