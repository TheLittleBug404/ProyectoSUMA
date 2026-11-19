import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  X 
} from 'lucide-react';
import { useModalStore } from '../../stores/useModalStore';

export const GlobalModalContainer: React.FC = () => {
  const { 
    confirmState, 
    closeConfirm, 
    alertState, 
    closeAlert, 
    toasts, 
    removeToast 
  } = useModalStore();

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmState.isOpen) closeConfirm(false);
        if (alertState.isOpen) closeAlert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState.isOpen, alertState.isOpen, closeConfirm, closeAlert]);

  return (
    <>
      {/* ================= MODAL DE CONFIRMACIÓN ================= */}
      {confirmState.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => closeConfirm(false)}
        >
          <div 
            className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col bg-[#121216] border border-[#d4af37]/35 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-2xl shrink-0 border ${
                confirmState.variant === 'danger'
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : confirmState.variant === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              }`}>
                {confirmState.variant === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmState.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed whitespace-pre-line">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {confirmState.cancelText}
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                  confirmState.variant === 'danger'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-amber-500/20'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE ALERTA INFORMATIVA ================= */}
      {alertState.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
          onClick={() => closeAlert()}
        >
          <div 
            className="relative w-full max-w-md my-auto max-h-[92vh] flex flex-col bg-[#121216] border border-[#d4af37]/35 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-2xl shrink-0 border ${
                alertState.type === 'error'
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : alertState.type === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : alertState.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              }`}>
                {alertState.type === 'error' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : alertState.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : alertState.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide">
                  {alertState.title}
                </h3>
                <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed whitespace-pre-line">
                  {alertState.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6 pt-4 border-t border-zinc-800">
              <button
                type="button"
                autoFocus
                onClick={() => closeAlert()}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                {alertState.buttonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOASTS FLOTANTES ================= */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md animate-slide-in-right ${
                t.type === 'error'
                  ? 'bg-red-950/90 border-red-500/40 text-red-200'
                  : t.type === 'info'
                  ? 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
                  : 'bg-[#181820]/95 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : t.type === 'info' ? (
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-white p-0.5 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
