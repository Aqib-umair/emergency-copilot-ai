'use client';

import React, { useEffect, useState } from 'react';
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

interface Hospital {
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
  className: 'hue-rotate-[150deg] saturate-200' // Make it red-ish using tailwind filters if supported, or just use custom icon
});

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function HospitalMap({ onHospitalsUpdate }: { onHospitalsUpdate?: (h: Hospital[]) => void }) {
  const [location, setLocation] = useState<[number, number]>([51.505, -0.09]); // Default to London, will update with Geolocation
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation([latitude, longitude]);
          fetchHospitals(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location", error);
          // Fallback location
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const fetchHospitals = async (lat: number, lon: number) => {
    setLoading(true);
    // Overpass API to find nearby hospitals (radius 5000m)
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:5000, ${lat}, ${lon});
        way["amenity"="hospital"](around:5000, ${lat}, ${lon});
        relation["amenity"="hospital"](around:5000, ${lat}, ${lon});
      );
      out center;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    try {
      const res = await fetch(url);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.warn("Failed to parse hospitals JSON (likely rate limited). Response was:", text.substring(0, 100));
        setHospitals([]);
        setLoading(false);
        return;
      }
      
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI/180);
        const dLon = (lon2 - lon1) * (Math.PI/180); 
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
      };

      if (!data || !data.elements) {
        setHospitals([]);
        return;
      }

      let results: Hospital[] = data.elements.map((el: any) => {
        const hLat = el.lat || el.center?.lat;
        const hLon = el.lon || el.center?.lon;
        const dist = hLat && hLon ? getDistance(lat, lon, hLat, hLon) : 999;
        
        return {
          id: el.id,
          name: el.tags?.name || 'Unknown Hospital',
          lat: hLat,
          lon: hLon,
          tags: el.tags,
          distance: dist
        };
      }).filter((h: Hospital) => h.lat && h.lon);

      // Sort by distance
      results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setHospitals(results);
      if (onHospitalsUpdate) onHospitalsUpdate(results);
    } catch (error) {
      console.warn("Failed to fetch hospitals", error);
    } finally {
      setLoading(false);
    }
  };

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
}
