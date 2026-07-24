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

const getCategory = (hospital: any) => {
  const textToSearch = [
    hospital.name,
    hospital.address,
    hospital.categories?.join(','),
    hospital.datasource?.raw?.fclass,
    hospital.datasource?.raw?.amenity,
    hospital.formatted
  ].filter(Boolean).join(' ').toLowerCase();

  const pharmacyKeywords = ['pharmacy', 'medical store', 'medical shop', 'apollo pharmacy', 'medplus', 'wellness forever', 'drug store', 'chemist'];
  const emergencyKeywords = ['government hospital', 'trauma centre', 'emergency centre', 'medical college hospital', 'district hospital', 'emergency', 'urgent', 'trauma'];

  if (pharmacyKeywords.some(kw => textToSearch.includes(kw))) return 'pharmacies';
  if (emergencyKeywords.some(kw => textToSearch.includes(kw))) return 'emergency centres';
  return 'hospitals';
};

export default function HospitalFinderPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const caseId = useEmergencyStore((state) => state.caseId);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All Medical');
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

  const topHospitals = useMemo(() => {
    if (activeFilter === 'All Medical') return hospitals;
    return hospitals.filter(h => getCategory(h) === activeFilter.toLowerCase());
  }, [hospitals, activeFilter]);

  // Frontend-triggered fetch for Pharmacies if none found in existing dataset
  useEffect(() => {
    if (activeFilter === 'Pharmacies' && topHospitals.length === 0 && location && !loading && !geoError) {
      setLoading(true);
      const [lat, lon] = location;
      // Overpass API query for pharmacies within 5km
      const overpassQuery = `[out:json];node(around:5000,${lat},${lon})[amenity=pharmacy];out 15;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 8000);
      const startTime = performance.now();

      fetch(url, { signal: abortController.signal })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.elements && data.elements.length > 0) {
            const newPharmacies = data.elements.map((el: any) => {
              // Calculate distance in km
              const R = 6371;
              const dLat = (el.lat - lat) * (Math.PI / 180);
              const dLon = (el.lon - lon) * (Math.PI / 180);
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * (Math.PI / 180)) * Math.cos(el.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              
              return {
                id: el.id,
                name: el.tags?.name || 'Pharmacy',
                lat: el.lat,
                lon: el.lon,
                distance: dist,
                address: el.tags?.['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:city'] || ''}` : '',
                categories: ['healthcare.pharmacy'] // Add category to ensure getCategory matches
              };
            });
            // Append, deduplicate by name+coords, and sort
            setHospitals(prev => {
              const combined = [...prev, ...newPharmacies];
              const deduplicated = combined.filter((h: any, index: number, self: any[]) => 
                index === self.findIndex((t) => t.name === h.name && t.lat === h.lat)
              );
              return deduplicated.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            });
          }
        })
        .catch(err => {
          console.error("Overpass API error:", err);
          setGeoError("Unable to load nearby pharmacies. Please try again.");
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLoading(false);
          console.log(`[Overpass API] Request duration: ${(performance.now() - startTime).toFixed(2)}ms`);
        });
    }
  }, [activeFilter, topHospitals.length, location, loading, geoError]);

  return (
    <main className="flex-1 relative w-full h-[100dvh] pt-[64px] md:pt-[72px] overflow-hidden flex flex-col md:flex-row bg-[var(--color-surface)]">
      
      {/* Map Section */}
      <div className="relative w-full basis-[60%] md:basis-[70%] md:flex-none z-0 flex flex-col">
        {location && !geoError ? (
          <HospitalMap 
            location={location} 
            hospitals={topHospitals} 
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
          {/* Header */}
          <div className="bg-[var(--color-surface)]/90 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-[var(--color-outline-variant)] pointer-events-auto transition-all">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-xl md:text-2xl font-[family-name:var(--font-heading)] font-bold text-[var(--color-primary)]">Emergency Copilot</h1>
              {location && (
                <button 
                  onClick={requestLocation}
                  disabled={loading}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] transition-colors disabled:opacity-50 shadow-sm"
                  aria-label="Refresh Location"
                >
                  <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
                    my_location
                  </span>
                </button>
              )}
            </div>
          </div>
          
          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
            {['All Medical', 'Hospitals', 'Pharmacies', 'Emergency Centres'].map(filter => {
              const isActive = activeFilter === filter;
              return (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative whitespace-nowrap px-4 py-2 pb-2.5 rounded-full text-sm font-bold border transition-all duration-300 shadow-sm ${
                    isActive 
                      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]' 
                      : 'bg-[var(--color-surface)]/90 backdrop-blur-md text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)]'
                  }`}
                >
                  {filter}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--color-on-primary)] rounded-full animate-fade-in transition-all duration-300"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Overlays */}
        <div className="absolute top-4 left-4 z-50 hidden">
           {/* Legacy back button removed in favor of floating action buttons */}
        </div>
      </div>

      {/* Sidebar / Bottom Sheet Section */}
      <div className="relative w-full flex-1 z-30 flex flex-col md:basis-[30%] md:flex-none md:bg-[var(--color-surface)] md:border-l md:border-[var(--color-outline-variant)] bg-[var(--color-surface)] rounded-t-[32px] md:rounded-none -mt-6 md:mt-0 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-2xl transition-all">
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-12 h-1.5 bg-[var(--color-outline-variant)] rounded-full"></div>
        </div>

        <div className="flex flex-col h-full overflow-hidden p-4 pt-2 md:pt-6">
          
          <div className="flex justify-between items-center mb-[var(--spacing-stack-md)] shrink-0 px-2">
            <h2 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] font-bold">🏥 Nearby Emergency Facilities</h2>
            <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] bg-[var(--color-surface-container-high)] px-3 py-1 rounded-full text-[var(--color-on-surface)] font-bold shadow-inner">{hospitals.length} Results</span>
          </div>

          <div className="flex-1 overflow-y-auto px-2 scrollbar-hide pb-24 md:pb-6">
            {loading ? (
              // Premium Loading State
              <div className="w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in mt-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 border-4 border-[var(--color-primary)]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[var(--color-primary)] rounded-full border-t-transparent animate-spin"></div>
                  <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-[var(--color-primary)] text-[24px]">local_hospital</span>
                </div>
                <h3 className="font-bold text-lg text-[var(--color-on-surface)]">Finding nearby emergency facilities...</h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-2">Searching within 5 km radius</p>
              </div>
            ) : geoError ? (
               <div className="text-center p-8 text-[var(--color-on-surface-variant)] mt-6">
                <span className="material-symbols-outlined text-[48px] mb-2 text-[var(--color-error)]">warning</span>
                <p className="font-bold text-[var(--color-error)] text-lg">Unable to fetch facilities.</p>
                <p className="text-sm mt-2 max-w-[250px] mx-auto">{geoError}</p>
                <button onClick={requestLocation} className="mt-6 px-6 py-2 bg-[var(--color-surface-container-high)] rounded-full font-bold text-[var(--color-on-surface)]">Retry Search</button>
              </div>
            ) : topHospitals.length > 0 ? (
              topHospitals.map((h, i) => {
                const dist = h.distance || 0;
                const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                const carMin = Math.ceil((dist / 40) * 60);
                const bikeMin = Math.ceil((dist / 15) * 60);
                
                // Determine Category (Mocking backend response via name)
                const lowerName = h.name.toLowerCase();
                let category = 'hospital';
                let iconName = 'local_hospital';
                let iconColor = 'text-[var(--color-error)]';
                let bgLight = 'bg-[var(--color-error)]/10';

                if (lowerName.includes('pharmacy') || lowerName.includes('chemist')) {
                  category = 'pharmacy';
                  iconName = 'local_pharmacy';
                  iconColor = 'text-green-600';
                  bgLight = 'bg-green-100';
                } else if (lowerName.includes('emergency') || lowerName.includes('urgent')) {
                  category = 'emergency';
                  iconName = 'emergency';
                  iconColor = 'text-orange-500';
                  bgLight = 'bg-orange-100';
                }

                // Mock rating
                const rating = (4.0 + (h.id.toString().charCodeAt(0) % 10) / 10).toFixed(1);

                const isNearest = i === 0;
                const isSelected = selectedHospitalId === h.id;

                return (
                  <div 
                    key={h.id} 
                    ref={(el) => { listRefs.current[h.id] = el; }}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`group border rounded-3xl p-5 mb-4 relative overflow-hidden transition-all cursor-pointer shadow-sm
                      ${isSelected 
                        ? 'bg-[var(--color-surface)] border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10 shadow-md scale-[1.02]' 
                        : 'bg-[var(--color-surface)]/80 backdrop-blur-md border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/40 hover:shadow-md hover:bg-[var(--color-surface)]'
                      }
                      ${isNearest && !isSelected ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/50 to-transparent' : ''}
                    `}
                  >
                    {isNearest && (
                      <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <span className="relative flex h-2 w-2 mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-950 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950"></span>
                        </span>
                        Nearest
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${bgLight} ${iconColor}`}>
                        <span className="material-symbols-outlined text-[24px]">{iconName}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-base text-[var(--color-on-surface)] line-clamp-2 leading-tight pr-12">
                          {h.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-bold">
                          <span className="flex items-center text-amber-500">
                            <span className="material-symbols-outlined text-[14px] mr-0.5">star</span>
                            {rating}
                          </span>
                          <span className="text-[var(--color-outline)]">•</span>
                          <span className="text-[var(--color-on-surface-variant)]">{distStr}</span>
                        </div>
                      </div>
                    </div>

                    {h.address && (
                      <div className="text-[var(--color-on-surface-variant)] text-xs mb-3 line-clamp-1 font-medium bg-[var(--color-surface-container)]/50 p-2 rounded-lg flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {h.address}
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-outline-variant)]/50">
                      <button 
                        className="flex-1 h-10 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors font-bold shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`);
                        }}
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        {carMin}m
                      </button>
                      <button 
                        className="flex-1 h-10 bg-transparent border-2 border-[var(--color-outline)] text-[var(--color-on-surface)] rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-[var(--color-surface-container)] hover:border-[var(--color-on-surface)] transition-all font-bold"
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
                );
              })
            ) : (
              // Empty State
              <div className="w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in mt-6">
                <div className="w-24 h-24 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-[48px] text-[var(--color-outline)]">explore_off</span>
                </div>
                <h3 className="font-bold text-xl text-[var(--color-on-surface)] mb-2">No facilities found</h3>
                <p className="text-[var(--color-on-surface-variant)] mb-6 text-sm max-w-[250px]">
                  There are no emergency facilities found within a 5 km radius of your location.
                </p>
                <button 
                  onClick={requestLocation} 
                  className="px-6 py-3 bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] rounded-full font-bold transition-colors shadow-sm"
                >
                  Expand Search Radius
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Global Action Buttons */}
      <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3 md:top-6 md:bottom-auto">
        <button 
          onClick={() => router.push('/first-aid-timeline')}
          className="h-12 w-12 md:w-auto md:px-5 rounded-full bg-[var(--color-surface)]/90 backdrop-blur-md shadow-lg flex items-center justify-center text-[var(--color-on-surface)] hover:bg-[var(--color-surface)] border border-[var(--color-outline-variant)] transition-all font-bold group"
        >
          <span className="material-symbols-outlined text-[20px] md:mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="hidden md:inline">Back</span>
        </button>
        <button 
          onClick={() => router.push('/medical-summary')}
          className="h-12 px-6 rounded-full bg-[var(--color-primary)] shadow-[0_8px_24px_rgba(0,40,142,0.4)] flex items-center justify-center text-[var(--color-on-primary)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] hover:shadow-[0_8px_24px_rgba(0,40,142,0.6)] transition-all duration-300 gap-2 font-bold tracking-wide hover:-translate-y-1"
        >
          Summary Report
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
      </div>

    </main>
  );
}
