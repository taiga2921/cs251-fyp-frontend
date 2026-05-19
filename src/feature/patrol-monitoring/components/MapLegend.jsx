import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';

const CHECKPOINT_LEGEND = [
  { key: 'verified', label: 'Verified', color: '#22c55e' },
  { key: 'suspicious', label: 'Suspicious', color: '#f97316' },
  { key: 'uncertain', label: 'Uncertain', color: '#eab308' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
  { key: 'pending', label: 'Pending / missed', color: '#9ca3af' }
];

const ROUTE_LEGEND = [
  { label: 'Patrol trail', color: '#2563eb', style: 'solid' },
  { label: 'GPS gap (>30s)', color: '#f97316', style: 'dashed' },
  { label: 'Breadcrumb', color: '#64748b', style: 'dot' },
  { label: 'Start', color: '#16a34a', style: 'pin' },
  { label: 'End', color: '#dc2626', style: 'pin' }
];

function LegendSwatch({ color, style }) {
  if (style === 'dot') {
    return (
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: color,
          border: '1px solid rgba(0,0,0,0.2)'
        }}
      />
    );
  }

  if (style === 'pin') {
    return (
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: color,
          border: '2px solid #fff',
          boxShadow: 1
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 28,
        height: 0,
        borderTop: style === 'dashed' ? `3px dashed ${color}` : `3px solid ${color}`
      }}
    />
  );
}

LegendSwatch.propTypes = {
  color: PropTypes.string.isRequired,
  style: PropTypes.string
};

export default function MapLegend({ gapCount = 0 }) {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        Map legend
      </Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2} sx={{ mb: 1 }}>
        {ROUTE_LEGEND.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
            <LegendSwatch color={item.color} style={item.style} />
            <Typography variant="caption">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
        {CHECKPOINT_LEGEND.map((item) => (
          <Stack key={item.key} direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: item.color,
                border: '2px solid #fff',
                boxShadow: 1
              }}
            />
            <Typography variant="caption">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
      {gapCount > 0 ? (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          {gapCount} GPS gap{gapCount === 1 ? '' : 's'} detected between route points (&gt;30s).
        </Typography>
      ) : null}
    </Box>
  );
}

MapLegend.propTypes = {
  gapCount: PropTypes.number
};
