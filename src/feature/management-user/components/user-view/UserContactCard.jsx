// UserContactCard.jsx
import { Box, Typography, Divider, Stack } from '@mui/material';
import { IconPhone, IconMail, IconMapPin } from '@tabler/icons-react';
import InfoItem from './UserInfoItem';
import { StyledPaper } from '../../styles/StyledPaper';
import { MalaysiaTime } from 'ui-component/MalaysiaTime';

export function UserContactCard({ user, isMobile }) {
  return (
    <StyledPaper>
      <Typography variant="h3" sx={{ mb: 3, fontWeight: 600 }}>
        Contact Information
      </Typography>

      <Stack spacing={2.5}>
        <InfoItem icon={<IconPhone size={20} />} label="Phone Number" value={user.phone} isMobile={isMobile} />
        <InfoItem icon={<IconMail size={20} />} label="Email Address" value={user.email} isMobile={isMobile} />
        <InfoItem icon={<IconMapPin size={20} />} label="Home Address" value={user.address} isMobile={isMobile} />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last Modified:{' '}
            <Box component="span" sx={{ fontWeight: 600 }}>
              {<MalaysiaTime time={user.updated_at} />}
            </Box>
          </Typography>
        </Box>
      </Stack>
    </StyledPaper>
  );
}
