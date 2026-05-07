import { Box, Avatar, Divider, Chip, Typography, Stack } from '@mui/material';
import { IconShieldCheck } from '@tabler/icons-react';
import { StyledPaper } from '../../styles/StyledPaper';

export function UserProfileCard({ user, isMobile }) {
  return (
    <StyledPaper>
      <Stack spacing={3} alignItems="center">
        <Avatar
          src={user.profilePicture}
          alt={user.name}
          sx={{
            width: isMobile ? 100 : 140,
            height: isMobile ? 100 : 140,
            border: isMobile ? '3px solid' : '5px solid',
            borderColor: 'secondary.main'
          }}
        />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>

          <Chip label={user.role.name} icon={<IconShieldCheck size={18} />} color="secondary" sx={{ mt: 1, mb: 2, fontWeight: 600 }} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Name:{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {user.name}
            </Box>
          </Typography>
        </Box>
      </Stack>
    </StyledPaper>
  );
}
