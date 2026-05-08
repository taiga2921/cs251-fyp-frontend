export const zoneDataSource = {
   fetchZones: async () => {
      return [
         {
            id: '1',
            zoneName: 'Zone A',
            numCheckpoints: '10',
            lastModified: '10/05/2025, 12:30 PM'
         },
         {
            id: '2',
            zoneName: 'Zone B',
            numCheckpoints: '6',
            lastModified: '09/05/2025, 10:15 AM'
         },
         {
            id: '3',
            zoneName: 'Zone C',
            numCheckpoints: '6',
            lastModified: '09/05/2025, 10:15 AM'
         },
         {
            id: '4',
            zoneName: 'Zone D',
            numCheckpoints: '6',
            lastModified: '09/05/2025, 10:15 AM'
         },
         {
            id: '5',
            zoneName: 'Zone E',
            numCheckpoints: '6',
            lastModified: '09/05/2025, 10:15 AM'
         },
         {
            id: '6',
            zoneName: 'Zone F',
            numCheckpoints: '6',
            lastModified: '09/05/2025, 10:15 AM'
         }
      ];
   },

   fetchZoneById: async (zoneId) => {
      const zones = await zoneDataSource.fetchZones();
      return zones.find((zone) => zone.id === zoneId);
   },

   createZone: async (zoneData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newZone = {
         id: Date.now().toString(),
         ...zoneData,
         lastModified: new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
         })
      };
      return { success: true, data: newZone };
   },

   updateZone: async (zoneId, zoneData) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
         success: true,
         data: {
            id: zoneId,
            ...zoneData,
            lastModified: new Date().toLocaleString('en-GB', {
               day: '2-digit',
               month: '2-digit',
               year: 'numeric',
               hour: '2-digit',
               minute: '2-digit',
               hour12: true
            })
         }
      };
   },

   deleteZone: async (zoneId) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { success: true, id: zoneId };
   }
};
