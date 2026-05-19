import { useEffect, useRef } from 'react';
import { Alert, Box } from '@mui/material';

/** Read-only checkpoint map with radius circle (view page). */
export default function LeafletMap({ checkpoint }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const lat = Number(checkpoint?.latitude);
  const lng = Number(checkpoint?.longitude);
  const radius = Number(checkpoint?.radius) > 0 ? Number(checkpoint.radius) : 20;

  useEffect(() => {
    if (!window.L || !mapContainerRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined;
    }

    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      L.marker([lat, lng]).addTo(mapRef.current);
      L.circle([lat, lng], {
        radius,
        color: '#1976d2',
        fillColor: '#1976d2',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(mapRef.current);
    }

    return undefined;
  }, [lat, lng, radius]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <Alert severity="info">No valid coordinates to display on the map.</Alert>;
  }

  if (!window.L) {
    return <Alert severity="warning">Map library is not loaded.</Alert>;
  }

  return <Box ref={mapContainerRef} sx={{ height: 400, width: '100%', borderRadius: 2, overflow: 'hidden' }} />;
}
