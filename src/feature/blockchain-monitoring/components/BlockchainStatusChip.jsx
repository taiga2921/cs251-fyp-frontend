import PropTypes from 'prop-types';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'default' },
  queued: { label: 'Queued', color: 'info' },
  processing: { label: 'Processing', color: 'info' },
  submitted: { label: 'Submitted', color: 'warning' },
  confirmed: { label: 'Confirmed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  unknown: { label: 'Unknown', color: 'default' }
};

const JOB_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'default' },
  running: { label: 'Running', color: 'info' },
  successful: { label: 'Successful', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  unknown: { label: 'Unknown', color: 'default' }
};

const VERIFICATION_RESULT_CONFIG = {
  valid: { label: 'Valid', color: 'success' },
  invalid: { label: 'Invalid', color: 'error' },
  error: { label: 'Error', color: 'warning' },
  pending: { label: 'Pending', color: 'default' },
  unknown: { label: 'Unknown', color: 'default' }
};

function resolveConfig(kind, value) {
  const key = String(value ?? '').toLowerCase();

  if (kind === 'job') {
    return JOB_STATUS_CONFIG[key] ?? { label: value || '—', color: 'default' };
  }
  if (kind === 'verification') {
    return VERIFICATION_RESULT_CONFIG[key] ?? { label: value || '—', color: 'default' };
  }

  return STATUS_CONFIG[key] ?? { label: value || 'Unknown', color: 'default' };
}

export default function BlockchainStatusChip({ kind = 'record', value, size = 'small' }) {
  const config = resolveConfig(kind, value);
  return <Chip label={config.label} color={config.color} size={size} variant="outlined" />;
}

BlockchainStatusChip.propTypes = {
  kind: PropTypes.oneOf(['record', 'job', 'verification']),
  value: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium'])
};
