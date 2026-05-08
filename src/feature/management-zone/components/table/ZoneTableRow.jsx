import { TableRow, TableCell, IconButton, Box } from '@mui/material';
import { IconPencil as EditIcon, IconTrash as DeleteIcon, IconEye as ViewIcon } from '@tabler/icons-react';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

export const ZoneTableRow = ({ zone, index, page, rowsPerPage, onView, onEdit, onDelete }) => {
  // Calculate human-readable row number
  const rowNumber = page * rowsPerPage + index + 1;

  return (
    <TableRow
      key={zone.id}
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <TableCell align="center">{rowNumber}</TableCell>
      <TableCell>{zone.name}</TableCell>
      <TableCell align="center">{zone.checkpoints_count}</TableCell>
      <TableCell align="center">{<MalaysiaTime time={zone.updated_at} />}</TableCell>

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
          <IconButton color="info" size="small" aria-label="view" title="View Details" onClick={() => onView(zone.id)}>
            <ViewIcon />
          </IconButton>
          <IconButton color="warning" size="small" aria-label="edit" title="Edit Zone" onClick={() => onEdit(zone.id)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" aria-label="delete" title="Delete Zone" onClick={() => onDelete(zone.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};
