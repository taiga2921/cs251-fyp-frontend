import { useEffect, useRef } from 'react';
import { Alert, Box, Typography } from '@mui/material';

import { DEFAULT_MAP_CENTER } from '../utils/checkpointConstants';

/**
 * Interactive Leaflet map: click/drag marker, radius circle synced with form.
 */
export default function CheckpointMapPicker({
  latitude,
  longitude,
  radius,
  onCoordinatesChange,
  coordinateError
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const lat = Number.isFinite(latitude) ? latitude : DEFAULT_MAP_CENTER.latitude;
  const lng = Number.isFinite(longitude) ? longitude : DEFAULT_MAP_CENTER.longitude;
  const radiusM = Number(radius) > 0 ? Number(radius) : 20;

  useEffect(() => {
    if (!window.L || !mapContainerRef.current) {
      return undefined;
    }

    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { scrollWheelZoom: true }).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      const emitCoords = (nextLat, nextLng) => {
        onCoordinatesChange?.({
          latitude: Number(nextLat.toFixed(7)),
          longitude: Number(nextLng.toFixed(7))
        });
      };

      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        emitCoords(pos.lat, pos.lng);
        if (circleRef.current) {
          circleRef.current.setLatLng(pos);
        }
      });

      mapRef.current.on('click', (event) => {
        const { lat: clickLat, lng: clickLng } = event.latlng;
        markerRef.current.setLatLng([clickLat, clickLng]);
        emitCoords(clickLat, clickLng);
        if (circleRef.current) {
          circleRef.current.setLatLng([clickLat, clickLng]);
        }
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusM);
    } else if (mapRef.current) {
      circleRef.current = L.circle([lat, lng], {
        radius: radiusM,
        color: '#1976d2',
        fillColor: '#1976d2',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(mapRef.current);
    }

    mapRef.current.setView([lat, lng], mapRef.current.getZoom());

    return undefined;
  }, [lat, lng, radiusM, onCoordinatesChange]);

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

  if (!window.L) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Map library is not loaded. Ensure Leaflet scripts are included in index.html.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Click the map or drag the marker to set coordinates. The circle shows the checkpoint radius.
      </Typography>
      <Box
        ref={mapContainerRef}
        sx={{
          height: 360,
          width: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: coordinateError ? 'error.main' : 'divider',
          overflow: 'hidden'
        }}
      />
      {coordinateError ? (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {coordinateError}
        </Typography>
      ) : null}
    </Box>
  );
}
