import PropTypes from 'prop-types';
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

import VehicleStatusChip from './VehicleStatusChip';

export default function VehicleTable({ vehicles, onView, onEdit }) {
  if (!vehicles.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No vehicle records found.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Plate number</TableCell>
            <TableCell>Owner name</TableCell>
            <TableCell>Vehicle type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id} hover>
              <TableCell>
                <Typography variant="subtitle2">{vehicle.plateNumber}</Typography>
              </TableCell>
              <TableCell>{vehicle.ownerName ?? '—'}</TableCell>
              <TableCell>{vehicle.vehicleType ?? '—'}</TableCell>
              <TableCell>
                <VehicleStatusChip kind="status" value={vehicle.status} />
              </TableCell>
              <TableCell>
                <VehicleStatusChip kind="source" value={vehicle.source} />
              </TableCell>
              <TableCell>{vehicle.notesSummary}</TableCell>
              <TableCell>{vehicle.formattedCreatedAt}</TableCell>
              <TableCell>{vehicle.formattedUpdatedAt}</TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => onView(vehicle.id)}>
                  View
                </Button>
                <Button size="small" variant="contained" onClick={() => onEdit(vehicle)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

VehicleTable.propTypes = {
  vehicles: PropTypes.arrayOf(PropTypes.object).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};
