export class GeolocationService {
   constructor() {
      this.watchId = null;
      this.currentPosition = null;
      this.checkpoints = [];
      this.onCheckpointReached = null;
   }

   // Start watching user's location
   startWatching(onSuccess, onError, options = {}) {
      const defaultOptions = {
         enableHighAccuracy: true,
         maximumAge: 10000,
         timeout: 5000
      };

      if (this.watchId !== null) {
         this.stopWatching();
      }

      this.watchId = navigator.geolocation.watchPosition(
         (position) => {
            this.currentPosition = position;
            onSuccess(position);
            this.checkNearbyCheckpoints(position);
         },
         onError,
         { ...defaultOptions, ...options }
      );
   }

   // Stop watching location
   stopWatching() {
      if (this.watchId !== null) {
         navigator.geolocation.clearWatch(this.watchId);
         this.watchId = null;
      }
   }

   // Set checkpoints to monitor
   setCheckpoints(checkpoints) {
      this.checkpoints = checkpoints.map((cp) => ({
         ...cp,
         completed: cp.is_within_geofence || false
      }));
   }

   // Set callback for when checkpoint is reached
   setCheckpointCallback(callback) {
      this.onCheckpointReached = callback;
   }

   // Check distance to checkpoints
   checkNearbyCheckpoints(position) {
      const { latitude, longitude } = position.coords;
      const GEOFENCE_RADIUS = 5; // meters

      this.checkpoints.forEach((checkpoint) => {
         if (checkpoint.completed) return;

         const distance = this.calculateDistance(latitude, longitude, checkpoint.latitude, checkpoint.longitude);

         if (distance <= GEOFENCE_RADIUS && this.onCheckpointReached) {
            checkpoint.completed = true;
            this.onCheckpointReached(checkpoint);
         }
      });
   }

   // Haversine formula to calculate distance
   calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
   }

   // Get current position
   getCurrentPosition() {
      return new Promise((resolve, reject) => {
         navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
         });
      });
   }
}

// Singleton instance
export const geolocationService = new GeolocationService();
