'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const HospitalMap = dynamic(() => import('../../components/maps/HospitalMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]">Loading Map...</div>
});

export default function HospitalFinderPage() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);

  return (
    <main className="flex-1 relative w-full h-screen overflow-hidden flex flex-col md:max-w-[428px] md:mx-auto md:border-x md:border-[var(--color-outline-variant)] md:shadow-lg pt-[var(--spacing-touch-target-min)]">
      
      {/* Map Canvas (Full screen underneath) */}
      <div className="absolute inset-0 z-0">
        <HospitalMap onHospitalsUpdate={setHospitals} />
      </div>

      {/* Search & Filters Overlay */}
      <div className="absolute top-[var(--spacing-touch-target-min)] left-0 w-full z-20 px-[var(--spacing-margin-mobile)] pt-4 flex flex-col gap-[var(--spacing-stack-sm)] md:max-w-[428px]">
        
        {/* Search Bar */}
        <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[var(--color-outline-variant)] flex items-center h-[56px] px-4">
          <span className="material-symbols-outlined text-[var(--color-outline)] mr-3">search</span>
          <input 
            className="flex-1 bg-transparent border-none focus:ring-0 font-[family-name:var(--font-body-md)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] p-0 outline-none" 
            placeholder="Search facilities or addresses..." 
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
          <button className="whitespace-nowrap px-4 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-on-surface)] font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center gap-2 border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors shadow-sm">
            Pharmacy
          </button>
        </div>
      </div>

      {/* Draggable Card Stack (Bottom) */}
      <div className="absolute bottom-[calc(72px)] left-0 w-full z-30 px-[var(--spacing-margin-mobile)] pb-[var(--spacing-margin-mobile)] flex flex-col justify-end h-[70%] pointer-events-none md:max-w-[428px]">
        <div className="bg-[var(--color-surface)] rounded-t-3xl rounded-b-xl shadow-[0_-8px_24px_rgba(0,0,0,0.1)] border border-[var(--color-outline-variant)] p-4 pointer-events-auto flex flex-col max-h-full overflow-y-auto drag-handle">
          
          <div className="flex justify-between items-center mb-[var(--spacing-stack-md)]">
            <h2 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] font-bold">Nearest Help</h2>
            <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-outline)] font-bold">{hospitals.length} Results</span>
          </div>

          {hospitals.slice(0, 5).map((h, i) => {
            const dist = h.distance || 0;
            const distStr = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
            
            // Estimates (Speed in km/h)
            const walkMin = Math.round((dist / 5) * 60);
            const bikeMin = Math.round((dist / 15) * 60);
            const carMin = Math.round((dist / 40) * 60);

            const formatTime = (mins: number) => {
              if (mins < 1) return '1 min';
              if (mins >= 60) {
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return m > 0 ? `${h}h ${m}m` : `${h}h`;
              }
              return `${mins} min`;
            };

            return (
              <div key={h.id} className="bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden shrink-0">
                {/* Status Bar Top */}
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
                    <div className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-error)] font-black">{formatTime(carMin)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[var(--color-surface-container)] rounded-xl p-2 mt-2 mb-3">
                   <div className="flex items-center gap-1 text-[var(--color-on-surface-variant)] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">directions_car</span>
                      {formatTime(carMin)}
                   </div>
                   <div className="flex items-center gap-1 text-[var(--color-on-surface-variant)] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">pedal_bike</span>
                      {formatTime(bikeMin)}
                   </div>
                   <div className="flex items-center gap-1 text-[var(--color-on-surface-variant)] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                      {formatTime(walkMin)}
                   </div>
                </div>
                
                <div className="flex gap-2 border-t border-[var(--color-outline-variant)]/50 pt-3">
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
          })}

          {hospitals.length === 0 && (
            <div className="text-center p-8 text-[var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined text-[48px] animate-spin mb-2 text-[var(--color-primary)]">progress_activity</span>
              <p className="font-bold">Locating nearby hospitals...</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Overlays */}
      <div className="absolute top-4 left-4 z-50">
        <button 
          onClick={() => router.push('/first-aid-timeline')}
          className="h-12 w-12 rounded-full bg-[var(--color-surface)] shadow-md flex items-center justify-center text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] transition-colors"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>
      
      <div className="absolute bottom-4 right-4 z-50 hidden md:block">
        {/* On mobile, this might conflict with the draggable stack, so it's hidden or moved. Let's make it a nice floating button */}
        <button 
          onClick={() => router.push('/medical-summary')}
          className="h-14 px-6 rounded-full bg-[var(--color-primary)] shadow-[0_4px_12px_rgba(0,40,142,0.3)] flex items-center justify-center text-[var(--color-on-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] hover:-translate-y-1 transition-all duration-200 gap-2 font-bold tracking-wide"
        >
          Summary Report
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-50 md:hidden">
        {/* Mobile Next Button at the top right to avoid conflict with bottom sheet */}
        <button 
          onClick={() => router.push('/medical-summary')}
          className="h-12 px-4 rounded-full bg-[var(--color-primary)] shadow-md flex items-center justify-center text-[var(--color-on-primary)] hover:bg-[var(--color-on-primary-fixed-variant)] transition-all duration-200 gap-2 font-bold"
        >
          Summary
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

    </main>
  );
}
