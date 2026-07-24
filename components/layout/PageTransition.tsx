'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  backPath?: string;
  nextPath?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
  hideBack?: boolean;
}

export default function PageTransition({ 
  children, 
  backPath, 
  nextPath, 
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  hideNext = false,
  hideBack = false
}: PageTransitionProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (nextPath) {
      router.push(nextPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex-1 flex flex-col relative w-full h-full"
    >
      {/* Top Left Back Button */}
      {!hideBack && (
        <div className="absolute top-2 left-[var(--spacing-margin-mobile)] z-20">
          <button 
            onClick={handleBack}
            className="flex items-center gap-1 text-[var(--color-primary)] font-medium hover:opacity-80 transition-opacity bg-[var(--color-surface)]/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-[var(--color-outline-variant)]"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            <span className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)]">Back</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-full pb-24">
        {children}
      </div>

      {/* Bottom Right Next Button */}
      {!hideNext && (
        <div className="fixed bottom-[var(--spacing-margin-mobile)] left-[var(--spacing-margin-mobile)] right-[var(--spacing-margin-mobile)] md:left-auto md:right-[var(--spacing-margin-mobile)] z-50 flex justify-center md:justify-end">
          <button 
            onClick={handleNext}
            disabled={nextDisabled}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold px-6 py-4 md:py-3 w-full md:w-auto rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
          >
            <span className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] tracking-wide uppercase">{nextLabel}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward_ios</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
