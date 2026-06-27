import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import AuthAuditStatusChip from './AuthAuditStatusChip';

const summarizeUserAgent = (userAgent) => {
  if (!userAgent) return '—';
  return userAgent.length > 48 ? `${userAgent.slice(0, 48)}…` : userAgent;
};

const summarizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return '—';
  const entries = Object.entries(metadata).slice(0, 3);
  if (entries.length === 0) return '—';
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(', ');
};

export default function AuthAuditLogTable({ logs }) {
  if (!logs.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No audit logs found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>User / Email</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>User Agent</TableCell>
            <TableCell>Metadata</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.occurred_at || log.created_at || '—'}</TableCell>
              <TableCell>{log.action || log.event_type}</TableCell>
              <TableCell>
                <AuthAuditStatusChip status={log.status} />
              </TableCell>
              <TableCell>{log.user?.email || log.email || '—'}</TableCell>
              <TableCell>{log.ip_address || '—'}</TableCell>
              <TableCell>{summarizeUserAgent(log.user_agent)}</TableCell>
              <TableCell>{summarizeMetadata(log.metadata)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
