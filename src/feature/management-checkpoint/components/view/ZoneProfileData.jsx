import { Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';

export function ZoneProfileData({ info, isMobile }) {
  const status = info.is_active;

  const statusConfig = {
    true: { label: 'Active', color: 'success' },
    false: { label: 'Inactive', color: 'default' }
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
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.name}
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Checkpoints Count
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.checkpoints_count}
                </Typography>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Stack direction={viewConfig[isMobile].direction} spacing={viewConfig[isMobile].spacing} sx={{ mb: viewConfig[isMobile].mb }}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {info.description}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
}
