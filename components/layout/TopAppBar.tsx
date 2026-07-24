'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TopAppBar() {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const changeLanguage = (lang: string) => {
    // Set for both possible domains Google Translate might use
    document.cookie = `googtrans=/en/${lang}; path=/`;
    document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
    
    // Also use i18next just in case we have static strings
    i18n.changeLanguage(lang);
    setDropdownOpen(false);
    
    // Reload to apply Google Translate script
    window.location.reload();
  };

  return (
    <header className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dim)] border-b border-[var(--color-outline-variant)] dark:border-[var(--color-outline)] shadow-sm dark:shadow-none fixed top-0 w-full z-50 flex justify-between items-center px-[var(--spacing-margin-mobile)] pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 min-h-[64px] md:min-h-[72px]">
      {/* Leading Icon: Language */}
      <div className="relative">
        <button 
          className="flex items-center justify-center gap-1 rounded-full px-3 py-2 hover:bg-[var(--color-surface-container-high)] dark:hover:bg-[var(--color-inverse-surface)] transition-colors text-[var(--color-primary)] dark:text-[var(--color-primary-fixed)]"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="material-symbols-outlined">language</span>
          <span className="font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] font-bold">Language</span>
        </button>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-[var(--color-surface-container-lowest)] rounded-lg shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <button onClick={() => changeLanguage('en')} className="px-4 py-2 hover:bg-[var(--color-surface-container)] text-left text-[length:var(--font-body-md)] font-[family-name:var(--font-body-md)] cursor-pointer text-[var(--color-on-surface)]">English</button>
            <button onClick={() => changeLanguage('hi')} className="px-4 py-2 hover:bg-[var(--color-surface-container)] text-left text-[length:var(--font-body-md)] font-[family-name:var(--font-body-md)] cursor-pointer text-[var(--color-on-surface)]">Hindi</button>
            <button onClick={() => changeLanguage('te')} className="px-4 py-2 hover:bg-[var(--color-surface-container)] text-left text-[length:var(--font-body-md)] font-[family-name:var(--font-body-md)] cursor-pointer text-[var(--color-on-surface)]">Telugu</button>
            <button onClick={() => changeLanguage('ta')} className="px-4 py-2 hover:bg-[var(--color-surface-container)] text-left text-[length:var(--font-body-md)] font-[family-name:var(--font-body-md)] cursor-pointer text-[var(--color-on-surface)]">Tamil</button>
          </div>
        )}
      </div>

      {/* Headline */}
      <div className="flex flex-col items-center justify-center">
        <h1 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] font-bold text-black text-center drop-shadow-sm">
          {t('app.title', 'Emergency Copilot AI')}
        </h1>
        <span className="text-[length:var(--font-label-md)] font-[family-name:var(--font-label-md)] text-black/80 mt-0.5 drop-shadow-sm">
          {t('app.subtitle', 'Help in Seconds, Not Minutes')}
        </span>
      </div>

      {/* Trailing Icon: Account */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-container-high)] dark:hover:bg-[var(--color-inverse-surface)] transition-colors text-[var(--color-primary)] dark:text-[var(--color-primary-fixed)]">
        <span className="material-symbols-outlined">account_circle</span>
      </button>
    </header>
  );
}
