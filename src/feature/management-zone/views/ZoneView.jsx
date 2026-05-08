import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
  Paper,
  Pagination,
  Select,
  MenuItem,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import { ZoneRepository } from '../repositories/zoneRepository';
import { useZoneController } from '../controllers/useZoneController';
import { zoneDataSource } from '../datasources/zoneDataSource';
import { ZoneTableToolbar } from '../components/ZoneTable/ZoneTableToolbar';
import { ZoneTableHeader } from '../components/ZoneTable/ZoneTableHeader';
import { ZoneTableRow } from '../components/ZoneTable/ZoneTableRow';

export default function ZoneView() {
  // Initialize dependencies
  const repository = new ZoneRepository(zoneDataSource);
  const controller = useZoneController(repository);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (controller.loading) {
    return (
      <MainCard title="Zone Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  // Calculate total pages for Pagination
  const totalPages = Math.ceil(controller.filteredCount / controller.rowsPerPage);
  const startItem = controller.page * controller.rowsPerPage + 1;
  const endItem = Math.min((controller.page + 1) * controller.rowsPerPage, controller.filteredCount);

  return (
    <MainCard title="Zone Details">
      <ZoneTableToolbar
        filterText={controller.filterText}
        onFilterChange={controller.handleFilterChange}
        onAddZone={controller.handleAddZone}
      />

      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 700 }}>
            <ZoneTableHeader />
            <TableBody>
              {controller.zones.map((zone) => (
                <ZoneTableRow
                  key={zone.id}
                  zone={zone}
                  isSelected={controller.isSelected(zone.id)}
                  onRowClick={controller.handleRowClick}
                  onView={controller.handleViewZone}
                  onEdit={controller.handleEditZone}
                  onDelete={controller.handleDeleteZone}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: { xs: 2, sm: 0 }
          }}
        >
          {/* Left side: Rows per page selector */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 2 },
              order: { xs: 2, sm: 1 }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 0.5
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Rows per page:
              </Typography>
              <Select
                value={controller.rowsPerPage}
                onChange={controller.handleChangeRowsPerPage}
                variant="outlined"
                sx={{
                  minWidth: 80,
                  '& .MuiSelect-select': {
                    py: 0.75,
                    fontSize: { xs: '0.875rem' }
                  }
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
              </Select>
            </Box>

            {/* Optional: Display range info */}
            <Typography variant="body2" color="text.secondary">
              {`${startItem}-${endItem} of ${controller.filteredCount}`}
            </Typography>
          </Box>

          {/* Right side: Pagination - Stack on mobile, show on right on desktop */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', sm: 'flex-end' },
              order: { xs: 1, sm: 2 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <Pagination
              count={totalPages}
              variant="outlined"
              color="secondary"
              page={controller.page + 1}
              onChange={(event, page) => controller.handleChangePage(event, page - 1)}
              siblingCount={isMobile ? 0 : 1}
              boundaryCount={isMobile ? 1 : 2}
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 1,
                  minWidth: { xs: 32 },
                  height: { xs: 32 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </Box>
        </Box>
      </Paper>
    </MainCard>
  );
}
