import { useEffect, useRef } from 'react';

// Replace this with your real API key
const TOMTOM_API_KEY = 'Kfhd93svGN7ZIc4HnT335iNIm0qixSiy';

const TomTomMap = ({ routeData }) => {
  const mapElement = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!routeData || routeData.length === 0) return;

    const tt = window.tt; // assuming SDK loaded globally
    mapRef.current = tt.map({
      key: TOMTOM_API_KEY,
      container: mapElement.current,
      center: [parseFloat(routeData[0].longitude), parseFloat(routeData[0].latitude)],
      zoom: 17
    });

    const coordinates = routeData.map((point) => [parseFloat(point.longitude), parseFloat(point.latitude)]);

    // Create GeoJSON LineString for the route
    const routeGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };

    mapRef.current.on('load', () => {
      // Add the route line
      mapRef.current.addSource('patrolRoute', {
        type: 'geojson',
        data: routeGeoJSON
      });

      mapRef.current.addLayer({
        id: 'patrolRouteLine',
        type: 'line',
        source: 'patrolRoute',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF0000',
          'line-width': 4
        }
      });

      // Fit map bounds to the route
      const bounds = coordinates.reduce((b, coord) => b.extend(coord), new tt.LngLatBounds(coordinates[0], coordinates[0]));
      mapRef.current.fitBounds(bounds, { padding: 50 });

      // Add START marker (S)
      new tt.Marker({ color: '#00FF00' }) // optional color
        .setLngLat(coordinates[0])
        .setPopup(new tt.Popup({ offset: 25 }).setText('S'))
        .addTo(mapRef.current);

      // Add END marker (E)
      new tt.Marker({ color: '#FF0000' }) // optional color
        .setLngLat(coordinates[coordinates.length - 1])
        .setPopup(new tt.Popup({ offset: 25 }).setText('E'))
        .addTo(mapRef.current);
    });

    return () => mapRef.current && mapRef.current.remove();
  }, [routeData]);

  return <div ref={mapElement} style={{ width: '100%', height: '500px' }} />;
};

export default TomTomMap;
