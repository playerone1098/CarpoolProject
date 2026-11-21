import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Define modern SVG icons to avoid Leaflet static asset loading issues
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        border: 2px solid #ffffff;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #09090b;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-leaflet-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const pickupIcon = createCustomIcon('#6366f1'); // Indigo
const dropIcon = createCustomIcon('#10b981');   // Emerald

interface MapComponentProps {
  pickupCoords?: { lat: number; lng: number } | null;
  dropCoords?: { lat: number; lng: number } | null;
  onSelectCoords?: (type: 'pickup' | 'drop', coords: { lat: number; lng: number }) => void;
  selectionMode?: 'pickup' | 'drop' | null;
  readonly?: boolean;
}

// Map Click Handler component to capture click events in React Leaflet
const MapClickHandler: React.FC<{
  onMapClick: (coords: { lat: number; lng: number }) => void;
  enabled: boolean;
}> = ({ onMapClick, enabled }) => {
  useMapEvents({
    click(e) {
      if (enabled) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
};

// Component to dynamically fit bounds of selected points
const MapBoundsFitter: React.FC<{
  points: Array<[number, number]>;
}> = ({ points }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  pickupCoords,
  dropCoords,
  onSelectCoords,
  selectionMode,
  readonly = false
}) => {
  const defaultCenter: [number, number] = [28.6139, 77.2090]; // Centered at New Delhi (Default)

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (onSelectCoords && selectionMode) {
      onSelectCoords(selectionMode, coords);
    }
  };

  const pointsToFit: Array<[number, number]> = [];
  if (pickupCoords) pointsToFit.push([pickupCoords.lat, pickupCoords.lng]);
  if (dropCoords) pointsToFit.push([dropCoords.lat, dropCoords.lng]);

  const hasRoute = pickupCoords && dropCoords;
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (pickupCoords && dropCoords) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates;
              const path: [number, number][] = coords.map((c: number[]) => [c[1], c[0]]);
              setRoutePoints(path);
            } else {
              setRoutePoints([[pickupCoords.lat, pickupCoords.lng], [dropCoords.lat, dropCoords.lng]]);
            }
          } else {
            setRoutePoints([[pickupCoords.lat, pickupCoords.lng], [dropCoords.lat, dropCoords.lng]]);
          }
        } catch (e) {
          console.error('Error fetching route from OSRM:', e);
          setRoutePoints([[pickupCoords.lat, pickupCoords.lng], [dropCoords.lat, dropCoords.lng]]);
        }
      };
      fetchRoute();
    } else {
      setRoutePoints([]);
    }
  }, [pickupCoords, dropCoords]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={pickupCoords ? [pickupCoords.lat, pickupCoords.lng] : defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Modern Minimalist Dark Map
        />

        {!readonly && selectionMode && (
          <MapClickHandler onMapClick={handleMapClick} enabled={!!selectionMode} />
        )}

        {pickupCoords && (
          <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}>
            <Popup>
              <strong>Pickup Location</strong>
            </Popup>
          </Marker>
        )}

        {dropCoords && (
          <Marker position={[dropCoords.lat, dropCoords.lng]} icon={dropIcon}>
            <Popup>
              <strong>Destination / Drop-off</strong>
            </Popup>
          </Marker>
        )}

        {hasRoute && routePoints.length > 0 && (
          <>
            <Polyline positions={routePoints} color="#6366f1" weight={4} opacity={0.85} />
            <MapBoundsFitter points={pointsToFit} />
          </>
        )}
      </MapContainer>
      
      {!readonly && selectionMode && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(9, 9, 11, 0.95)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          Tap map to place {selectionMode === 'pickup' ? 'Pickup' : 'Drop-off'} marker
        </div>
      )}
    </div>
  );
};

export default MapComponent;
