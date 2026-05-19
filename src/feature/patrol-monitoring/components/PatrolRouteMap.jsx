import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import MapLegend from './MapLegend';

const GAP_THRESHOLD_SECONDS = 30;
const LARGE_GAP_SECONDS = 300;

const CHECKPOINT_COLORS = {
  verified: '#22c55e',
  suspicious: '#f97316',
  uncertain: '#eab308',
  rejected: '#ef4444',
  pending: '#9ca3af'
};

function parseCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function routeToLatLng(route) {
  const lat = parseCoord(route?.latitude);
  const lng = parseCoord(route?.longitude);
  if (lat == null || lng == null) return null;
  return [lat, lng];
}

function recordedAtMs(route) {
  if (!route?.recorded_at) return null;
  const t = new Date(route.recorded_at).getTime();
  return Number.isFinite(t) ? t : null;
}

function detectRouteGaps(routes) {
  const gaps = [];
  for (let i = 1; i < routes.length; i += 1) {
    const prevMs = recordedAtMs(routes[i - 1]);
    const curMs = recordedAtMs(routes[i]);
    if (prevMs == null || curMs == null) continue;
    const deltaSec = (curMs - prevMs) / 1000;
    if (deltaSec > GAP_THRESHOLD_SECONDS) {
      gaps.push({
        index: i,
        from: routes[i - 1],
        to: routes[i],
        gapSeconds: Math.round(deltaSec)
      });
    }
  }
  return gaps;
}

function checkpointColor(status) {
  const key = String(status ?? 'pending').toLowerCase();
  return CHECKPOINT_COLORS[key] ?? CHECKPOINT_COLORS.pending;
}

function createPinIcon(L, label, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:#fff;
      font-size:11px;
      font-weight:700;
      padding:2px 6px;
      border-radius:4px;
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
      white-space:nowrap;
    ">${label}</div>`,
    iconSize: [48, 24],
    iconAnchor: [24, 12]
  });
}

function clearLayers(map, layers) {
  layers.forEach((layer) => {
    map.removeLayer(layer);
  });
  layers.length = 0;
}

