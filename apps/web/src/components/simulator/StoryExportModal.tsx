import React, { useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import { SimulationResult } from '@forge/shared';
import StoryExportTemplate from './StoryExportTemplate';

interface StoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult;
}

export default function StoryExportModal({ isOpen, onClose, simulation }: StoryExportModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    try {
      const blob = await toBlob(exportRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error('Blob is null');

      const file = new File([blob], 'forge-bilan.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mon Bilan Forge',
          text: 'Voici mon bilan de mésocycle ! #ForgeApp',
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'forge-bilan.png';
        link.click();
      }
    } catch (err) {
      console.error('Erreur lors du partage Instagram:', err);
      alert("Erreur lors de la préparation de l'image.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Container for the scaled down preview */}
      <div className="relative w-full max-w-sm h-full max-h-[80vh] flex flex-col items-center justify-center">
        
        {/* Hidden but fully rendered node for html-to-image */}
        <div className="absolute top-[-10000px] left-[-10000px]">
          <StoryExportTemplate ref={exportRef} simulation={simulation} />
        </div>

        {/* Visual Preview Container */}
        <div className="relative w-full flex-1 rounded-2xl overflow-hidden border border-zinc-800 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-center bg-zinc-950">
          <div style={{ transform: 'scale(0.32)', transformOrigin: 'center center' }}>
            {/* Visual representation purely for preview. We just reuse the component without ref */}
            <StoryExportTemplate simulation={simulation} />
          </div>
        </div>

        <div className="mt-6 flex flex-col w-full gap-3">
          <button 
            onClick={handleShare}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(219,39,119,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <span className="animate-pulse">Préparation de l'image...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Partager en Story Instagram
              </>
            )}
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-transparent border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold py-2 px-6 rounded-xl transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
