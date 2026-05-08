export class CheckpointRepository {
   constructor(dataSource) {
      this.dataSource = dataSource;
   }

   async getAllCheckpoints() {
      try {
         return await this.dataSource.getAllCheckpoints();
      } catch (error) {
         console.error('Error fetching checkpoints:', error);
         throw error;
      }
   }

   async getZoneById(zoneId) {
      try {
         return await this.dataSource.getZoneById(zoneId);
      } catch (error) {
         console.error('Error fetching zone details:', error);
         throw error;
      }
   }

   async getAllCheckpointsByZoneId(zoneId) {
      try {
         return await this.dataSource.getAllCheckpointsByZoneId(zoneId);
      } catch (error) {
         console.error('Error fetching checkpoints list by zone id:', error);
         throw error;
      }
   }

   async getCheckpointById(checkpointId) {
      try {
         return await this.dataSource.getCheckpointById(checkpointId);
      } catch (error) {
         console.error('Error fetching checkpoint:', error);
         throw error;
      }
   }

   async createCheckpoint(checkpointData) {
      try {
         if (!checkpointData.name) {
            throw new Error('Checkpoint name is required');
         }
         return await this.dataSource.createCheckpoint(checkpointData);
      } catch (error) {
         console.error('Error creating checkpoint:', error);
         throw error;
      }
   }

   async updateCheckpoint(checkpointId, checkpointData) {
      try {
         if (!checkpointData.name) {
            throw new Error('Checkpoint name is required');
         }
         return await this.dataSource.updateCheckpoint(checkpointId, checkpointData);
      } catch (error) {
         console.error('Error updating checkpoint:', error);
         throw error;
      }
   }

   async deleteCheckpoint(checkpointId) {
      try {
         return await this.dataSource.deleteCheckpoint(checkpointId);
      } catch (error) {
         console.error('Error deleting checkpoint:', error);
         throw error;
      }
   }

   filterCheckpoints(checkpoints, searchText) {
      if (!searchText) return checkpoints;

      const lowerSearch = searchText.toLowerCase();
      return checkpoints.filter(
         (checkpoint) =>
            checkpoint.name.toLowerCase().includes(lowerSearch) ||
            checkpoint.code.toLowerCase().includes(lowerSearch) ||
            checkpoint.status.toLowerCase().includes(lowerSearch)
      );
   }

   paginateCheckpoints(checkpoints, page, rowsPerPage) {
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      return checkpoints.slice(start, end);
   }
}
