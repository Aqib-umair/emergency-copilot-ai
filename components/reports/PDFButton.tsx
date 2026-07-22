'use client';

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MedicalReportPDF from './MedicalReportPDF';

export default function PDFButton({ patientDetails, aiResults, emergencyDescription }: any) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<MedicalReportPDF patientDetails={patientDetails} aiResults={aiResults} emergencyDescription={emergencyDescription} />}
      fileName="Emergency_Medical_Summary.pdf"
      className="flex-1 h-[var(--spacing-touch-target-min)] flex items-center justify-center gap-2 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl font-[family-name:var(--font-label-lg)] text-[length:var(--font-label-lg)] hover:bg-[var(--color-surface-container-low)] transition-colors"
    >
      {/* @ts-ignore */}
      {({ loading }) => (
        <>
          <span className="material-symbols-outlined">download</span>
          {loading ? 'Preparing...' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
}
