import { Table, TableBody, TableCell, TableContainer, TableRow, Paper, Typography } from '@mui/material';
import { ZoneTableHeader } from './ZoneTableHeader';
import { ZoneTableRow } from './ZoneTableRow';

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
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No zones found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone, index) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
