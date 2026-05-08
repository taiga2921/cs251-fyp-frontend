// components/LeafletMap.js
import React, { useEffect, useRef } from 'react';

const LeafletMap = ({ checkpoint }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Check if Leaflet is loaded
    if (!window.L) {
      console.error('Leaflet not loaded. Check CDN scripts.');
      return;
    }

    // Initialize map only once
    if (!mapRef.current && mapContainer.current) {
      // Create map instance
      mapRef.current = window.L.map(mapContainer.current).setView([`${checkpoint.latitude}`, `${checkpoint.longitude}`], 18);

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add marker
      markerRef.current = window.L.marker([`${checkpoint.latitude}`, `${checkpoint.longitude}`]).addTo(mapRef.current);
      // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      // .openPopup();
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainer} style={{ height: '500px', width: '100%' }} />;
};

export default LeafletMap;
