import PropTypes from 'prop-types';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { MalaysiaTime } from 'ui-component/MalaysiaTime';
import { TableActionButtons } from 'ui-component/table/TableActionButtons';
import { TableEmptyRow } from 'ui-component/table/TableEmptyRow';
import { standardTableHeadCellSx, standardTablePaperSx, standardTableRowSx } from 'ui-component/table/tableStyles';

import PatrolStatusChip from './PatrolStatusChip';

export default function PatrolSessionTable({
  sessions,
  summariesBySessionId = {},
  page = 0,
  rowsPerPage = 10,
  onViewDetails
}) {
  return (
    <Paper sx={standardTablePaperSx} elevation={1}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 960 }}>
          <TableHead sx={{ backgroundColor: 'secondary.light' }}>
            <TableRow>
              <TableCell sx={standardTableHeadCellSx} align="center">
                No
              </TableCell>
              <TableCell sx={standardTableHeadCellSx}>Guard</TableCell>
              <TableCell sx={standardTableHeadCellSx}>Zone</TableCell>
              <TableCell sx={standardTableHeadCellSx}>Started</TableCell>
              <TableCell sx={standardTableHeadCellSx}>Ended</TableCell>
              <TableCell sx={standardTableHeadCellSx} align="center">
                Status
              </TableCell>
              <TableCell sx={standardTableHeadCellSx} align="center">
                Confidence
              </TableCell>
              <TableCell sx={standardTableHeadCellSx} align="center">
                Completion
              </TableCell>
              <TableCell sx={standardTableHeadCellSx} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!sessions?.length ? (
              <TableEmptyRow colSpan={9} message="No patrol sessions found." />
            ) : (
              sessions.map((session, index) => {
                const summary = summariesBySessionId[session.id];
                return (
                  <TableRow key={session.id} hover sx={standardTableRowSx}>
                    <TableCell align="center">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{session.user?.name ?? '—'}</TableCell>
                    <TableCell>{session.zone?.name ?? '—'}</TableCell>
                    <TableCell>
                      <MalaysiaTime time={session.started_at} />
                    </TableCell>
                    <TableCell>
                      <MalaysiaTime time={session.ended_at} />
                    </TableCell>
                    <TableCell align="center">
                      <PatrolStatusChip kind="patrol" value={session.status} />
                    </TableCell>
                    <TableCell align="center">
                      {summary?.confidence_level ? <PatrolStatusChip kind="confidence" value={summary.confidence_level} /> : '—'}
                    </TableCell>
                    <TableCell align="center">
                      {summary?.completion_percentage != null ? `${summary.completion_percentage}%` : '—'}
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <TableActionButtons onView={() => onViewDetails(session.id)} viewLabel="View details" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

PatrolSessionTable.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object),
  summariesBySessionId: PropTypes.object,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  onViewDetails: PropTypes.func.isRequired
};
