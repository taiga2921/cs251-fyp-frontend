import { useParams } from 'react-router-dom';

import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';
import { IconMap as MapIcon } from '@tabler/icons-react';
import DetailCard from 'ui-component/cards/DetailCard';

import { SectionHeader } from 'ui-component/SectionHeader';
import { FieldContainer } from 'ui-component/FieldContainer';
import { SubmitButton } from 'ui-component/CreateActionButtons';
import { SuccessDialog } from 'ui-component/dialogs/SuccessDialog';

import { ZoneRepository } from '../repositories/zoneRepository';
import zoneService from '../datasources/zoneService';
import { useZoneFormController } from '../controllers/useZoneFormController';

export default function ZoneAdd() {
  const { zoneId } = useParams();
  // Initialize dependencies using dependency injection pattern
  const repository = new ZoneRepository(zoneService);
  const controller = useZoneFormController(repository, zoneId);

  // Responsive design hooks
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <DetailCard title="Edit Zone Details" avatar={<MapIcon size={24} />} onBack={controller.handleCancel}>
        <Box sx={{ mx: 'auto' }} component="form" onSubmit={controller.handleSubmit}>
          <SectionHeader title="Zone Profile"></SectionHeader>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FieldContainer
                label="Zone Name"
                name="name"
                value={controller.formData.name}
                onChange={controller.handleChange('name')}
                error={!!controller.errors.name}
                helperText={controller.errors.name}
                placeholder="Enter name"
              ></FieldContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FieldContainer
                label="Description"
                name="description"
                value={controller.formData.description}
                onChange={controller.handleChange('description')}
                error={!!controller.errors.description}
                helperText={controller.errors.description}
                placeholder="Enter description"
              ></FieldContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 12 }}>
              <SubmitButton text1="Update Zone" text2="Updating..." controller={controller}></SubmitButton>
            </Grid>
          </Grid>
        </Box>
      </DetailCard>

      <SuccessDialog controller={controller} msg="Zone updated successfully! Redirecting to zone view page..."></SuccessDialog>
    </>
  );
}
