import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

const PATROL_STATUS = {
  active: { label: 'Active', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  aborted: { label: 'Aborted', color: 'error' }
};

const CHECKPOINT_STATUS = {
  verified: { label: 'Verified', color: 'success' },
  suspicious: { label: 'Suspicious', color: 'warning' },
  uncertain: { label: 'Uncertain', color: 'info' },
  rejected: { label: 'Rejected', color: 'error' },
  pending: { label: 'Pending', color: 'default' }
};

const CONFIDENCE_LEVEL = {
  high: { label: 'High', color: 'success' },
  medium: { label: 'Medium', color: 'warning' },
  low: { label: 'Low', color: 'error' }
};

function resolveConfig(kind, value) {
  const key = String(value ?? '').toLowerCase();
  if (kind === 'patrol') return PATROL_STATUS[key] ?? { label: value || 'Unknown', color: 'default' };
  if (kind === 'checkpoint') return CHECKPOINT_STATUS[key] ?? { label: value || 'Unknown', color: 'default' };
  if (kind === 'confidence') return CONFIDENCE_LEVEL[key] ?? { label: value || '—', color: 'default' };
  return { label: value || '—', color: 'default' };
}

export default function PatrolStatusChip({ kind = 'patrol', value, size = 'small' }) {
  const config = resolveConfig(kind, value);

  return <Chip label={config.label} color={config.color} size={size} variant="outlined" />;
}

PatrolStatusChip.propTypes = {
  kind: PropTypes.oneOf(['patrol', 'checkpoint', 'confidence']),
  value: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium'])
};
