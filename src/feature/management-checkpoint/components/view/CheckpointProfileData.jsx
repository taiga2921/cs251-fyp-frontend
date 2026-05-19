import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

import { MalaysiaTime } from 'ui-component/MalaysiaTime';
import CheckpointLocationTypeChip from '../CheckpointLocationTypeChip';
import CheckpointStatusChip from '../CheckpointStatusChip';

export function CheckpointProfileData({ checkpoint, isMobile }) {
  const stackDirection = isMobile ? 'column' : 'row';
  const zoneName = checkpoint.zone?.name ?? '—';

  const field = (label, value) => (
    <Stack direction={stackDirection} spacing={0.5} sx={{ mb: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary">
        {value}
      </Typography>
    </Stack>
  );

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          {field('Checkpoint name', checkpoint.name)}
          {field('Zone', zoneName)}
          <Stack direction={stackDirection} spacing={0.5} sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Box>
              <CheckpointStatusChip isActive={checkpoint.is_active !== false} />
            </Box>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack direction={stackDirection} spacing={0.5} sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Location type
            </Typography>
            <Box>
              <CheckpointLocationTypeChip locationType={checkpoint.location_type} />
            </Box>
          </Stack>
          {field('Radius (m)', checkpoint.radius)}
          {field('Latitude', checkpoint.latitude)}
          {field('Longitude', checkpoint.longitude)}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          {field('Created', checkpoint.created_at ? <MalaysiaTime time={checkpoint.created_at} /> : '—')}
          {field('Last updated', checkpoint.updated_at ? <MalaysiaTime time={checkpoint.updated_at} /> : '—')}
        </Grid>
      </Grid>
    </Paper>
  );
}
