import { TableRow, TableCell, IconButton, Box } from '@mui/material';
import { IconPencil as EditIcon, IconTrash as DeleteIcon, IconEye as ViewIcon } from '@tabler/icons-react';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

export const UserTableRow = ({ user, index, page, rowsPerPage, onView, onEdit, onDelete }) => {
  // Calculate human-readable row number
  const rowNumber = page * rowsPerPage + index + 1;
  const displayTimestamp = user?.updated_at ?? user?.created_at ?? user?.email_verified_at ?? null;

  return (
    <TableRow
      key={user.id}
      hover
      sx={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <TableCell align="center">{rowNumber}</TableCell>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.phone}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell align="center">
        <MalaysiaTime time={displayTimestamp} fallback="N/A" />
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
          <IconButton color="info" size="small" aria-label="view" title="View Details" onClick={() => onView(user.id)}>
            <ViewIcon />
          </IconButton>
          <IconButton color="warning" size="small" aria-label="edit" title="Edit User" onClick={() => onEdit(user.id)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" size="small" aria-label="delete" title="Delete User" onClick={() => onDelete(user.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
};
