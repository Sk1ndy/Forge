import { useState } from 'react';
import * as htmlToImage from 'html-to-image';

export default function SocialExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const node = document.getElementById('forge-social-poster');
      if (!node) {
        alert("Impossible de trouver le conteneur à exporter.");
        return;
      }

      // Petite astuce : forcer un fond noir si ce n'est pas déjà le cas
      // pour éviter les PNG transparents moches sur les réseaux.
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1.0,
        backgroundColor: '#000000',
        style: {
          padding: '20px',
          borderRadius: '12px'
        }
      });

      const link = document.createElement('a');
      link.download = 'forge-programme.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur lors de l'export PNG", err);
      alert("Erreur lors de la capture d'écran.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(219,39,119,0.3)] disabled:opacity-50"
    >
      {isExporting ? (
        <span className="animate-pulse">Génération...</span>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export Social
        </>
      )}
    </button>
  );
}
