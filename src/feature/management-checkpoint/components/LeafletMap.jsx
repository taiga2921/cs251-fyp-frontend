import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { normalizeCoordinate } from '../utils/coordinateUtils';

/** Read-only checkpoint map with radius circle (view page). */
export default function LeafletMap({ checkpoint }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [isMapDragging, setIsMapDragging] = useState(false);

  const lat = normalizeCoordinate(checkpoint?.latitude, 'latitude', { asNumber: true });
  const lng = normalizeCoordinate(checkpoint?.longitude, 'longitude', { asNumber: true });
  const radius = Number(checkpoint?.radius) > 0 ? Number(checkpoint.radius) : 20;

  useEffect(() => {
    if (!window.L || !mapContainerRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return undefined;
    }

    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { dragging: true, scrollWheelZoom: true }).setView([lat, lng], 17);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker([lat, lng], { draggable: false }).addTo(mapRef.current);
      circleRef.current = L.circle([lat, lng], {
        radius,
        color: '#1976d2',
        fillColor: '#1976d2',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(mapRef.current);

      mapRef.current.on('dragstart', () => setIsMapDragging(true));
      mapRef.current.on('dragend', () => setIsMapDragging(false));
    } else {
      markerRef.current?.setLatLng([lat, lng]);
      circleRef.current?.setLatLng([lat, lng]);
      circleRef.current?.setRadius(radius);
    }

    return undefined;
  }, [lat, lng, radius]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return <Alert severity="info">No valid coordinates to display on the map.</Alert>;
  }

  if (!window.L) {
    return <Alert severity="warning">Map library is not loaded.</Alert>;
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Drag the map to pan. The circle shows the checkpoint radius.
      </Typography>
      <Box
        ref={mapContainerRef}
        className={isMapDragging ? 'checkpoint-map-view checkpoint-map-view--dragging' : 'checkpoint-map-view'}
        sx={{
          height: 400,
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          '& .leaflet-container': {
            cursor: 'grab'
          },
          '&.checkpoint-map-view--dragging .leaflet-container': {
            cursor: 'grabbing'
          }
        }}
      />
    </Box>
  );
}
