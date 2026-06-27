import { Grid, MenuItem, TextField } from '@mui/material';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All actions' },
  { value: 'login_password_success', label: 'Login password success' },
  { value: 'login_password_failure', label: 'Login password failure' },
  { value: 'login_rate_limited', label: 'Login rate limited' },
  { value: 'otp_success', label: 'OTP success' },
  { value: 'otp_failure', label: 'OTP failure' },
  { value: 'refresh_success', label: 'Refresh success' },
  { value: 'refresh_failure', label: 'Refresh failure' },
  { value: 'logout_success', label: 'Logout success' },
  { value: 'session_revoked', label: 'Session revoked' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'revoked', label: 'Revoked' }
];

export default function AuthAuditFilterBar({ filters, onChange }) {
  const handleChange = (field) => (event) => {
    onChange({ ...filters, [field]: event.target.value });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <TextField select fullWidth label="Action" value={filters.action} onChange={handleChange('action')}>
          {ACTION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField select fullWidth label="Status" value={filters.status} onChange={handleChange('status')}>
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField fullWidth label="Email" value={filters.email} onChange={handleChange('email')} />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          fullWidth
          type="date"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={filters.dateFrom}
          onChange={handleChange('dateFrom')}
        />
      </Grid>
      <Grid item xs={12} md={2}>
        <TextField
          fullWidth
          type="date"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={filters.dateTo}
          onChange={handleChange('dateTo')}
        />
      </Grid>
    </Grid>
  );
}
