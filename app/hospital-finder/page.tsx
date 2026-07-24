'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useEmergencyStore } from '../../store/useEmergencyStore';

const HospitalMap = dynamic(() => import('../../components/maps/HospitalMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]">Loading Map...</div>
});

export default function HospitalFinderPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const caseId = useEmergencyStore((state) => state.caseId);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | number | null>(null);
  const listRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (selectedHospitalId && listRefs.current[selectedHospitalId]) {
      listRefs.current[selectedHospitalId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedHospitalId]);

  const fetchHospitals = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setGeoError(null);
    const cacheKey = `hospitals_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        setHospitals(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }

    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch hospitals from server.');
      }

      const response = await res.json();
      
      if (!response.success || !response.data) {
         throw new Error(response.message || 'Unknown error occurred.');
      }

      if (response.data.length === 0) {
        setHospitals([]);
        return;
      }

      setHospitals(response.data);
      sessionStorage.setItem(cacheKey, JSON.stringify(response.data));
      
      if (caseId && response.data.length > 0) {
        const payload = response.data.map((h: any) => ({
          patient_case_id: caseId,
          hospital_name: h.name,
          latitude: h.lat,
          longitude: h.lon,
          distance: h.distance || null
        }));
        supabase.from('hospital_searches').insert(payload).then(({ error }) => {
          if (error) console.error("Supabase Insert Error (hospital_searches):", error);
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch hospitals:", error);
      setGeoError(error.message || "Unable to retrieve nearby medical facilities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setGeoError(null);
    if (navigator.geolocation) {
      console.log("Requesting browser geolocation...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Geolocation successful:", latitude, longitude);
          setLocation([latitude, longitude]);
          fetchHospitals(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unknown location error";
          if (error.code === 1) errorMessage = "Location permission denied. Please enable location services in your browser settings.";
          else if (error.code === 2) errorMessage = "Location unavailable. Please check your signal or network.";
          else if (error.code === 3) errorMessage = "Location request timed out. Please try again.";
          setGeoError(errorMessage);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setGeoError("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, [fetchHospitals]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const topHospitals = useMemo(() => hospitals, [hospitals]);

  return (
    <main className="flex-1 relative w-full h-[calc(100vh-var(--spacing-touch-target-min))] overflow-hidden flex flex-col md:flex-row pt-[var(--spacing-touch-target-min)]">
      
      {/* Map Section */}
      <div className="relative w-full h-[65%] md:w-2/3 md:h-full lg:w-3/4 z-0">
        {location && !geoError ? (
          <HospitalMap 
            location={location} 
            hospitals={hospitals} 
            selectedHospitalId={selectedHospitalId}
            onHospitalSelect={setSelectedHospitalId}
          />
        ) : geoError ? (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] flex-col gap-4 p-6 text-center">
            <span className="material-symbols-outlined text-[64px] text-[var(--color-error)]">location_disabled</span>
            <p className="font-bold text-[var(--color-error)] text-lg max-w-md">{geoError}</p>
            <button onClick={requestLocation} className="mt-4 px-8 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full font-bold shadow-md hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined">refresh</span>
              Retry Location
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] flex-col gap-4">
            <span className="material-symbols-outlined text-[48px] animate-spin text-[var(--color-primary)]">progress_activity</span>
            <p className="font-bold">Determining location...</p>
          </div>
        )}
        
        {/* Search & Filters Overlay (Floating on map) */}
        <div className="absolute top-4 left-0 w-full z-20 px-[var(--spacing-margin-mobile)] md:px-6 flex flex-col gap-[var(--spacing-stack-sm)] md:max-w-md pointer-events-none">
          {/* Search Bar */}
          <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[var(--color-outline-variant)] flex items-center h-[56px] px-4 pointer-events-auto">
            <span className="material-symbols-outlined text-[var(--color-outline)] mr-3">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 font-[family-name:var(--font-body-md)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] p-0 outline-none" 
              placeholder="Search facilities..." 
              type="text"
            />
            <button aria-label="Voice Search" className="ml-2 p-2 rounded-full hover:bg-[var(--color-surface-container-high)] transition-colors">
              <span className="material-symbols-outlined text-[var(--color-primary)]">mic</span>
            </button>
          </div>
          
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
            <button onClick={requestLocation} className="whitespace-nowrap px-4 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-on-surface)] font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center gap-2 border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">my_location</span>
              Refresh
            </button>
            <button className="whitespace-nowrap px-4 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] font-semibold flex items-center gap-2 border border-[var(--color-primary-container)] shadow-sm">
              <span className="material-symbols-outlined text-[18px]">done</span>
              All Medical
            </button>
          </div>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <button 
            onClick={() => router.push('/first-aid-timeline')}
            className="h-12 w-12 rounded-full bg-[var(--color-surface)] shadow-md flex items-center justify-center text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
      </div>

      {/* Sidebar / Bottom Sheet Section */}
      <div className="relative w-full h-[35%] z-30 flex flex-col md:h-full md:w-1/3 lg:w-1/4 md:bg-[var(--color-surface)] md:border-l md:border-[var(--color-outline-variant)] md:shadow-xl bg-[var(--color-surface)]">
        <div className="flex flex-col h-full overflow-hidden p-4 pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] md:shadow-none border-t md:border-t-0 border-[var(--color-outline-variant)]">
          
          <div className="flex justify-between items-center mb-[var(--spacing-stack-md)] shrink-0">
            <h2 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] font-bold">🏥 Nearby Hospitals</h2>
            <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-outline)] font-bold">{hospitals.length} Results</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-20 md:pb-6">
            {loading ? (
              // Skeleton Loaders
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-2xl p-4 mb-4 animate-pulse">
                  <div className="h-5 bg-[var(--color-surface-variant)] rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-[var(--color-surface-variant)] rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-[var(--color-surface-variant)] rounded-xl w-full"></div>
                </div>
              ))
            ) : geoError ? (
               <div className="text-center p-8 text-[var(--color-on-surface-variant)]">
                <span className="material-symbols-outlined text-[48px] mb-2 text-[var(--color-error)]">warning</span>
                <p className="font-bold text-[var(--color-error)]">Unable to fetch hospitals.</p>
                <p className="text-sm mt-2">{geoError}</p>
              </div>
            ) : topHospitals.length > 0 ? (
              topHospitals.map((h, i) => {
                const dist = h.distance || 0;
                const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                const carMin = Math.ceil((dist / 40) * 60);
                const bikeMin = Math.ceil((dist / 15) * 60);

                return (
                  <div 
                    key={h.id} 
                    ref={(el) => { listRefs.current[h.id] = el; }}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`bg-[var(--color-surface-bright)] border rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden transition-all cursor-pointer ${
                      selectedHospitalId === h.id 
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-md' 
                        : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-error)]"></div>}
                    <div className="flex justify-between items-start mb-2 mt-1 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-[family-name:var(--font-headline-sm)] text-[length:var(--font-headline-sm)] text-[var(--color-on-surface)] font-bold line-clamp-2 leading-tight">
                          {h.name}
                        </h3>
                        {h.address && (
                          <div className="text-[var(--color-on-surface-variant)] text-xs mt-1 line-clamp-1 opacity-80 font-medium">
                            {h.address}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-[var(--color-on-surface-variant)] font-[family-name:var(--font-body-sm)] text-[length:var(--font-body-sm)] font-medium">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          <span>{distStr} away</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-on-surface)] font-bold">Est. Time</div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-[var(--color-error)] font-black text-sm" title="By Car">
                            <span className="material-symbols-outlined text-[16px]">directions_car</span>
                            {carMin}m
                          </div>
                          <div className="flex items-center gap-1 text-[var(--color-primary)] font-bold text-sm" title="By Bike">
                            <span className="material-symbols-outlined text-[16px]">pedal_bike</span>
                            {bikeMin}m
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 border-t border-[var(--color-outline-variant)]/50 pt-3 mt-3">
                      <button 
                        className="flex-1 h-[44px] bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-1 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors font-bold shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        Navigate
                      </button>
                      <button 
                        className="flex-1 h-[44px] border-2 border-[var(--color-outline)] text-[var(--color-on-surface)] rounded-xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-1 hover:bg-[var(--color-surface-container-highest)] transition-colors font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('tel:112');
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                        Call ER
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-8 text-[var(--color-on-surface-variant)]">
                <span className="material-symbols-outlined text-[48px] mb-2 text-[var(--color-outline)]">location_off</span>
                <p className="font-bold">No medical facilities found nearby.</p>
                <button onClick={requestLocation} className="mt-4 px-6 py-2 border border-[var(--color-outline)] text-[var(--color-on-surface)] rounded-full font-bold">Retry</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Global Action Buttons */}
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-3 md:top-4 md:bottom-auto">
        <button 
          onClick={() => router.push('/first-aid-timeline')}
          className="h-12 px-4 rounded-full bg-[var(--color-surface)] shadow-md flex items-center justify-center text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] transition-colors font-bold hidden md:flex gap-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button 
          onClick={() => router.push('/medical-summary')}
          className="h-12 px-6 rounded-full bg-[var(--color-primary)] shadow-[0_4px_12px_rgba(0,40,142,0.3)] flex items-center justify-center text-[var(--color-on-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] transition-all duration-200 gap-2 font-bold tracking-wide"
        >
          Summary Report
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </div>

    </main>
  );
}
