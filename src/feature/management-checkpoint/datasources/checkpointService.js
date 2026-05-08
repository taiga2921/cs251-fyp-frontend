import api from 'api/api';

const extractValidationErrors = (details) => {
  return details?.data?.errors || details?.errors || null;
};

const extractFirstValidationMessage = (validationErrors) => {
  if (!validationErrors || typeof validationErrors !== 'object') return null;

  const firstFieldErrors = Object.values(validationErrors).find((messages) => Array.isArray(messages) && messages.length > 0);
  return Array.isArray(firstFieldErrors) ? firstFieldErrors[0] : null;
};

const buildServiceError = (error, action) => {
  const status = error?.status || (error?.message === 'Unauthorized' ? 401 : undefined);
  const details = error?.data;
  const validationErrors = extractValidationErrors(details);
  const firstValidationMessage = extractFirstValidationMessage(validationErrors);
  const messageFromApi = firstValidationMessage || details?.message;

  let message = messageFromApi || `Failed to ${action}.`;

  if (status === 401) {
    message = 'Unauthorized. Please log in again.';
  } else if (status === 403) {
    message = 'Forbidden. Admin access is required.';
  }

  const serviceError = new Error(message);
  serviceError.status = status;
  serviceError.data = details;
  serviceError.validationErrors = validationErrors;
  serviceError.originalError = error;

  return serviceError;
};

const extractResponsePayload = (response) => response?.data;

const checkpointService = {
   // Get all checkpoints
   getAllCheckpoints: async () => {
      try {
         const response = await api.get('/checkpoints');
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'fetch checkpoints');
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

   // Get all checkpoints by zone id
   getAllCheckpointsByZoneId: async (id) => {
      try {
         const response = await api.get(`/checkpoints?zone_id=${id}`);
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'fetch checkpoints by zone');
      }
   },

   // Get single checkpoint
   getCheckpointById: async (id) => {
      try {
         const response = await api.get(`/checkpoints/${id}`);
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'fetch checkpoint');
      }
   },

   // Create checkpoint
   createCheckpoint: async (checkpointData) => {
      try {
         const response = await api.post('/checkpoints', checkpointData);
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'create checkpoint');
      }
   },

   // Update checkpoint
   updateCheckpoint: async (id, checkpointData) => {
      try {
         const response = await api.patch(`/checkpoints/${id}`, checkpointData);
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'update checkpoint');
      }
   },

   // Delete checkpoint
   deleteCheckpoint: async (id) => {
      try {
         const response = await api.delete(`/checkpoints/${id}`);
         return extractResponsePayload(response);
      } catch (error) {
         throw buildServiceError(error, 'delete checkpoint');
      }
   }
};

export default checkpointService;
