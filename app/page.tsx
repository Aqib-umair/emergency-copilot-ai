'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import PageTransition from '../components/layout/PageTransition';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <PageTransition 
      hideBack={true} 
      nextLabel={t('home.helpButton', 'START')} 
      nextPath="/patient-details"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-[var(--spacing-margin-mobile)] relative z-10 w-full h-full pb-10 pt-6 md:pt-0">
        {/* Hero Section: Animated Help Button */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto relative">
          <div className="relative flex items-center justify-center w-64 h-64 mb-8">
            {/* Background ambient ripple */}
            <div className="ripple-bg"></div>
            <div className="ripple-bg" style={{ animationDelay: '1.5s' }}></div>
            
            {/* Main Interactive Button */}
            <button 
              onClick={() => router.push('/patient-details')}
              className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg flex flex-col items-center justify-center btn-breathe hover:brightness-110 active:scale-95 transition-all duration-150 border-4 border-[var(--color-surface-container-highest)]"
            >
              <span className="text-5xl mb-2">🚑</span>
              <span className="font-[family-name:var(--font-headline-lg-mobile)] text-[length:var(--font-headline-lg-mobile)] font-bold tracking-wider">
                {t('home.helpButton', 'HELP')}
              </span>
            </button>
          </div>
          
          {/* Instruction Text */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <p className="text-[length:var(--font-body-lg)] font-[family-name:var(--font-body-lg)] text-[var(--color-on-surface-variant)] font-medium">
              {t('home.instruction1', 'Press the button for immediate AI-guided assistance.')}
            </p>
            <div className="bg-[var(--color-error-container)]/30 border border-[var(--color-error-container)] rounded-lg p-4 mt-8 shadow-sm">
              <p className="text-[length:var(--font-body-md)] font-[family-name:var(--font-body-md)] text-[var(--color-error)] flex items-center justify-center font-medium">
                <span className="material-symbols-outlined mr-2">warning</span>
                {t('home.instruction2', 'In case of severe bleeding, unconsciousness, or chest pain, call emergency services (112 / 911) immediately.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
