import { Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';

import { CheckpointTableHeader } from './CheckpointTableHeader';
import { CheckpointTableRow } from './CheckpointTableRow';

export function CheckpointTable({ checkpoints, onView, onEdit, onDelete }) {
  return (
    <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden' }} elevation={1}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 960 }}>
          <CheckpointTableHeader />
          <TableBody>
            {checkpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No checkpoints found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              checkpoints.map((checkpoint) => (
                <CheckpointTableRow
                  key={checkpoint.id}
                  checkpoint={checkpoint}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
