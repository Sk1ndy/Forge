'use client';
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'forge_onboarding_v2_done';

interface Step {
  id: number;
  target: string; // CSS selector to highlight
  title: string;
  body: string;
  position: 'right' | 'left' | 'bottom' | 'top';
  icon: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    target: '[data-onboard="avatar"]',
    title: 'Ton Corps en Temps Réel',
    body: 'Chaque muscle se colore selon sa fatigue accumulée. Vert = OK, Orange = Surcharge, Rouge = Stop. Aucun chiffre à mémoriser.',
    position: 'right',
    icon: '🫀',
  },
  {
    id: 2,
    target: '[data-onboard="sequencer"]',
    title: 'Construit Ta Séance',
    body: 'Glisse les exercices depuis la bibliothèque à droite. L\'avatar réagit instantanément à chaque ajout.',
    position: 'top',
    icon: '🏗️',
  },
  {
    id: 3,
    target: '[data-onboard="readiness"]',
    title: 'Le Readiness Score',
    body: 'Ce score unique mesure si ton système nerveux est prêt à s\'entraîner dur. En dessous de 60, priorise la récupération.',
    position: 'right',
    icon: '⚡',
  },
];

function getTargetRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

export default function WelcomeSpotlight() {
  const [step, setStep] = useState(0); // 0 = not started, 1-3 = active, 4 = done
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so page has time to mount
      setTimeout(() => {
        setStep(1);
        setVisible(true);
      }, 800);
    }
  }, []);

  useEffect(() => {
    if (step < 1 || step > STEPS.length) return;
    const current = STEPS[step - 1];
    const updateRect = () => {
      const r = getTargetRect(current.target);
      setRect(r);
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [step]);

  const handleNext = () => {
    if (step >= STEPS.length) {
      handleDone();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleDone = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
    setStep(4);
  };

  if (!visible || step < 1 || step > STEPS.length) return null;

  const current = STEPS[step - 1];
  const PADDING = 12;

  // Compute tooltip position
  let tooltipStyle: React.CSSProperties = { position: 'fixed', zIndex: 10001 };

  if (rect) {
    if (current.position === 'right') {
      tooltipStyle.left = rect.right + PADDING;
      tooltipStyle.top = rect.top + rect.height / 2;
      tooltipStyle.transform = 'translateY(-50%)';
    } else if (current.position === 'left') {
      tooltipStyle.right = window.innerWidth - rect.left + PADDING;
      tooltipStyle.top = rect.top + rect.height / 2;
      tooltipStyle.transform = 'translateY(-50%)';
    } else if (current.position === 'top') {
      tooltipStyle.left = rect.left + rect.width / 2;
      tooltipStyle.bottom = window.innerHeight - rect.top + PADDING;
      tooltipStyle.transform = 'translateX(-50%)';
    } else {
      tooltipStyle.left = rect.left + rect.width / 2;
      tooltipStyle.top = rect.bottom + PADDING;
      tooltipStyle.transform = 'translateX(-50%)';
    }
  } else {
    // Fallback: center of screen
    tooltipStyle.left = '50%';
    tooltipStyle.top = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Dark overlay with cutout */}
      <div
        className="fixed inset-0 z-[10000] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(1px)' }}
      />

      {/* Spotlight highlight ring around target */}
      {rect && (
        <div
          className="fixed z-[10000] pointer-events-none rounded-xl transition-all duration-300"
          style={{
            left: rect.left - PADDING,
            top: rect.top - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 2px rgba(16,185,129,0.7), 0 0 30px rgba(16,185,129,0.25)',
            background: 'transparent',
          }}
        />
      )}

      {/* Tooltip bubble */}
      <div
        style={{ ...tooltipStyle, maxWidth: 280 }}
        className="pointer-events-auto"
      >
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,0,0,0.9)] shadow-emerald-500/10">
          {/* Progress dots */}
          <div className="flex gap-1 mb-3">
            {STEPS.map(s => (
              <div
                key={s.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s.id === step ? 'w-6 bg-emerald-500' : s.id < step ? 'w-3 bg-emerald-700' : 'w-3 bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="text-2xl mb-2">{current.icon}</div>

          {/* Content */}
          <h3 className="text-sm font-black text-white mb-1.5">{current.title}</h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">{current.body}</p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleDone}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
            >
              Passer →
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            >
              {step >= STEPS.length ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
