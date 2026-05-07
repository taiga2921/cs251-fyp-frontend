import { useParams } from 'react-router-dom';

import { Box, CircularProgress, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';

import { UserRepository } from '../repositories/userRepository';
import userService from '../datasources/userService';
import { useUserViewController } from '../controllers/useUserViewController';

import DetailCard from 'ui-component/cards/DetailCard';
import { UserProfileCard, UserContactCard } from '../components';

import { IconUsers as UsersIcon } from '@tabler/icons-react';

/**
 * UserView
 * --------
 * Read-only detail page for a single user.
 */
export default function UserView() {
  // Extract userId from route: /userManagement/view/:userId
  const { userId } = useParams();

  // Initialize dependencies using dependency injection pattern
  const repository = new UserRepository(userService);
  const controller = useUserViewController(repository, userId);

  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * LOADING STATE
   * -------------
   * Shown while user data is being fetched.
   * UI is blocked to prevent rendering incomplete state.
   */
  if (controller.loading) {
    return (
      <DetailCard title="User Details" avatar={<UsersIcon size={24} />} onBack={controller.handleBack}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      </DetailCard>
    );
  }

  /**
   * NOT FOUND STATE
   * ---------------
   * Rendered when API returns no user or invalid ID is supplied.
   * This is a business outcome, not a technical error.
   */
  if (!controller.user) {
    return (
      <DetailCard title="User Details" avatar={<UsersIcon size={24} />} onBack={controller.handleBack}>
        <Box sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h3" color="text.secondary">
            User not found
          </Typography>
        </Box>
      </DetailCard>
    );
  }

  /**
   * SUCCESS STATE
   * -------------
   * User exists and data is ready.
   * Page is composed from small, single-purpose view components.
   */
  return (
    <DetailCard title="User Details" avatar={<UsersIcon size={24} />} onBack={controller.handleBack}>
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* User identity and profile metadata */}
          <Grid size={{ xs: 12, md: 6 }}>
            <UserProfileCard user={controller.user.data} isMobile={isMobile} />
          </Grid>

          {/* User contact and communication details */}
          <Grid size={{ xs: 12, md: 6 }}>
            <UserContactCard user={controller.user.data} isMobile={isMobile} />
          </Grid>
        </Grid>
      </Box>
    </DetailCard>
  );
}
