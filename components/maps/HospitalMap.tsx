'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Custom Icons using SVG
const createCustomIcon = (color: string, scale: number = 1, isSelected: boolean = false) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="${24 * scale}" height="${32 * scale}">
      <path fill="${color}" d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
    </svg>`;
  return L.divIcon({
    className: `custom-leaflet-icon transition-transform duration-300 ${isSelected ? '-translate-y-2 drop-shadow-xl' : 'drop-shadow-md'}`,
    html: svgString,
    iconSize: [24 * scale, 32 * scale],
    iconAnchor: [12 * scale, 32 * scale],
    popupAnchor: [0, -32 * scale],
  });
};

const userIcon = createCustomIcon('#0ea5e9', 1.2); // blue for user
const hospitalIcon = createCustomIcon('#ef4444', 1.0); // red for hospital
const selectedHospitalIcon = createCustomIcon('#ef4444', 1.5, true); // larger red for selected

function FitBounds({ location, hospitals }: { location: [number, number], hospitals: Hospital[] }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    const bounds = L.latLngBounds([location]);
    hospitals.forEach(h => bounds.extend([h.lat, h.lon]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [location, hospitals, map]);
  return null;
}

const HospitalMap = React.memo(function HospitalMap({ location, hospitals, selectedHospitalId, onHospitalSelect }: HospitalMapProps) {
  const mapRef = useRef<L.Map>(null);

  return (
    <div className="relative w-full flex-1">
      {/* Recenter Button Overlay */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (mapRef.current) {
            mapRef.current.setView(location, 14, { animate: true });
          }
        }}
        className="absolute top-4 right-4 z-[1000] bg-[var(--color-surface)] w-12 h-12 rounded-full shadow-lg border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] flex items-center justify-center transition-colors cursor-pointer"
        title="Recenter to My Location"
      >
        <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">my_location</span>
      </button>

      <MapContainer ref={mapRef} center={location} zoom={13} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds location={location} hospitals={hospitals} />

        {/* User Location */}
        <Marker position={location} icon={userIcon}>
          <Popup className="custom-popup font-[family-name:var(--font-body-md)]">
            <div className="font-bold text-center text-[var(--color-primary)]">📍 Your Location</div>
          </Popup>
        </Marker>

        {/* Hospitals */}
        {hospitals.map(h => {
          const isSelected = selectedHospitalId === h.id;
          const dist = h.distance || 0;
          const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
          const carMin = Math.ceil((dist / 40) * 60);
          const bikeMin = Math.ceil((dist / 15) * 60);

          return (
            <Marker 
              key={h.id} 
              position={[h.lat, h.lon]} 
              icon={isSelected ? selectedHospitalIcon : hospitalIcon}
              eventHandlers={{
                click: () => onHospitalSelect?.(h.id)
              }}
            >
              <Popup className="custom-popup min-w-[220px]" closeButton={false}>
                <div className="flex flex-col gap-2 p-1 font-[family-name:var(--font-body-md)]">
                  <h3 className="font-bold text-base leading-tight m-0 text-[var(--color-on-surface)]">{h.name}</h3>
                  {h.address && <p className="text-xs text-[var(--color-on-surface-variant)] m-0 line-clamp-2 leading-snug">{h.address}</p>}
                  
                  <div className="flex items-center gap-3 mt-1 text-sm font-medium">
                    <span className="text-[var(--color-on-surface-variant)]">📍 {distStr}</span>
                    <span className="text-[var(--color-error)]" title="By Car">🚗 {carMin}m</span>
                    <span className="text-[var(--color-primary)]" title="By Bike">🚲 {bikeMin}m</span>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      className="flex-1 bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs py-2 rounded-lg font-bold text-center hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors cursor-pointer border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`);
                      }}
                    >
                      Navigate
                    </button>
                    <button 
                      className="flex-1 bg-transparent border border-[var(--color-outline)] text-[var(--color-on-surface)] text-xs py-2 rounded-lg font-bold text-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open('tel:112');
                      }}
                    >
                      Call ER
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
