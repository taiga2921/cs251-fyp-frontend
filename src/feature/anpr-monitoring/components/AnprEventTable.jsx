import PropTypes from 'prop-types';
import {
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
import AnprStatusChip from './AnprStatusChip';

export default function AnprEventTable({ events, highlightedEventIds = [], onViewDetails }) {
  if (!events.length) {
    return null;
  }

  const highlightSet = new Set(highlightedEventIds);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Plate number</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Detection time</TableCell>
            <TableCell>Camera</TableCell>
            <TableCell>Valid</TableCell>
            <TableCell>Flagged</TableCell>
            <TableCell>Evidence</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              hover
              sx={{
                transition: 'background-color 0.4s ease',
                ...(highlightSet.has(event.id)
                  ? {
                      bgcolor: 'action.selected',
                      '&:hover': { bgcolor: 'action.selected' }
                    }
                  : {})
              }}
            >
              <TableCell>
                <Typography variant="subtitle2">{event.plateNumber}</Typography>
              </TableCell>
              <TableCell>{event.confidencePercent}</TableCell>
              <TableCell>
                <MalaysiaTime time={event.detectionTime} />
              </TableCell>
              <TableCell>{event.camera?.name ?? '—'}</TableCell>
              <TableCell>
                <AnprStatusChip kind="validity" value={event.isValid ? 'valid' : 'invalid'} />
              </TableCell>
              <TableCell>
                <AnprStatusChip kind="flagged" value={event.isFlagged ? 'flagged' : 'unflagged'} />
              </TableCell>
              <TableCell>
                <AnprStatusChip
                  kind="evidence"
                  value={event.hasEvidence ? 'available' : 'missing'}
                />
                {event.hasEvidence ? (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {event.evidenceCount} image{event.evidenceCount === 1 ? '' : 's'}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" onClick={() => onViewDetails(event.id)}>
                  View details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

AnprEventTable.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  highlightedEventIds: PropTypes.arrayOf(PropTypes.string),
  onViewDetails: PropTypes.func.isRequired
};
