'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  prompt: (message: string, defaultValue: string, onConfirm: (val: string) => void) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Individual Toast ─────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration ?? 3500);
    return () => clearTimeout(t);
  }, [toast, onRemove]);

  const icons: Record<ToastType, string> = {
    success: '✅',
    error: '🛑',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors: Record<ToastType, string> = {
    success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-300',
    error:   'border-red-500/30 bg-red-950/80 text-red-300',
    warning: 'border-amber-500/30 bg-amber-950/80 text-amber-300',
    info:    'border-zinc-600/40 bg-zinc-900/90 text-zinc-200',
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-md max-w-sm transition-all duration-300 ${colors[toast.type]} ${leaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
      style={{ animation: leaving ? undefined : 'slideInUp 0.25s ease-out' }}
    >
      <span className="shrink-0 text-base leading-none mt-0.5">{icons[toast.type]}</span>
      <p className="flex-1 leading-relaxed text-[12px]">{toast.message}</p>
      <button
        onClick={() => { setLeaving(true); setTimeout(() => onRemove(toast.id), 300); }}
        className="shrink-0 opacity-40 hover:opacity-80 transition-opacity text-base leading-none cursor-pointer mt-0.5"
      >✕</button>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialog {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

function ConfirmModal({ dialog, onClose }: { dialog: ConfirmDialog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-sm text-zinc-200 leading-relaxed mb-6">{dialog.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { dialog.onCancel?.(); onClose(); }}
            className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={() => { dialog.onConfirm(); onClose(); }}
            className="px-4 py-2 text-xs font-black bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-400/50 rounded-xl transition-all cursor-pointer"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Dialog ────────────────────────────────────────────────────────────
interface PromptDialog {
  message: string;
  defaultValue: string;
  onConfirm: (val: string) => void;
}

function PromptModal({ dialog, onClose }: { dialog: PromptDialog; onClose: () => void }) {
  const [value, setValue] = useState(dialog.defaultValue);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-sm text-zinc-200 mb-4">{dialog.message}</p>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { dialog.onConfirm(value.trim()); onClose(); } if (e.key === 'Escape') onClose(); }}
          autoFocus
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 mb-5"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-xl transition-all cursor-pointer">
            Annuler
          </button>
          <button
            onClick={() => { if (value.trim()) { dialog.onConfirm(value.trim()); onClose(); } }}
            className="px-4 py-2 text-xs font-black bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [promptDialog, setPromptDialog] = useState<PromptDialog | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  const confirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmDialog({ message, onConfirm, onCancel });
  }, []);

  const prompt = useCallback((message: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setPromptDialog({ message, defaultValue, onConfirm });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirm, prompt }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Modals */}
      {confirmDialog && (
        <ConfirmModal dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      )}
      {promptDialog && (
        <PromptModal dialog={promptDialog} onClose={() => setPromptDialog(null)} />
      )}

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
