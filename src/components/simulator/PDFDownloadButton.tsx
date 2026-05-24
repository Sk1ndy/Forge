'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from './PDFReport';
import { SimulationResult, WeeklyBlueprint } from '@/lib/calculations';

interface PDFDownloadButtonProps {
  simulation: SimulationResult;
  blueprint: WeeklyBlueprint;
  avatarImageStr: string;
  score: number;
  grade: string;
  critique: string;
}

export default function PDFDownloadButton({ simulation, blueprint, avatarImageStr, score, grade, critique }: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<PDFReport simulation={simulation} blueprint={blueprint} avatarImageStr={avatarImageStr} score={score} grade={grade} critique={critique} />}
      fileName="Forge_Rapport_Hebdomadaire.pdf"
      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg shadow-lg transition-colors cursor-pointer"
    >
      {/* react-pdf passes a blob state internally, but standard children work too. The types for children in PDFDownloadLink are sometimes tricky, so we use a function if needed. */}
      {({ loading }) => (
        <>
          {loading ? (
            <span className="animate-pulse">Génération du PDF...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger le PDF
            </>
          )}
        </>
      )}
    </PDFDownloadLink>
  );
}
