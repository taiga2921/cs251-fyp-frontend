import { LOCATION_TYPES, RADIUS_MAX, RADIUS_MIN } from './checkpointConstants';

export function validateCheckpointForm(formData, { isEdit = false } = {}) {
  const errors = {};

  const name = String(formData.name ?? '').trim();
  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length > 255) {
    errors.name = 'Name must be at most 255 characters';
  }

  if (!formData.zone_id) {
    errors.zone_id = 'Zone is required';
  }

  const lat = formData.latitude === '' || formData.latitude == null ? NaN : Number(formData.latitude);
  if (Number.isNaN(lat)) {
    errors.latitude = 'Latitude is required';
  } else if (lat < -90 || lat > 90) {
    errors.latitude = 'Latitude must be between -90 and 90';
  }

  const lng = formData.longitude === '' || formData.longitude == null ? NaN : Number(formData.longitude);
  if (Number.isNaN(lng)) {
    errors.longitude = 'Longitude is required';
  } else if (lng < -180 || lng > 180) {
    errors.longitude = 'Longitude must be between -180 and 180';
  }

  const radius = formData.radius === '' || formData.radius == null ? NaN : Number(formData.radius);
  if (Number.isNaN(radius)) {
    errors.radius = 'Radius is required';
  } else if (radius < RADIUS_MIN || radius > RADIUS_MAX) {
    errors.radius = `Radius must be between ${RADIUS_MIN} and ${RADIUS_MAX} metres`;
  }

  const locationType = formData.location_type;
  if (!locationType || !LOCATION_TYPES.includes(locationType)) {
    errors.location_type = 'Location type is required';
  }

  if (formData.is_active !== true && formData.is_active !== false) {
    errors.is_active = 'Active status is required';
  }

  return { errors, isValid: Object.keys(errors).length === 0, isEdit };
}

export function buildCheckpointPayload(formData) {
  return {
    zone_id: formData.zone_id,
    name: String(formData.name).trim(),
    latitude: Number(formData.latitude),
    longitude: Number(formData.longitude),
    radius: Number(formData.radius),
    location_type: formData.location_type,
    is_active: Boolean(formData.is_active)
  };
}

export function extractBackendValidationErrors(error) {
  return error?.validationErrors || error?.data?.data?.errors || error?.data?.errors || null;
}

export function normalizeValidationErrorsForForm(validationErrors) {
  if (!validationErrors || typeof validationErrors !== 'object') return {};
  return Object.entries(validationErrors).reduce((acc, [field, messages]) => {
    acc[field] = Array.isArray(messages) ? messages[0] : messages;
    return acc;
  }, {});
}

export function extractBackendErrorMessage(error, fallback = 'Request failed.') {
  const validationErrors = extractBackendValidationErrors(error);
  if (validationErrors && typeof validationErrors === 'object') {
    const firstFieldErrors = Object.values(validationErrors).find((messages) => Array.isArray(messages) && messages.length > 0);
    if (Array.isArray(firstFieldErrors)) return firstFieldErrors[0];
  }
  return error?.data?.message || error?.message || fallback;
}
