'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export interface Hospital {
  id: string | number;
  name: string;
  address?: string;
  lat: number;
  lon: number;
  distance?: number;
}

interface HospitalMapProps {
  location: [number, number];
  hospitals: Hospital[];
  selectedHospitalId?: string | number | null;
  onHospitalSelect?: (id: string | number) => void;
}

const getCategory = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('pharmacy') || lower.includes('chemist') || lower.includes('apothecary')) return 'pharmacy';
  if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('trauma')) return 'emergency';
  return 'hospital';
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'pharmacy': return '#22c55e'; // Green
    case 'emergency': return '#f97316'; // Orange
    case 'hospital': default: return '#ef4444'; // Red
  }
};

// Custom Icons using SVG
const createCustomIcon = (color: string, scale: number = 1, isSelected: boolean = false) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="${24 * scale}" height="${32 * scale}">
      <path fill="${color}" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
    </svg>`;
  return L.divIcon({
    className: `custom-leaflet-icon transition-all duration-300 ${isSelected ? '-translate-y-3 scale-110 drop-shadow-2xl z-[1000]' : 'drop-shadow-md hover:-translate-y-1'}`,
    html: svgString,
    iconSize: [24 * scale, 32 * scale],
    iconAnchor: [12 * scale, 32 * scale],
    popupAnchor: [0, -32 * scale],
  });
};

const userIcon = createCustomIcon('#0ea5e9', 1.2); // blue for user

function MapController({ location, hospitals, selectedHospitalId }: { location: [number, number], hospitals: Hospital[], selectedHospitalId?: string | number | null }) {
  const map = useMap();
  
  // Fit bounds on mount
  useEffect(() => {
    if (!location) return;
    const bounds = L.latLngBounds([location]);
    hospitals.forEach(h => bounds.extend([h.lat, h.lon]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [location, hospitals, map]); // Run once when hospitals load

  // Fly to selected hospital
  useEffect(() => {
    if (selectedHospitalId) {
      const selected = hospitals.find(h => h.id === selectedHospitalId);
      if (selected) {
        map.flyTo([selected.lat, selected.lon], 16, { animate: true, duration: 1 });
      }
    }
  }, [selectedHospitalId, hospitals, map]);

  return null;
}

const HospitalMap = React.memo(function HospitalMap({ location, hospitals, selectedHospitalId, onHospitalSelect }: HospitalMapProps) {
  const mapRef = useRef<L.Map>(null);

  const nearestHospital = useMemo(() => {
    return hospitals.length > 0 ? hospitals.reduce((prev, curr) => (prev.distance || 0) < (curr.distance || 0) ? prev : curr) : null;
  }, [hospitals]);

  const nearestDistStr = nearestHospital && nearestHospital.distance !== undefined 
    ? (nearestHospital.distance < 1 ? `${(nearestHospital.distance * 1000).toFixed(0)} m` : `${nearestHospital.distance.toFixed(1)} km`) 
    : '';

  return (
    <div className="relative w-full flex-1 bg-[var(--color-surface-container)]">
      {/* Nearest Hospital Badge Overlay */}
      {nearestHospital && (
        <div 
          onClick={() => onHospitalSelect?.(nearestHospital.id)}
          className="absolute top-4 left-4 z-[1000] bg-[var(--color-surface)]/90 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-[var(--color-outline-variant)] flex items-center gap-3 cursor-pointer hover:bg-[var(--color-surface)] transition-all animate-fade-in group"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center text-[var(--color-error)] group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">emergency</span>
          </div>
          <div className="pr-2">
            <div className="text-[10px] uppercase font-black text-[var(--color-error)] tracking-widest flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-error)]"></span>
              </span>
              Nearest Hospital
            </div>
            <div className="font-bold text-sm text-[var(--color-on-surface)] line-clamp-1 mt-0.5">{nearestHospital.name}</div>
            <div className="text-xs font-medium text-[var(--color-on-surface-variant)] mt-0.5">Distance: {nearestDistStr}</div>
          </div>
        </div>
      )}

      {/* Recenter Button Overlay */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (mapRef.current) {
            mapRef.current.flyTo(location, 15, { animate: true, duration: 1 });
            onHospitalSelect?.(''); // Clear selection
          }
        }}
        className="absolute bottom-6 right-4 z-[1000] bg-[var(--color-surface)] w-14 h-14 rounded-full shadow-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="Recenter to My Location"
      >
        <span className="material-symbols-outlined text-[var(--color-primary)] text-[28px]">my_location</span>
      </button>

      <MapContainer 
        ref={mapRef} 
        center={location} 
        zoom={13} 
        zoomControl={false} // Disable default to add our own
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        <ZoomControl position="bottomright" />
        <MapController location={location} hospitals={hospitals} selectedHospitalId={selectedHospitalId} />

        {/* User Location */}
        <Marker position={location} icon={userIcon} zIndexOffset={1000}>
          <Tooltip permanent direction="top" className="font-bold text-[var(--color-primary)] border-none shadow-md bg-[var(--color-surface)]/90 backdrop-blur-md rounded-full px-3 py-1">
            📍 You Are Here
          </Tooltip>
        </Marker>

        {/* Hospitals */}
        {hospitals.map(h => {
          const isSelected = selectedHospitalId === h.id;
          const category = getCategory(h.name);
          const color = getCategoryColor(category);
          
          const icon = createCustomIcon(color, isSelected ? 1.4 : 1.0, isSelected);
          
          const dist = h.distance || 0;
          const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
          const carMin = Math.ceil((dist / 40) * 60);
          const bikeMin = Math.ceil((dist / 15) * 60);

          return (
            <Marker 
              key={h.id} 
              position={[h.lat, h.lon]} 
              icon={icon}
              zIndexOffset={isSelected ? 500 : 0}
              eventHandlers={{
                click: () => onHospitalSelect?.(h.id)
              }}
            >
              <Popup className="custom-popup min-w-[240px]" closeButton={false}>
                <div className="flex flex-col gap-2 p-1 font-[family-name:var(--font-body-md)]">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="material-symbols-outlined text-[20px]" style={{ color }}>
                      {category === 'pharmacy' ? 'local_pharmacy' : category === 'emergency' ? 'emergency' : 'local_hospital'}
                    </span>
                    <h3 className="font-bold text-base leading-tight m-0 text-[var(--color-on-surface)] flex-1">{h.name}</h3>
                  </div>
                  
                  {h.address && <p className="text-xs text-[var(--color-on-surface-variant)] m-0 line-clamp-2 leading-snug">{h.address}</p>}
                  
                  <div className="flex items-center gap-3 mt-2 mb-1 text-sm font-medium bg-[var(--color-surface-container)] p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-[var(--color-on-surface-variant)]">
                      <span className="material-symbols-outlined text-[16px]">straighten</span> {distStr}
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-error)]" title="By Car">
                      <span className="material-symbols-outlined text-[16px]">directions_car</span> {carMin}m
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-primary)]" title="By Bike">
                      <span className="material-symbols-outlined text-[16px]">pedal_bike</span> {bikeMin}m
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      className="flex-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm py-2.5 rounded-xl font-bold text-center hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`);
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">directions</span>
                      Navigate
                    </button>
                    <button 
                      className="flex-1 bg-transparent border-2 border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm py-2.5 rounded-xl font-bold text-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer flex items-center justify-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open('tel:112');
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      Call
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
});

export default HospitalMap;
