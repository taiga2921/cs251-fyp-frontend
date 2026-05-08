import api from 'api/api';

const buildServiceError = (error, action) => {
  const status = error?.status || (error?.message === 'Unauthorized' ? 401 : undefined);
  const details = error?.data;
  const messageFromApi = details?.message;

  let message = messageFromApi || `Failed to ${action}.`;

  if (status === 401) {
    message = 'Unauthorized. Please log in again.';
  } else if (status === 403) {
    message = 'Forbidden. Admin access is required.';
  }

  const serviceError = new Error(message);
  serviceError.status = status;
  serviceError.data = details;
  serviceError.originalError = error;

  return serviceError;
};

const extractResponsePayload = (response) => response?.data;

const zoneService = {
  // Get all zones
  getAllZones: async () => {
    try {
      const response = await api.get('/zones');
      return extractResponsePayload(response);
    } catch (error) {
      throw buildServiceError(error, 'fetch zones');
    }
  },

  // Get single zone
  getZoneById: async (id) => {
    try {
      const response = await api.get(`/zones/${id}`);
      return extractResponsePayload(response);
    } catch (error) {
      throw buildServiceError(error, 'fetch zone');
    }
  },

  // Create zone
  createZone: async (zoneData) => {
    try {
      const response = await api.post('/zones', zoneData);
      return extractResponsePayload(response);
    } catch (error) {
      throw buildServiceError(error, 'create zone');
    }
  },

  // Update zone
  updateZone: async (id, zoneData) => {
    try {
      const response = await api.patch(`/zones/${id}`, zoneData);
      return extractResponsePayload(response);
    } catch (error) {
      throw buildServiceError(error, 'update zone');
    }
  },

  // Delete zone
  deleteZone: async (id) => {
    try {
      const response = await api.delete(`/zones/${id}`);
      return extractResponsePayload(response);
    } catch (error) {
      throw buildServiceError(error, 'delete zone');
    }
  }
};

export default zoneService;
