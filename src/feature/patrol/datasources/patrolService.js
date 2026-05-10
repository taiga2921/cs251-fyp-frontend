import api from 'api/api';

const patrolService = {
   // Get all zones
   getAllZones: async () => {
      try {
         const response = await api.get('/zones');
         return response.data.data;
      } catch (error) {
         throw error;
      }
   },

   // Create patrol
   createPatrol: async (patrolData) => {
      try {
         const response = await api.post('/patrol-logs', patrolData);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   // Update patrol
   updatePatrol: async (id, patrolData) => {
      try {
         // Make sure this is the correct endpoint
         const response = await api.put(`/patrol-logs/${id}`, patrolData); // or /patrols/${id}
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   // Get all checkpoints by zone id
   getAllCheckpointsByZoneId: async (id) => {
      try {
         const response = await api.get(`/checkpoints?zone_id=${id}`);
         return response.data.data;
      } catch (error) {
         throw error;
      }
   },

   createCheckpointLog: async (data) => {
      try {
         const response = await api.post('/patrol-checkpoint-logs', data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   updateCheckpointLog: async (logId, data) => {
      try {
         const response = await api.put(`/patrol-checkpoint-logs/${logId}`, data);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   createPatrolRoute: async (data) => {
      try {
         const response = await api.post('/patrol-routes', data);
         return response.data;
      } catch (error) {
         throw error;
      }
   }
};

export default patrolService;
