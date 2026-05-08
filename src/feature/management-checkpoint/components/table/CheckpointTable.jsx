import { Table, TableBody, TableContainer, Paper } from '@mui/material';
import { CheckpointTableHeader } from './CheckpointTableHeader';
import { CheckpointTableRow } from './CheckpointTableRow';

/**
 * Reusable table component for displaying checkpoint data.
 * Handles the table layout and row rendering.
 */

export function CheckpointTable({ checkpoints, page, rowsPerPage, onView, onEdit, onDelete }) {
   return (
      <Paper
         sx={{
            width: '100%',
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden'
         }}
         elevation={1}
      >
         <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
               <CheckpointTableHeader />
               <TableBody>
                  {checkpoints.map((checkpoint, index) => (
                     <CheckpointTableRow
                        key={checkpoint.id}
                        checkpoint={checkpoint}
                        index={index}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onView={() => onView(checkpoint.id)}
                        onEdit={() => onEdit(checkpoint.id)}
                        onDelete={() => onDelete(checkpoint.id)}
                     />
                  ))}
               </TableBody>
            </Table>
         </TableContainer>
      </Paper>
   );
}
