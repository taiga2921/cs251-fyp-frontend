import { Box, CircularProgress, useTheme, useMediaQuery } from '@mui/material';

import { UserRepository } from '../repositories/userRepository';
import { useUserController } from '../controllers/useUserController';
import userService from '../datasources/userService';

import MainCard from 'ui-component/cards/MainCard';
import { PaginationFooter } from 'ui-component/table/PaginationFooter';
import { UserTable, UserTableToolbar } from '../components';

export default function UserList() {
  // Initialize dependencies using dependency injection pattern
  const repository = new UserRepository(userService);
  const controller = useUserController(repository);

  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Show loading indicator while data is being fetched
  if (controller.loading) {
    return (
      <MainCard title="User Management">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="User Management">
      {/* Filtering and action toolbar */}
      <UserTableToolbar
        filterText={controller.filterText}
        onFilterChange={controller.handleFilterChange}
        onAddUser={controller.handleAddUser}
      />

      {/* Main table displaying user data */}
      <UserTable
        users={controller.users}
        page={controller.page}
        rowsPerPage={controller.rowsPerPage}
        onView={controller.handleViewUser}
        onEdit={controller.handleEditUser}
        onDelete={controller.handleDeleteUser}
      />

      {/* Pagination and rows per page controls */}
      <PaginationFooter
        page={controller.page}
        rowsPerPage={controller.rowsPerPage}
        filteredCount={controller.filteredCount}
        onPageChange={controller.handleChangePage}
        onRowsPerPageChange={controller.handleChangeRowsPerPage}
        isMobile={isMobile}
      />
    </MainCard>
  );
}
