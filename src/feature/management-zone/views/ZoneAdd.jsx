import { Box, Grid, useTheme, useMediaQuery } from '@mui/material';
import { IconMap as MapIcon } from '@tabler/icons-react';
import DetailCard from 'ui-component/cards/DetailCard';

import { SectionHeader } from 'ui-component/SectionHeader';
import { FieldContainer } from 'ui-component/FieldContainer';
import { SubmitButton } from 'ui-component/CreateActionButtons';
import { SuccessDialog } from 'ui-component/dialogs/SuccessDialog';

import { ZoneRepository } from '../repositories/zoneRepository';
import zoneService from '../datasources/zoneService';
import { useZoneAddController } from '../controllers/useZoneAddController';

export default function ZoneAdd() {
   // Initialize dependencies using dependency injection pattern
   const repository = new ZoneRepository(zoneService);
   const controller = useZoneAddController(repository);

   // Responsive design hooks
   // const theme = useTheme();
   // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

   return (
      <>
         <DetailCard title="Add new Zone" avatar={<MapIcon size={24} />} onBack={controller.handleCancel}>
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
                        label="Code"
                        name="code"
                        value={controller.formData.code}
                        onChange={controller.handleChange('code')}
                        error={!!controller.errors.code}
                        helperText={controller.errors.code}
                        placeholder="Enter code"
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

                  <Grid size={{ xs: 12, md: 4 }}>
                     <FieldContainer
                        label="Zone Type"
                        name="zone_type"
                        value={controller.formData.zone_type}
                        onChange={controller.handleChange('zone_type')}
                        error={!!controller.errors.zone_type}
                        helperText={controller.errors.zone_type}
                        placeholder="Enter zone type"
                     ></FieldContainer>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                     <FieldContainer
                        label="Priority Level"
                        name="priority_level"
                        value={controller.formData.priority_level}
                        onChange={controller.handleChange('priority_level')}
                        error={!!controller.errors.priority_level}
                        helperText={controller.errors.priority_level}
                        placeholder="Enter priority level"
                     ></FieldContainer>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                     <FieldContainer
                        label="Center Latitude"
                        name="center_latitude"
                        value={controller.formData.center_latitude}
                        onChange={controller.handleChange('center_latitude')}
                        error={!!controller.errors.center_latitude}
                        helperText={controller.errors.center_latitude}
                        placeholder="Enter center latitude"
                     ></FieldContainer>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                     <FieldContainer
                        label="Center Longitude"
                        name="center_longitude"
                        value={controller.formData.center_longitude}
                        onChange={controller.handleChange('center_longitude')}
                        error={!!controller.errors.center_longitude}
                        helperText={controller.errors.center_longitude}
                        placeholder="Enter center longitude"
                     ></FieldContainer>
                  </Grid>

                  <Grid size={{ xs: 12, md: 12 }}>
                     <SubmitButton text1="Create Zone" text2="Creating..." controller={controller}></SubmitButton>
                  </Grid>
               </Grid>
            </Box>
         </DetailCard>

         <SuccessDialog controller={controller} msg="Zone created successfully! Redirecting to zone view page..."></SuccessDialog>
      </>
   );
}
