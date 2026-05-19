import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  Typography
} from '@mui/material';

import { FieldContainer } from 'ui-component/FieldContainer';
import { SelectFieldContainer } from 'ui-component/SelectFieldContainer';
import { SectionHeader } from 'ui-component/SectionHeader';
import { SubmitButton } from 'ui-component/CreateActionButtons';

import CheckpointMapPicker from './CheckpointMapPicker';
import { LOCATION_TYPES, RADIUS_MAX, RADIUS_MIN, RECOMMENDED_RADIUS } from '../utils/checkpointConstants';

export default function CheckpointForm({ controller }) {
  const {
    formData,
    errors,
    zones,
    zonesLoading,
    noZones,
    isEdit,
    mapLatitude,
    mapLongitude,
    handleChange,
    handleCoordinatesChange,
    handleApplyRecommendedRadius,
    handleSubmit
  } = controller;

  const coordinateError = errors.latitude || errors.longitude;

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {noZones ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No zones found. Create a zone first before adding checkpoints.
        </Alert>
      ) : null}

      <SectionHeader title="Checkpoint details" />
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldContainer
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange('name')}
            error={Boolean(errors.name)}
            helperText={errors.name}
            placeholder="Checkpoint name"
            disabled={noZones}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SelectFieldContainer
            label="Zone"
            name="zone_id"
            value={formData.zone_id}
            onChange={handleChange('zone_id')}
            error={Boolean(errors.zone_id)}
            helperText={errors.zone_id || (zonesLoading ? 'Loading zones...' : '')}
            disabled={zonesLoading || noZones}
          >
            <MenuItem value="">
              <em>Select zone</em>
            </MenuItem>
            {zones.map((zone) => (
              <MenuItem key={zone.id} value={zone.id}>
                {zone.name}
              </MenuItem>
            ))}
          </SelectFieldContainer>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SelectFieldContainer
            label="Location type"
            name="location_type"
            value={formData.location_type}
            onChange={handleChange('location_type')}
            error={Boolean(errors.location_type)}
            helperText={
              errors.location_type ||
              (!isEdit ? `Recommended radius: ${RECOMMENDED_RADIUS[formData.location_type]} m` : '')
            }
            disabled={noZones}
          >
            {LOCATION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </SelectFieldContainer>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FieldContainer
            label="Radius (metres)"
            name="radius"
            type="number"
            value={formData.radius}
            onChange={handleChange('radius')}
            error={Boolean(errors.radius)}
            helperText={errors.radius || `Between ${RADIUS_MIN} and ${RADIUS_MAX}`}
            inputProps={{ min: RADIUS_MIN, max: RADIUS_MAX, step: 1 }}
            disabled={noZones}
          />
          {isEdit ? (
            <Button size="small" onClick={handleApplyRecommendedRadius} sx={{ mt: 1 }} disabled={noZones}>
              Use recommended radius ({RECOMMENDED_RADIUS[formData.location_type]} m)
            </Button>
          ) : null}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(formData.is_active)}
                onChange={handleChange('is_active')}
                color="primary"
                disabled={noZones}
              />
            }
            label="Active"
          />
          {errors.is_active ? (
            <Typography variant="caption" color="error" display="block">
              {errors.is_active}
            </Typography>
          ) : null}
        </Grid>
      </Grid>

      <SectionHeader title="Coordinates" />
      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldContainer
            label="Latitude"
            name="latitude"
            type="number"
            value={formData.latitude}
            onChange={handleChange('latitude')}
            error={Boolean(errors.latitude)}
            helperText={errors.latitude}
            inputProps={{ step: 'any' }}
            disabled={noZones}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FieldContainer
            label="Longitude"
            name="longitude"
            type="number"
            value={formData.longitude}
            onChange={handleChange('longitude')}
            error={Boolean(errors.longitude)}
            helperText={errors.longitude}
            inputProps={{ step: 'any' }}
            disabled={noZones}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <CheckpointMapPicker
            latitude={mapLatitude}
            longitude={mapLongitude}
            radius={formData.radius}
            onCoordinatesChange={handleCoordinatesChange}
            coordinateError={coordinateError}
          />
        </Grid>
      </Grid>

      {controller.submitError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {controller.submitError}
        </Alert>
      ) : null}

      <SubmitButton
        text1={isEdit ? 'Update checkpoint' : 'Create checkpoint'}
        text2={isEdit ? 'Updating...' : 'Creating...'}
        controller={controller}
      />
    </Box>
  );
}
