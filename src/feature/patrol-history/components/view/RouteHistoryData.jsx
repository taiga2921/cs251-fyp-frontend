import React from 'react';
import { Box, Chip, Divider, Grid, Paper, Stack, styled, Typography, List, ListItem, ListItemText } from '@mui/material';
import TomTomMap from '../LeafletMap'; // Import the map component

const Item = styled(Box)(({ theme }) => ({
   ...theme.typography.body2,
   padding: theme.spacing(1),
   textAlign: 'center',
   color: theme.palette.text.secondary
}));

const Title = styled(Typography)(({ theme }) => ({
   fontWeight: 700,
   letterSpacing: 1.2,
   fontSize: '0.85rem',
   background: `linear-gradient(135deg, ${theme.palette.secondary.main} 100%, ${theme.palette.secondary.light} 100%)`,
   WebkitBackgroundClip: 'text',
   WebkitTextFillColor: 'transparent',
   backgroundClip: 'text',
   marginBottom: 20
}));

export function RouteHistoryData({ info, isMobile, routeData = [] }) {
   // Calculate route statistics
   const calculateRouteStats = () => {
      if (routeData.length < 2) return null;

      let totalDistance = 0;
      for (let i = 1; i < routeData.length; i++) {
         const prev = routeData[i - 1];
         const curr = routeData[i];

         // Haversine formula for distance calculation
         const R = 6371e3; // meters
         const φ1 = (parseFloat(prev.latitude) * Math.PI) / 180;
         const φ2 = (parseFloat(curr.latitude) * Math.PI) / 180;
         const Δφ = ((parseFloat(curr.latitude) - parseFloat(prev.latitude)) * Math.PI) / 180;
         const Δλ = ((parseFloat(curr.longitude) - parseFloat(prev.longitude)) * Math.PI) / 180;

         const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

         totalDistance += R * c;
      }

      return {
         totalPoints: routeData.length,
         totalDistance: (totalDistance / 1000).toFixed(2), // in km
         startTime: routeData[0]?.created_at,
         endTime: routeData[routeData.length - 1]?.created_at
      };
   };

   const routeStats = calculateRouteStats();

   return (
      <>
         <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Title>Guard Patrol Route</Title>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
               Route Visualization
            </Typography>
            {/* Pass routeData to TomTomMap */}
            <TomTomMap routeData={routeData} />
         </Paper>
      </>
   );
}
