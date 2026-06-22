import PropTypes from 'prop-types';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { MalaysiaTime } from 'ui-component/MalaysiaTime';

function tryParseJson(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function LogMessage({ message }) {
  if (message === null || message === undefined || message === '') {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const parsed = tryParseJson(message);

  if (parsed !== null) {
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          bgcolor: 'grey.50',
          borderRadius: 1,
          overflow: 'auto',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {JSON.stringify(parsed, null, 2)}
      </Box>
    );
  }

  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {String(message)}
    </Typography>
  );
}

LogMessage.propTypes = {
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default function AnprEventLogs({ logs = [] }) {
  if (!logs.length) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Event logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No lifecycle logs are available for this detection yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Event logs
      </Typography>
      <Stack spacing={1.5}>
        {logs.map((log) => (
          <Paper key={log.id ?? `${log.stage}-${log.createdAt}`} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle2">{log.stage}</Typography>
                <Typography variant="caption" color="text.secondary">
                  <MalaysiaTime time={log.createdAt} />
                </Typography>
              </Stack>
              <LogMessage message={log.message} />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

AnprEventLogs.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object)
};
