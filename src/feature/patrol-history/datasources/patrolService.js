import api from 'api/api';

const patrolService = {
   // Get all patrols
   getAllPatrols: async () => {
      try {
         const response = await api.get('/patrol-logs');
         return response.data.data;
      } catch (error) {
         throw error;
      }
   },

   // Get single patrol
   getPatrolById: async (id) => {
      try {
         const response = await api.get(`/patrol-logs/${id}`);
         return response.data;
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
         const response = await api.put(`/patrol-logs/${id}`, patrolData);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   // Delete patrol
   deletePatrol: async (id) => {
      try {
         const response = await api.delete(`/patrol-logs/${id}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   getAllCheckpointById: async (id) => {
      try {
         const response = await api.get(`/patrol-checkpoint-logs/by-patrol/${id}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   },

   getAllRouteById: async (id) => {
      try {
         const response = await api.get(`/patrol-routes?patrol_log_id=${id}`);
         return response.data;
      } catch (error) {
         throw error;
      }
   }
};

export default patrolService;
