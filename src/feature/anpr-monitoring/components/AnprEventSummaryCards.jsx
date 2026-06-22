import PropTypes from 'prop-types';
import { Grid, Paper, Stack, Typography } from '@mui/material';

function SummaryCard({ label, value, helper }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      {helper ? (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      ) : null}
    </Paper>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string
};

export default function AnprEventSummaryCards({ event }) {
  if (!event) return null;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard label="Plate number" value={event.plateNumber} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard label="Confidence" value={event.confidencePercent} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard label="Detection time" value={event.formattedDetectionTime} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SummaryCard
          label="Evidence"
          value={event.evidenceCount}
          helper={event.hasEvidence ? 'Images registered' : 'No images available'}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Camera
          </Typography>
          {event.camera ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">{event.camera.name}</Typography>
              {event.camera.location ? (
                <Typography variant="caption" color="text.secondary">
                  {event.camera.location}
                </Typography>
              ) : null}
              {event.camera.ipAddress ? (
                <Typography variant="caption" color="text.secondary">
                  IP: {event.camera.ipAddress}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No camera details
            </Typography>
          )}
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Vehicle
          </Typography>
          {event.vehicle ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">{event.vehicle.plateNumber ?? event.plateNumber}</Typography>
              {event.vehicle.ownerName ? (
                <Typography variant="caption" color="text.secondary">
                  Owner: {event.vehicle.ownerName}
                </Typography>
              ) : null}
              {event.vehicle.vehicleType ? (
                <Typography variant="caption" color="text.secondary">
                  Type: {event.vehicle.vehicleType}
                </Typography>
              ) : null}
              {event.vehicle.status ? (
                <Typography variant="caption" color="text.secondary">
                  Status: {event.vehicle.status}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No linked vehicle record
            </Typography>
          )}
        </Paper>
      </Grid>
      {(event.latitude || event.longitude) && (
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Coordinates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.latitude ?? '—'}, {event.longitude ?? '—'}
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}

AnprEventSummaryCards.propTypes = {
  event: PropTypes.object
};
