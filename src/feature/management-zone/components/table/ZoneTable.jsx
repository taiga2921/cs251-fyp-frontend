import { Table, TableBody, TableContainer, Paper } from '@mui/material';
import { ZoneTableHeader } from './ZoneTableHeader';
import { ZoneTableRow } from './ZoneTableRow';

/**
 * Reusable table component for displaying zone data.
 * Handles the table layout and row rendering.
 */

export function ZoneTable({ zones, page, rowsPerPage, onView, onEdit, onDelete }) {
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
               <ZoneTableHeader />
               <TableBody>
                  {zones.map((zone, index) => (
                     <ZoneTableRow
                        key={zone.id}
                        zone={zone}
                        index={index}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onView={() => onView(zone.id)}
                        onEdit={() => onEdit(zone.id)}
                        onDelete={() => onDelete(zone.id)}
                     />
                  ))}
               </TableBody>
            </Table>
         </TableContainer>
      </Paper>
   );
}
