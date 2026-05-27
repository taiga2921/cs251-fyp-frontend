export const LOCATION_TYPES = ['outdoor', 'indoor'];

/** Select options: `value` matches DB/API enum; `label` is shown in the UI */
export const LOCATION_TYPE_OPTIONS = [
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' }
];

/**
 * Coerce API/form values to a valid location_type (`outdoor` | `indoor`).
 * @param {string | null | undefined} value
 * @returns {'outdoor' | 'indoor'}
 */
export function normalizeLocationType(value) {
  const normalized = String(value ?? '').toLowerCase();
  return LOCATION_TYPES.includes(normalized) ? normalized : 'outdoor';
}

export const RECOMMENDED_RADIUS = {
  outdoor: 20,
  indoor: 40
};

/** Kuala Lumpur — default map center when coordinates are unset */
export const DEFAULT_MAP_CENTER = {
  latitude: 3.139,
  longitude: 101.6869
};

export const RADIUS_MIN = 5;
export const RADIUS_MAX = 100;
