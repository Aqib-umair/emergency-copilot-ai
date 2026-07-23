'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const caseId = useEmergencyStore((state) => state.caseId);

  const fetchHospitals = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    const cacheKey = `hospitals_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setHospitals(parsed);
        setLoading(false);
        return;
      } catch (e) {
        // Fallback if parsing fails
      }
    }

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
      let data = JSON.parse(text);
      
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI/180);
        const dLon = (lon2 - lon1) * (Math.PI/180); 
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; 
      };

      if (!data || !data.elements) {
        setHospitals([]);
        return;
      }

      let results = data.elements.map((el: any) => {
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
      }).filter((h: any) => h.lat && h.lon);

      results.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
      setHospitals(results);
      sessionStorage.setItem(cacheKey, JSON.stringify(results));
      
      if (caseId && results.length > 0) {
        const payload = results.map((h: any) => ({
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
    } catch (error) {
      console.warn("Failed to fetch hospitals", error);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

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
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [fetchHospitals]);

  const topHospitals = useMemo(() => hospitals.slice(0, 5), [hospitals]);

  return (
    <main className="flex-1 relative w-full h-[calc(100vh-var(--spacing-touch-target-min))] overflow-hidden flex flex-col md:flex-row pt-[var(--spacing-touch-target-min)]">
      
      {/* Map Section */}
      <div className="absolute inset-0 z-0 md:relative md:w-2/3 md:h-full lg:w-3/4">
        {location ? (
          <HospitalMap location={location} hospitals={hospitals} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] flex-col gap-4">
            <span className="material-symbols-outlined text-[48px] animate-spin text-[var(--color-primary)]">progress_activity</span>
            <p className="font-bold">Determining location...</p>
          </div>
        )}
        
        {/* Search & Filters Overlay (Floating on map) */}
        <div className="absolute top-4 left-0 w-full z-20 px-[var(--spacing-margin-mobile)] md:px-6 flex flex-col gap-[var(--spacing-stack-sm)] md:max-w-md">
          {/* Search Bar */}
          <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[var(--color-outline-variant)] flex items-center h-[56px] px-4">
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
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="whitespace-nowrap px-4 h-10 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] font-semibold flex items-center gap-2 border border-[var(--color-primary-container)] shadow-sm">
              <span className="material-symbols-outlined text-[18px]">done</span>
              All Medical
            </button>
            <button className="whitespace-nowrap px-4 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-on-surface)] font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center gap-2 border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors shadow-sm">
              Emergency
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
      <div className="absolute bottom-0 left-0 w-full z-30 flex flex-col justify-end h-[60%] pointer-events-none md:relative md:h-full md:w-1/3 lg:w-1/4 md:pointer-events-auto md:bg-[var(--color-surface)] md:border-l md:border-[var(--color-outline-variant)] md:shadow-xl">
        <div className="bg-[var(--color-surface)] rounded-t-3xl md:rounded-none shadow-[0_-8px_24px_rgba(0,0,0,0.1)] md:shadow-none border-t md:border-t-0 border-[var(--color-outline-variant)] p-4 pt-6 pointer-events-auto flex flex-col h-full overflow-hidden">
          
          <div className="flex justify-between items-center mb-[var(--spacing-stack-md)] shrink-0">
            <h2 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] font-bold">Nearest Help</h2>
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
            ) : topHospitals.length > 0 ? (
              topHospitals.map((h, i) => {
                const dist = h.distance || 0;
                const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                const walkMin = Math.round((dist / 5) * 60);
                const carMin = Math.round((dist / 40) * 60);

                return (
                  <div key={h.id} className="bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden">
                    {i === 0 && <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-error)]"></div>}
                    <div className="flex justify-between items-start mb-2 mt-1 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-[family-name:var(--font-headline-sm)] text-[length:var(--font-headline-sm)] text-[var(--color-on-surface)] font-bold line-clamp-2 leading-tight">
                          {h.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-[var(--color-on-surface-variant)] font-[family-name:var(--font-body-sm)] text-[length:var(--font-body-sm)] font-medium">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          <span>{distStr} away</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] font-bold">Est. Time</div>
                        <div className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-error)] font-black">{carMin} min</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 border-t border-[var(--color-outline-variant)]/50 pt-3 mt-3">
                      <button 
                        className="flex-1 h-[44px] bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-1 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors font-bold shadow-sm"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`)}
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        Navigate
                      </button>
                      <button 
                        className="flex-1 h-[44px] border-2 border-[var(--color-outline)] text-[var(--color-on-surface)] rounded-xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-1 hover:bg-[var(--color-surface-container-highest)] transition-colors font-bold"
                        onClick={() => window.open('tel:112')}
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
                <p className="font-bold">No hospitals found nearby.</p>
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
