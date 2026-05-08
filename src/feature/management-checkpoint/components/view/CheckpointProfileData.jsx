import { Box, Chip, Divider, Grid, Paper, Stack, styled, Typography } from '@mui/material';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

const Item = styled(Box)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary
}));

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  letterSpacing: 1.2,
  fontSize: '0.85rem',
  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 100%, ${theme.palette.secondary.light} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: 20
}));

export function CheckpointProfileData({ info, isMobile }) {
  const status = info.status;

  const statusConfig = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'error' },
    maintenance: { label: 'Maintenance', color: 'warning' },
    disabled: { label: 'Disabled', color: 'default' }
  };

  const viewConfig = {
    false: { direction: 'row', spacing: 2, align: 'center', mb: 0.5 },
    true: { direction: 'column', spacing: 0.5, align: '', mb: 2 }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Zone Name
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.zone.name}
                </Typography>
              </Stack>

              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Checkpoint Name
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.name}
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Longitude
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.longitude}
                </Typography>
              </Stack>

              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Latitude
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.latitude}
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.description ?? '-'}
                </Typography>
              </Stack>

              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Last Modified
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {<MalaysiaTime time={info.updated_at} />}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
}
