import { TableRow, TableCell, IconButton, Box } from '@mui/material';
import { IconPencil as EditIcon, IconTrash as DeleteIcon, IconEye as ViewIcon } from '@tabler/icons-react';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

export const CheckpointTableRow = ({ checkpoint, index, page, rowsPerPage, onView, onEdit, onDelete }) => {
  // Calculate human-readable row number
  const rowNumber = page * rowsPerPage + index + 1;

  return (
    <TableRow
      key={checkpoint.id}
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <TableCell align="center">{rowNumber}</TableCell>
      <TableCell>{checkpoint.name}</TableCell>
      <TableCell align="center">{checkpoint.latitude}</TableCell>
      <TableCell align="center">{checkpoint.longitude}</TableCell>
      <TableCell align="center">{<MalaysiaTime time={checkpoint.updated_at} />}</TableCell>

      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
          <IconButton color="info" size="small" aria-label="view" title="View Details" onClick={() => onView(checkpoint.id)}>
            <ViewIcon />
          </IconButton>
          <IconButton color="warning" size="small" aria-label="edit" title="Edit Checkpoint" onClick={() => onEdit(checkpoint.id)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" aria-label="delete" title="Delete Checkpoint" onClick={() => onDelete(checkpoint.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};
