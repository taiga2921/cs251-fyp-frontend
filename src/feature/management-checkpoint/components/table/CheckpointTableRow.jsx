import { Box, IconButton, TableCell, TableRow } from '@mui/material';
import { IconEye as ViewIcon, IconPencil as EditIcon, IconTrash as DeleteIcon } from '@tabler/icons-react';

import { MalaysiaTime } from 'ui-component/MalaysiaTime';
import CheckpointLocationTypeChip from '../CheckpointLocationTypeChip';
import CheckpointStatusChip from '../CheckpointStatusChip';

export function CheckpointTableRow({ checkpoint, onView, onEdit, onDelete }) {
  const zoneName = checkpoint.zone?.name ?? checkpoint.zone_name ?? '—';

  return (
    <TableRow hover>
      <TableCell>{checkpoint.name}</TableCell>
      <TableCell>{zoneName}</TableCell>
      <TableCell align="center">
        <CheckpointLocationTypeChip locationType={checkpoint.location_type} />
      </TableCell>
      <TableCell align="center">{checkpoint.radius ?? '—'}</TableCell>
      <TableCell align="center">
        <CheckpointStatusChip isActive={checkpoint.is_active !== false} />
      </TableCell>
      <TableCell align="center">{checkpoint.latitude}</TableCell>
      <TableCell align="center">{checkpoint.longitude}</TableCell>
      <TableCell align="center">{checkpoint.updated_at ? <MalaysiaTime time={checkpoint.updated_at} /> : '—'}</TableCell>
      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.25 }}>
          <IconButton color="info" size="small" aria-label="view" title="View" onClick={() => onView(checkpoint.id)}>
            <ViewIcon size={18} />
          </IconButton>
          <IconButton color="warning" size="small" aria-label="edit" title="Edit" onClick={() => onEdit(checkpoint.id)}>
            <EditIcon size={18} />
          </IconButton>
          <IconButton color="error" size="small" aria-label="delete" title="Delete" onClick={() => onDelete(checkpoint.id)}>
            <DeleteIcon size={18} />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}
