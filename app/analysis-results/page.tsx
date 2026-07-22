'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import PageTransition from '../../components/layout/PageTransition';
import TopAppBar from '../../components/layout/TopAppBar';

export default function AnalysisResultsPage() {
  const router = useRouter();
  const { aiResults } = useEmergencyStore();

  if (!aiResults) {
    // If no results, navigate back to description
    if (typeof window !== 'undefined') {
      router.push('/emergency-description');
    }
    return null;
  }

  const {
    urgencyLevel,
    confidenceScore,
    simpleExplanation,
    nextSteps,
  } = aiResults;

  const isCritical = urgencyLevel === 'CRITICAL' || urgencyLevel === 'HIGH';
  
  const getUrgencyConfig = () => {
    switch (urgencyLevel) {
      case 'CRITICAL':
        return {
          bgClass: 'bg-[var(--color-error-container)]',
          borderClass: 'border-[var(--color-error)]/20',
          textColor: 'text-[var(--color-error)]',
          iconColor: 'text-[var(--color-error)]',
          titleColor: 'text-[var(--color-on-error-container)]',
          icon: 'warning',
          title: 'Immediate Action Required',
          pulse: 'pulse-ring'
        };
      case 'HIGH':
        return {
          bgClass: 'bg-[var(--color-error-container)]',
          borderClass: 'border-[var(--color-error)]/20',
          textColor: 'text-[var(--color-error)]',
          iconColor: 'text-[var(--color-error)]',
          titleColor: 'text-[var(--color-on-error-container)]',
          icon: 'warning',
          title: 'High Urgency',
          pulse: 'pulse-ring'
        };
      case 'MEDIUM':
        return {
          bgClass: 'bg-[var(--color-tertiary-container)]',
          borderClass: 'border-[var(--color-tertiary)]/20',
          textColor: 'text-[var(--color-tertiary)]',
          iconColor: 'text-[var(--color-tertiary)]',
          titleColor: 'text-[var(--color-on-tertiary-container)]',
          icon: 'error',
          title: 'Moderate Urgency',
          pulse: ''
        };
      case 'LOW':
      default:
        return {
          bgClass: 'bg-[var(--color-secondary-container)]',
          borderClass: 'border-[var(--color-secondary)]/20',
          textColor: 'text-[var(--color-secondary)]',
          iconColor: 'text-[var(--color-secondary)]',
          titleColor: 'text-[var(--color-on-secondary-container)]',
          icon: 'info',
          title: 'Low Urgency',
          pulse: ''
        };
    }
  };

  const renderGauge = () => {
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const index = Math.max(0, levels.indexOf(urgencyLevel));
    // Colors: Blue for Low, Yellow for Medium, Orange for High, Red for Critical
    const activeColorClass = index === 0 ? 'text-[#3b82f6]' : index === 1 ? 'text-[#eab308]' : index === 2 ? 'text-[#f97316]' : 'text-[#ef4444]';
    
    // Circumference of r=40 is 2 * PI * 40 = 251.2
    const dashoffset = 251.2 - ((index + 1) * 251.2 / 4);

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-[var(--color-surface-variant)]" />
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeDasharray="251.2" 
            strokeDashoffset={dashoffset} 
            className={`${activeColorClass} transition-all duration-1000 ease-out origin-center -rotate-90`} 
            strokeLinecap="round" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-[10px] uppercase text-[var(--color-on-surface-variant)]">Danger</span>
          <span className={`font-black text-xl ${activeColorClass}`}>{index + 1}/4</span>
        </div>
      </div>
    );
  };

  const uConfig = getUrgencyConfig();

  return (
    <PageTransition
      backPath="/emergency-description"
      nextPath="/first-aid-timeline"
      nextLabel="First Aid Guide"
    >
      <div className="flex-grow w-full max-w-5xl mx-auto flex flex-col gap-[var(--spacing-stack-md)] px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] pt-4">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--spacing-stack-md)]">
          
          {/* Primary Risk Card (Full Width) */}
          <div className={`col-span-1 md:col-span-12 relative overflow-hidden rounded-3xl ${uConfig.bgClass} border ${uConfig.borderClass} shadow-sm p-6 flex flex-col md:flex-row items-center md:justify-between gap-[var(--spacing-stack-md)] text-center md:text-left transition-transform hover:shadow-md`}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${uConfig.textColor}/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none`}></div>
            
            <div className="flex flex-col items-center md:items-start gap-[var(--spacing-stack-sm)] z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {uConfig.pulse && (
                    <div className={`absolute inset-0 ${uConfig.textColor} rounded-full animate-[pulse-ring_3s_infinite_cubic-bezier(0.215,0.61,0.355,1)] opacity-20`}></div>
                  )}
                  <span className={`material-symbols-outlined ${uConfig.iconColor} relative z-10`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {uConfig.icon}
                  </span>
                </div>
                <span className={`font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] ${uConfig.textColor} uppercase tracking-wider font-bold`}>
                  {urgencyLevel} URGENCY
                </span>
              </div>
              <h2 className={`font-[family-name:var(--font-headline-xl)] text-[length:var(--font-headline-xl)] ${uConfig.titleColor} font-black`}>
                {uConfig.title}
              </h2>
              <div className="mt-2 inline-flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[var(--color-outline-variant)] shadow-sm">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-on-surface)] font-semibold">
                  {confidenceScore}% AI Confidence
                </span>
              </div>
            </div>

            <div className="z-10 flex flex-col items-center justify-center mt-4 md:mt-0 bg-[var(--color-surface-container-lowest)]/50 rounded-2xl p-2 backdrop-blur-sm border border-[var(--color-outline-variant)]/50 shadow-inner">
              {renderGauge()}
            </div>
          </div>

          {/* Explanation Card (Left Column) */}
          <div className="col-span-1 md:col-span-8 rounded-3xl bg-[var(--color-surface-container-lowest)] shadow-sm border border-[var(--color-outline-variant)]/30 p-6 flex flex-col gap-[var(--spacing-stack-sm)] hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2 border-b border-[var(--color-outline-variant)]/20 pb-3">
              <span className="material-symbols-outlined text-[var(--color-primary)]">medical_information</span>
              <h3 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] font-bold">Clinical Assessment</h3>
            </div>
            <p className="font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] leading-relaxed">
              {simpleExplanation}
            </p>
            <div className="mt-4 bg-[var(--color-surface-container)] rounded-2xl p-4 flex gap-3 shadow-inner">
              <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] mt-0.5">info</span>
              <p className="font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] text-[var(--color-on-surface-variant)]">
                This is an AI-generated preliminary assessment. Do not delay seeking professional medical evaluation. Time is critical.
              </p>
            </div>
          </div>

          {/* Preparation / Protocol Card (Right Column) */}
          <div className="col-span-1 md:col-span-4 rounded-3xl bg-[var(--color-surface-container-low)] shadow-sm border border-[var(--color-outline-variant)]/20 p-6 flex flex-col gap-[var(--spacing-stack-sm)]">
            <h3 className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] mb-2 font-bold tracking-wide">Immediate Steps</h3>
            <ul className="flex flex-col gap-3">
              {nextSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 items-start bg-[var(--color-surface-container-lowest)] p-4 rounded-2xl border border-[var(--color-outline-variant)]/10 shadow-sm">
                  <span className="material-symbols-outlined text-[var(--color-secondary)] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {idx === 0 ? 'airline_seat_recline_normal' : idx === 1 ? 'medication' : 'lock_open'}
                  </span>
                  <div>
                    <span className="block font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] text-[var(--color-on-surface)] font-bold mb-1">
                      Step {idx + 1}
                    </span>
                    <span className="block font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] text-[var(--color-on-surface-variant)] text-sm">
                      {step}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action Buttons (Moved from Bottom Bar) */}
          <div className="col-span-1 md:col-span-12 flex flex-col sm:flex-row gap-4 mt-4">
            <button 
              className="flex-1 min-h-[56px] bg-[var(--color-error)] hover:bg-[var(--color-on-error-container)] text-[var(--color-on-error)] rounded-2xl font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-[0.98] font-bold tracking-wide"
              onClick={() => window.open('tel:112')}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>phone_in_talk</span>
              Call Emergency Services
            </button>
            
            <button 
              className="flex-1 min-h-[56px] bg-[var(--color-surface-container-highest)] hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface)] rounded-2xl font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] flex justify-center items-center gap-2 shadow-sm transition-transform active:scale-[0.98] border border-[var(--color-outline-variant)] font-bold tracking-wide"
              onClick={() => router.push('/hospital-finder')}
            >
              <span className="material-symbols-outlined">local_hospital</span>
              Find Hospitals
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