export default function PatrolRouteMap({
  routes = [],
  checkpointEvents = [],
  loading = false,
  error = null,
  onLargeGapDetected
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);
  const trailPolylineRef = useRef(null);
  const startMarkerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const checkpointLayerMapRef = useRef(new Map());
  const initialFitDoneRef = useRef(false);
  const prevRoutesKeyRef = useRef('');

  const sortedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => {
      const ta = recordedAtMs(a) ?? 0;
      const tb = recordedAtMs(b) ?? 0;
      return ta - tb;
    });
  }, [routes]);

  const routePoints = useMemo(() => sortedRoutes.map(routeToLatLng).filter(Boolean), [sortedRoutes]);

  const gaps = useMemo(() => detectRouteGaps(sortedRoutes), [sortedRoutes]);

  const checkpointMarkers = useMemo(() => {
    return checkpointEvents
      .map((event) => {
        const lat = parseCoord(event?.checkpoint?.latitude);
        const lng = parseCoord(event?.checkpoint?.longitude);
        if (lat == null || lng == null) return null;
        return {
          id: event.id,
          lat,
          lng,
          name: event.checkpoint?.name ?? 'Checkpoint',
          status: event.status
        };
      })
      .filter(Boolean);
  }, [checkpointEvents]);

  const hasRouteData = routePoints.length > 0;
  const hasCheckpointData = checkpointMarkers.length > 0;
  const hasMapData = hasRouteData || hasCheckpointData;

  const routesKey = useMemo(
    () => sortedRoutes.map((r) => `${r.id ?? ''}:${r.recorded_at ?? ''}:${r.latitude}:${r.longitude}`).join('|'),
    [sortedRoutes]
  );

  const appendGapSegment = (L, map, fromRoute, toRoute) => {
    const from = routeToLatLng(fromRoute);
    const to = routeToLatLng(toRoute);
    if (!from || !to) return;

    const prevMs = recordedAtMs(fromRoute);
    const curMs = recordedAtMs(toRoute);
    const gapSeconds = prevMs != null && curMs != null ? Math.round((curMs - prevMs) / 1000) : 0;

    const gapLine = L.polyline([from, to], {
      color: '#f97316',
      weight: 4,
      opacity: 0.9,
      dashArray: '8, 8'
    }).addTo(map);
    layersRef.current.push(gapLine);

    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    const gapMarker = L.circleMarker([midLat, midLng], {
      radius: 6,
      color: '#f97316',
      fillColor: '#fff7ed',
      fillOpacity: 1,
      weight: 2
    })
      .bindPopup(`GPS gap: ${gapSeconds}s`)
      .addTo(map);
    layersRef.current.push(gapMarker);

    if (gapSeconds >= LARGE_GAP_SECONDS && onLargeGapDetected) {
      onLargeGapDetected(gapSeconds);
    }
  };

  const appendRoutePoint = (L, map, route, index, total) => {
    const pt = routeToLatLng(route);
    if (!pt) return;

    if (!trailPolylineRef.current) {
      trailPolylineRef.current = L.polyline([pt], {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85
      }).addTo(map);
      layersRef.current.push(trailPolylineRef.current);

      startMarkerRef.current = L.marker(pt, {
        icon: createPinIcon(L, 'Start', '#16a34a')
      })
        .bindPopup('Patrol start')
        .addTo(map);
      layersRef.current.push(startMarkerRef.current);
    } else {
      trailPolylineRef.current.addLatLng(pt);
    }

    if (index > 0 && index < total - 1) {
      const dot = L.circleMarker(pt, {
        radius: 3,
        color: '#64748b',
        fillColor: '#64748b',
        fillOpacity: 0.9,
        weight: 1
      }).addTo(map);
      layersRef.current.push(dot);
    }

    if (index > 0) {
      appendGapSegment(L, map, sortedRoutes[index - 1], route);
    }

    if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      const idx = layersRef.current.indexOf(endMarkerRef.current);
      if (idx >= 0) layersRef.current.splice(idx, 1);
    }

    endMarkerRef.current = L.marker(pt, {
      icon: createPinIcon(L, index === 0 ? 'Start' : 'End', index === 0 ? '#16a34a' : '#dc2626')
    })
      .bindPopup(index === 0 ? 'Patrol start' : 'Patrol end')
      .addTo(map);
    layersRef.current.push(endMarkerRef.current);
  };

  const syncCheckpointMarkers = (L, map) => {
    const nextIds = new Set(checkpointMarkers.map((cp) => cp.id));

    checkpointLayerMapRef.current.forEach((layer, id) => {
      if (!nextIds.has(id)) {
        map.removeLayer(layer);
        checkpointLayerMapRef.current.delete(id);
      }
    });

    checkpointMarkers.forEach((cp) => {
      const color = checkpointColor(cp.status);
      const existing = checkpointLayerMapRef.current.get(cp.id);
      if (existing) {
        map.removeLayer(existing);
      }

      const marker = L.circleMarker([cp.lat, cp.lng], {
        radius: 10,
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.95,
        weight: 3
      })
        .bindPopup(`<strong>${cp.name}</strong><br/>Status: ${cp.status ?? 'pending'}`)
        .addTo(map);

      checkpointLayerMapRef.current.set(cp.id, marker);
    });
  };

  const fullRedraw = (L, map) => {
    clearLayers(map, layersRef.current);
    trailPolylineRef.current = null;
    startMarkerRef.current = null;
    endMarkerRef.current = null;
    checkpointLayerMapRef.current.forEach((layer) => map.removeLayer(layer));
    checkpointLayerMapRef.current.clear();

    if (!hasMapData) {
      map.setView([3.139, 101.6869], 13);
      return;
    }

    const boundsPoints = [];

    if (routePoints.length > 0) {
      trailPolylineRef.current = L.polyline(routePoints, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85
      }).addTo(map);
      layersRef.current.push(trailPolylineRef.current);
      routePoints.forEach((pt) => boundsPoints.push(pt));
    }

    gaps.forEach((gap) => appendGapSegment(L, map, gap.from, gap.to));

    sortedRoutes.forEach((route, index) => {
      const pt = routeToLatLng(route);
      if (!pt) return;
      if (index > 0 && index < sortedRoutes.length - 1) {
        const dot = L.circleMarker(pt, {
          radius: 3,
          color: '#64748b',
          fillColor: '#64748b',
          fillOpacity: 0.9,
          weight: 1
        }).addTo(map);
        layersRef.current.push(dot);
      }
    });

    if (routePoints.length >= 1) {
      startMarkerRef.current = L.marker(routePoints[0], {
        icon: createPinIcon(L, 'Start', '#16a34a')
      })
        .bindPopup('Patrol start')
        .addTo(map);
      layersRef.current.push(startMarkerRef.current);
    }

    if (routePoints.length >= 2) {
      const endPoint = routePoints[routePoints.length - 1];
      endMarkerRef.current = L.marker(endPoint, {
        icon: createPinIcon(L, 'End', '#dc2626')
      })
        .bindPopup('Patrol end')
        .addTo(map);
      layersRef.current.push(endMarkerRef.current);
    }

    syncCheckpointMarkers(L, map);
    checkpointMarkers.forEach((cp) => boundsPoints.push([cp.lat, cp.lng]));

    if (!initialFitDoneRef.current && boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      initialFitDoneRef.current = true;
    }
  };

  useEffect(() => {
    if (!window.L || !mapContainerRef.current || loading || error) {
      return undefined;
    }

    if (!mapRef.current) {
      mapRef.current = window.L.map(mapContainerRef.current, {
        scrollWheelZoom: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    const L = window.L;

    const prevKey = prevRoutesKeyRef.current;
    const canIncremental =
      initialFitDoneRef.current &&
      prevKey &&
      routesKey.startsWith(prevKey) &&
      sortedRoutes.length > 0 &&
      routesKey !== prevKey;

    if (canIncremental) {
      const prevCount = prevKey.split('|').filter(Boolean).length;
      for (let i = prevCount; i < sortedRoutes.length; i += 1) {
        appendRoutePoint(L, map, sortedRoutes[i], i, sortedRoutes.length);
      }
      syncCheckpointMarkers(L, map);
    } else {
      if (routesKey !== prevKey) {
        initialFitDoneRef.current = false;
      }
      fullRedraw(L, map);
    }

    prevRoutesKeyRef.current = routesKey;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return undefined;
  }, [sortedRoutes, routePoints, gaps, checkpointMarkers, hasMapData, loading, error, routesKey, onLargeGapDetected]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = [];
        trailPolylineRef.current = null;
        startMarkerRef.current = null;
        endMarkerRef.current = null;
        checkpointLayerMapRef.current.clear();
        initialFitDoneRef.current = false;
        prevRoutesKeyRef.current = '';
      }
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!hasMapData) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No patrol route data available.
      </Typography>
    );
  }

  return (
    <Box>
      {!hasRouteData ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          No patrol route data available. Showing checkpoint locations only.
        </Typography>
      ) : null}
      <Box
        ref={mapContainerRef}
        sx={{
          height: { xs: 320, sm: 420 },
          width: '100%',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          zIndex: 0
        }}
      />
      <MapLegend gapCount={gaps.length} />
    </Box>
  );
}

PatrolRouteMap.propTypes = {
  routes: PropTypes.arrayOf(PropTypes.object),
  checkpointEvents: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onLargeGapDetected: PropTypes.func
};
