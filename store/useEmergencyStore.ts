import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PatientDetails {
  name: string;
  age: number | '';
  weight: number | '';
  gender: string;
  bloodGroup: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
}

export interface AIAnalysisResult {
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  generalGuidance: string;
  simpleExplanation: string;
  nextSteps: string[];
  timeline: { time: string; action: string }[];
  medicalSummary?: string;
}

interface EmergencyState {
  patientDetails: PatientDetails;
  setPatientDetails: (details: Partial<PatientDetails>) => void;
  
  emergencyDescription: string;
  setEmergencyDescription: (desc: string) => void;
  
  aiResults: AIAnalysisResult | null;
  setAiResults: (results: AIAnalysisResult) => void;
  
  resetEmergency: () => void;
}

const initialPatientDetails: PatientDetails = {
  name: '',
  age: '',
  weight: '',
  gender: 'Male',
  bloodGroup: '',
  medicalConditions: '',
  medications: '',
  allergies: '',
};

export const useEmergencyStore = create<EmergencyState>()(
  persist(
    (set) => ({
      patientDetails: initialPatientDetails,
      setPatientDetails: (details) => 
        set((state) => ({ 
          patientDetails: { ...state.patientDetails, ...details } 
        })),
        
      emergencyDescription: '',
      setEmergencyDescription: (desc) => set({ emergencyDescription: desc }),
      
      aiResults: null,
      setAiResults: (results) => set({ aiResults: results }),
      
      resetEmergency: () => set({ 
        patientDetails: initialPatientDetails, 
        emergencyDescription: '', 
        aiResults: null 
      }),
    }),
    {
      name: 'emergency-copilot-storage',
    }
  )
);
