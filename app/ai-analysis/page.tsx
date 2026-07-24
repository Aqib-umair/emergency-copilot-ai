'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import PageTransition from '../../components/layout/PageTransition';

const messages = [
  'Analyzing symptoms...',
  'Assessing urgency...',
  'Preparing guidance...',
  'Finding nearby hospitals...'
];

export default function AiAnalysisLoadingPage() {
  const router = useRouter();
  const { patientDetails, emergencyDescription, setAiResults } = useEmergencyStore();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (hasError) return;

    // Message Cycling
    const messageInterval = setInterval(() => {
      setOpacity(0);
      setTimeout(() => {
        setCurrentMessageIndex((prev) => Math.min(prev + 1, messages.length - 1));
        setOpacity(1);
      }, 500);
    }, 2500);

    // Progress Bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 2;
      });
    }, 100);

    // API Call
    const analyzeEmergency = async () => {
      try {
        const caseId = useEmergencyStore.getState().caseId;
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientDetails,
            emergencyDescription,
            caseId,
            language: 'en' // Get from i18n in real implementation
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn("Failed to parse JSON. Response was:", text);
          throw new Error("Invalid response format from server");
        }

        if (response.ok && data?.success !== false) {
          setAiResults(data);
          setProgress(100);
          setTimeout(() => {
            router.push('/analysis-results');
          }, 500);
        } else {
          console.warn("API error", data);
          setHasError(true);
          setErrorText(data?.message || data?.error || "Failed to analyze emergency.");
        }
      } catch (err: any) {
        console.warn(err);
        setHasError(true);
        setErrorText(err.message || "An unexpected error occurred.");
      }
    };

    analyzeEmergency();

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [patientDetails, emergencyDescription, router, setAiResults, hasError]);

  if (hasError) {
    return (
      <main className="bg-[var(--color-surface)] flex-1 flex flex-col items-center justify-center relative overflow-hidden z-20 w-full">
        <div className="z-10 w-full max-w-md px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[var(--color-error-container)] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[var(--color-error)]">error</span>
          </div>
          <h1 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] mb-2">
            Analysis Failed
          </h1>
          <p className="text-[var(--color-on-surface-variant)] mb-8">
            {errorText}
          </p>
          <div className="flex gap-4 w-full justify-center">
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-full border border-[var(--color-outline)] text-[var(--color-on-surface)] font-medium hover:bg-[var(--color-surface-container)]"
            >
              End
            </button>
            <button 
              onClick={() => router.push('/analysis-results')}
              className="px-6 py-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] font-medium hover:opacity-90"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    );
  }
  return (
    <PageTransition hideNext hideBack>
      <div className="bg-[var(--color-surface)] flex-1 flex flex-col items-center justify-center relative overflow-hidden z-20 w-full rounded-2xl">
        {/* Ambient Background Lighting */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none" 
          style={{ background: 'radial-gradient(circle at 50% 40%, rgba(220, 233, 255, 0.4) 0%, rgba(248, 249, 255, 0) 70%)' }}
        ></div>

        <div className="z-10 w-full max-w-md px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)] flex flex-col items-center justify-center text-center">
          {/* Animation Cluster */}
          <div className="relative w-40 h-40 mb-[var(--spacing-stack-lg)] flex items-center justify-center">
            {/* Expanding Ambient Rings */}
            <div className="absolute inset-0 rounded-full border border-[var(--color-primary-fixed)] animate-ring-expand"></div>
            <div className="absolute inset-0 rounded-full border border-[var(--color-primary-fixed)] animate-ring-expand" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-0 rounded-full border border-[var(--color-primary-fixed)] animate-ring-expand" style={{ animationDelay: '2s' }}></div>
            
            {/* Central Hub */}
            <div className="relative z-10 w-24 h-24 bg-[var(--color-primary-fixed)] rounded-full flex items-center justify-center animate-clinical-pulse shadow-sm border border-white">
              <div className="w-16 h-16 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[36px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  monitor_heart
                </span>
              </div>
            </div>
            
            {/* Orbiting AI Indicator */}
            <div className="absolute top-0 right-0 z-20 animate-float-sparkle">
              <div className="bg-[var(--color-surface)] rounded-full p-2 shadow-md border border-[var(--color-surface-variant)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="flex flex-col items-center min-h-[96px] w-full">
            <h1 
              className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] md:text-[length:var(--font-headline-lg)] lg:text-5xl text-[var(--color-on-surface)] mb-[var(--spacing-stack-sm)] transition-opacity duration-500 font-bold"
              style={{ opacity }}
            >
              {messages[currentMessageIndex]}
            </h1>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mt-2">
              <span className="material-symbols-outlined text-[20px] md:text-[24px] animate-spin">
                progress_activity
              </span>
              <p className="font-[family-name:var(--font-body-md)] text-[length:var(--font-body-md)] md:text-[length:var(--font-body-lg)]">
                Please do not close this app
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full max-w-[240px] mt-[var(--spacing-stack-lg)]">
            <div className="h-1.5 w-full bg-[var(--color-surface-variant)] rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-fixed)] rounded-full transition-all duration-[100ms] ease-linear" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
