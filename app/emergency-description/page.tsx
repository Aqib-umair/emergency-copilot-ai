'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEmergencyStore } from '../../store/useEmergencyStore';
import PageTransition from '../../components/layout/PageTransition';

const suggestedSymptoms = [
  'Chest Pain', 'Breathing Problem', 'High Fever', 'Bleeding',
  'Burn', 'Stroke', 'Accident', 'Snake Bite', 'Poisoning'
];

export default function EmergencyDescriptionPage() {
  const router = useRouter();
  const { emergencyDescription, setEmergencyDescription } = useEmergencyStore();
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState(emergencyDescription);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Ideally, this would link to the selected i18n language

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setText(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleChipClick = (symptom: string) => {
    const newText = text ? `${text}, ${symptom}` : symptom;
    setText(newText);
  };

  const handleAnalyze = () => {
    setEmergencyDescription(text);
    router.push('/ai-analysis');
  };
  return (
      <PageTransition
        backPath="/patient-details"
        onNext={handleAnalyze}
        nextLabel="Analyze"
        nextDisabled={!text.trim()}
      >
        <div className="w-full flex flex-col items-center px-[var(--spacing-margin-mobile)] pt-6 pb-32">
          <div className="w-full max-w-2xl flex flex-col gap-[var(--spacing-stack-lg)] animate-fade-in-up">
            
            {/* Input Section */}
            <section className="flex flex-col gap-[var(--spacing-stack-md)] bg-[var(--color-surface-container-lowest)] p-6 rounded-[24px] shadow-sm border border-[var(--color-outline-variant)]/50">
              <div className="flex flex-col gap-2">
                <label className="font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] text-[var(--color-on-surface)]" htmlFor="emergency-input">
                  Emergency Description
                </label>
                <textarea
                  id="emergency-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)] rounded-[16px] p-4 font-[family-name:var(--font-body-lg)] text-[length:var(--font-body-lg)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none min-h-[160px] resize-y shadow-inner transition-shadow"
                  placeholder="My father has chest pain, sweating and difficulty breathing."
                ></textarea>
              </div>

              {/* Voice Input Button */}
              <div className="flex flex-col items-center justify-center pt-4 border-t border-[var(--color-outline-variant)]/30">
                <button
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  className={`group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-200 active:scale-95 ${
                    isListening 
                      ? 'bg-[var(--color-error)] text-[var(--color-on-error)] shadow-[0_8px_24px_rgba(186,26,26,0.25)] animate-pulse'
                      : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] shadow-[0_4px_12px_rgba(0,40,142,0.15)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] hover:shadow-[0_8px_24px_rgba(0,40,142,0.25)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[48px] transition-transform group-hover:scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                </button>
                <span className={`mt-3 font-[family-name:var(--font-label-md)] text-[length:var(--font-label-md)] font-medium tracking-wide ${isListening ? 'text-[var(--color-error)]' : 'text-[var(--color-primary)]'}`}>
                  {isListening ? 'LISTENING...' : 'TAP TO SPEAK'}
                </span>
              </div>
            </section>

            {/* Quick Select Chips */}
            <section>
              <h3 className="font-[family-name:var(--font-headline-md)] text-[length:var(--font-headline-md)] text-[var(--color-on-surface)] mb-[var(--spacing-stack-md)]">
                Suggested Symptoms
              </h3>
              <div className="flex flex-wrap gap-3">
                {suggestedSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => handleChipClick(symptom)}
                    className="h-[var(--spacing-touch-target-min)] px-5 bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] rounded-xl border border-[var(--color-outline-variant)]/50 transition-colors flex items-center shadow-sm"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </PageTransition>
    );
  }
