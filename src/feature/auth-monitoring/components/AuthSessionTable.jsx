import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

const summarizeUserAgent = (userAgent) => {
  if (!userAgent) return '—';
  return userAgent.length > 48 ? `${userAgent.slice(0, 48)}…` : userAgent;
};

export default function AuthSessionTable({ sessions, revokingId, onRevoke }) {
  if (!sessions.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No active sessions found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>User Agent</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Last Used</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => {
            const statusLabel = session.is_active ? 'active' : session.revoked_at ? 'revoked' : session.rotated_at ? 'rotated' : 'inactive';

            return (
              <TableRow key={session.id}>
                <TableCell>{session.user?.email || '—'}</TableCell>
                <TableCell>{session.ip_address || '—'}</TableCell>
                <TableCell>{summarizeUserAgent(session.user_agent)}</TableCell>
                <TableCell>{session.created_at || '—'}</TableCell>
                <TableCell>{session.last_used_at || '—'}</TableCell>
                <TableCell>{session.expires_at || '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={session.is_current ? `${statusLabel} (current)` : statusLabel} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  {session.is_active ? (
                    <Button
                      size="small"
                      color="error"
                      disabled={revokingId === session.id}
                      onClick={() => onRevoke(session.id)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
