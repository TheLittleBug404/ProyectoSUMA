import React, { useState } from 'react';
import { X, Landmark, Sparkles } from 'lucide-react';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (montoApertura: number, notas?: string) => Promise<void>;
}

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [monto, setMonto] = useState<string>('100.00');
  const [notas, setNotas] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val < 0) {
      setError('Ingrese un monto válido mayor o igual a 0');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(val, notas.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error abriendo caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-300">
            <Landmark className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Apertura de Caja & Fondo Inicial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Monto Base / Fondo Inicial en Gaveta (Bs.) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                Bs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="100.00"
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-11 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Efectivo físico disponible al iniciar el turno para dar cambio.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej: Turno de mañana, monedas de corte menor incluidas..."
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-colors shadow cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Abriendo...' : 'Confirmar Apertura'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

