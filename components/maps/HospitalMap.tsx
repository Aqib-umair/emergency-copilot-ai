'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface Hospital {
  id: number;
  name: string;
  lat: number;
  lon: number;
  tags?: any;
  distance?: number;
}

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[150deg] saturate-200' 
});

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface HospitalMapProps {
  location: [number, number];
  hospitals: Hospital[];
}

const HospitalMap = React.memo(function HospitalMap({ location, hospitals }: HospitalMapProps) {
  return (
    <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
      <MapController center={location} zoom={13} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Location */}
      <Marker position={location}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Hospitals */}
      {hospitals.map(h => (
        <Marker key={h.id} position={[h.lat, h.lon]} icon={customIcon}>
          <Popup>
            <strong>{h.name}</strong><br />
            {h.tags?.['emergency'] === 'yes' ? 'Emergency Dept Available' : 'No Emergency Info'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});

export default HospitalMap;
