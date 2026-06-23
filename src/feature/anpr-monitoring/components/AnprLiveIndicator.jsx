import PropTypes from 'prop-types';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const STATUS_CONFIG = {
  live: {
    label: 'LIVE',
    tooltip: 'Live update',
    dotColor: 'error.main',
    chipColor: 'error',
    blink: true
  },
  reconnecting: {
    label: 'RECONNECTING',
    tooltip: 'Last refresh failed. Retrying…',
    dotColor: 'warning.main',
    chipColor: 'warning',
    blink: false
  },
  paused: {
    label: 'PAUSED',
    tooltip: 'Live updates paused',
    dotColor: 'text.disabled',
    chipColor: 'default',
    blink: false
  }
};

export default function AnprLiveIndicator({ status = 'live', lastUpdatedAt = null }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.live;

  const formattedLastUpdate =
    lastUpdatedAt instanceof Date && !Number.isNaN(lastUpdatedAt.getTime())
      ? new Intl.DateTimeFormat('en-MY', {
          timeZone: 'Asia/Kuala_Lumpur',
          dateStyle: 'short',
          timeStyle: 'medium'
        }).format(lastUpdatedAt)
      : null;

  return (
    <Tooltip title={formattedLastUpdate ? `${config.tooltip} · Last updated ${formattedLastUpdate}` : config.tooltip} arrow>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          ml: { xs: 0, sm: 1 },
          mt: { xs: 0.5, sm: 0 }
        }}
      >
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: config.dotColor,
            flexShrink: 0,
            animation: config.blink ? `${blink} 1.4s ease-in-out infinite` : 'none'
          }}
        />
        <Chip
          label={config.label}
          size="small"
          color={config.chipColor}
          variant="outlined"
          sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.5 }}
        />
        {formattedLastUpdate && status === 'live' ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'inline' }, whiteSpace: 'nowrap' }}>
            {formattedLastUpdate}
          </Typography>
        ) : null}
      </Box>
    </Tooltip>
  );
}

AnprLiveIndicator.propTypes = {
  status: PropTypes.oneOf(['live', 'reconnecting', 'paused']),
  lastUpdatedAt: PropTypes.instanceOf(Date)
};
