'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import PageTransition from '../../components/layout/PageTransition';

export default function FirstAidTimelinePage() {
  const router = useRouter();
  const { aiResults } = useEmergencyStore();

  if (!aiResults) {
    if (typeof window !== 'undefined') {
      router.push('/emergency-description');
    }
    return null;
  }

  const { urgencyLevel, nextSteps, timeline, generalGuidance } = aiResults;
  const isCritical = urgencyLevel === 'CRITICAL' || urgencyLevel === 'HIGH';

  return (
    <PageTransition
      backPath="/analysis-results"
      nextPath="/hospital-finder"
      nextLabel="Find Hospitals"
    >
      <main className="flex-grow pt-4 pb-[100px] px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] max-w-[1200px] w-full mx-auto">
        {/* Header Context */}
        <header className="mb-[var(--spacing-stack-lg)]">
          {isCritical && (
            <div className="inline-flex items-center gap-2 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] px-3 py-1 rounded-full mb-[var(--spacing-stack-sm)]">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)]">High Priority Scenario</span>
            </div>
          )}
          <h1 className="font-[family-name:var(--font-headline-lg-mobile)] text-[length:var(--font-headline-lg-mobile)] md:font-[family-name:var(--font-headline-lg)] md:text-[length:var(--font-headline-lg)] text-[var(--color-on-surface)] font-black">
            First-Aid Guidance
          </h1>
          <p className="font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface-variant)] mt-[var(--spacing-stack-sm)] max-w-2xl leading-relaxed">
            {generalGuidance || "Follow these immediate steps carefully to stabilize the patient while awaiting professional medical assistance."}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-stack-lg)]">
          {/* Section 1: Numbered First-Aid Cards (Bento Layout) */}
          <section aria-label="First-Aid Steps" className="lg:col-span-8 flex flex-col gap-[var(--spacing-stack-md)]">
            <h2 className="sr-only">Step-by-Step Instructions</h2>
            
            {/* Step 1: Critical (Large Card) */}
            {nextSteps.length > 0 && (
              <div className="bg-[var(--color-surface-container-lowest)] border-l-4 border-l-[var(--color-primary)] border-y border-r border-[var(--color-outline-variant)] rounded-r-3xl rounded-l-md shadow-sm p-[var(--spacing-stack-md)] md:p-[var(--spacing-stack-lg)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[var(--color-surface-container-low)] to-transparent opacity-50 pointer-events-none"></div>
                <div className="flex gap-[var(--spacing-stack-md)] relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] font-bold shrink-0 shadow-md">
                    1
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] mb-[var(--spacing-stack-sm)] font-bold">
                      Immediate Action
                    </h3>
                    <p className="font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface-variant)]">
                      {nextSteps[0]}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bento Grid for Subsequent Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-stack-md)]">
              {nextSteps.slice(1).map((step, index) => (
                <div key={index} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-3xl p-[var(--spacing-stack-md)] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-[var(--spacing-stack-sm)]">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] flex items-center justify-center font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] font-bold shrink-0">
                      {index + 2}
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)] mb-1 font-bold">
                        Step {index + 2}
                      </h3>
                      <p className="font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] text-[var(--color-on-surface-variant)] text-sm">
                        {step}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-[var(--spacing-stack-md)]">
              {/* Secondary Actions Container */}
              <div className="flex flex-col sm:flex-row gap-[var(--spacing-stack-sm)] w-full">
                <button 
                  className="flex-1 h-[var(--spacing-touch-target-min)] px-[var(--spacing-stack-md)] bg-[var(--color-error)] text-[var(--color-on-error)] font-bold rounded-2xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-2 hover:bg-[var(--color-on-error-container)] shadow-sm transition-colors"
                  onClick={() => window.open('tel:112')}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  Call 112 / 911
                </button>
                <button 
                  className="flex-1 h-[var(--spacing-touch-target-min)] px-[var(--spacing-stack-md)] bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-2xl font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] flex items-center justify-center gap-2 hover:bg-[var(--color-surface-container-low)] transition-colors font-bold"
                  onClick={() => router.push('/medical-summary')}
                >
                  <span className="material-symbols-outlined">description</span>
                  Summary Report
                </button>
              </div>
            </div>
          </section>

          {/* Section 2: Animated Timeline */}
          <section aria-label="Progress Timeline" className="lg:col-span-4">
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-3xl p-[var(--spacing-stack-md)] md:p-[var(--spacing-stack-lg)] shadow-sm h-full">
              <h3 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] mb-[var(--spacing-stack-lg)] flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[var(--color-primary)]">schedule</span> Action Timeline
              </h3>
              <div className="relative pl-[14px]">
                {/* Vertical Track */}
                <div className="absolute left-[19px] top-[24px] bottom-[24px] w-[2px] bg-[var(--color-outline-variant)] rounded-full z-0"></div>
                
                {timeline && timeline.map((item, index) => (
                  <div key={index} className={`relative z-10 flex gap-[var(--spacing-stack-md)] ${index === 0 ? 'mb-[var(--spacing-stack-lg)]' : 'mb-[var(--spacing-stack-lg)] opacity-70'}`}>
                    {index === 0 ? (
                      <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] border-4 border-[var(--color-surface-container-lowest)] flex items-center justify-center mt-[4px] shrink-0 relative -left-[3px] animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-[var(--color-outline)] border-2 border-[var(--color-surface-container-lowest)] mt-[6px] shrink-0 relative -left-[1.5px]"></div>
                    )}
                    
                    <div className={index === 0 ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-[var(--spacing-stack-sm)] px-[var(--spacing-stack-md)] rounded-2xl w-full shadow-sm" : ""}>
                      <h4 className={`font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] ${index === 0 ? 'font-bold' : 'text-[var(--color-on-surface)] font-bold'}`}>
                        {item.time}
                      </h4>
                      <p className={`font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] text-sm mt-1 ${index === 0 ? 'opacity-90 font-medium' : 'text-[var(--color-on-surface-variant)]'}`}>
                        {item.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
