import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';
import PatrolStatusChip from './PatrolStatusChip';

export default function PatrolSessionTable({ sessions, summariesBySessionId = {}, onViewDetails }) {
  if (!sessions?.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No patrol sessions found.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Guard</TableCell>
            <TableCell>Zone</TableCell>
            <TableCell>Started</TableCell>
            <TableCell>Ended</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Confidence</TableCell>
            <TableCell align="center">Completion</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => {
            const summary = summariesBySessionId[session.id];
            return (
              <TableRow key={session.id} hover>
                <TableCell>{session.user?.name ?? '—'}</TableCell>
                <TableCell>{session.zone?.name ?? '—'}</TableCell>
                <TableCell>
                  <MalaysiaTime time={session.started_at} />
                </TableCell>
                <TableCell>
                  <MalaysiaTime time={session.ended_at} />
                </TableCell>
                <TableCell>
                  <PatrolStatusChip kind="patrol" value={session.status} />
                </TableCell>
                <TableCell align="center">
                  {summary?.confidence_level ? (
                    <PatrolStatusChip kind="confidence" value={summary.confidence_level} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="center">
                  {summary?.completion_percentage != null ? `${summary.completion_percentage}%` : '—'}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" variant="outlined" onClick={() => onViewDetails(session.id)}>
                      View Details
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

PatrolSessionTable.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object),
  summariesBySessionId: PropTypes.object,
  onViewDetails: PropTypes.func.isRequired
};
