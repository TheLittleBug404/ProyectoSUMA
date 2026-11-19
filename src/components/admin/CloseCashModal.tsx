import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import type { LiveCashStats } from '../../repositories/interfaces/ICashRepository';

interface CloseCashModalProps {
  isOpen: boolean;
  liveStats: LiveCashStats | null;
  onClose: () => void;
  onConfirm: (montoRealEfectivo: number, notas?: string) => Promise<void>;
}

export const CloseCashModal: React.FC<CloseCashModalProps> = ({
  isOpen,
  liveStats,
  onClose,
  onConfirm
}) => {
  const [montoContado, setMontoContado] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !liveStats) return null;

  const esperado = liveStats.montoEsperadoEfectivo;
  const contadoNum = parseFloat(montoContado);
  const isValidNumber = !isNaN(contadoNum) && contadoNum >= 0;
  const diferencia = isValidNumber ? contadoNum - esperado : 0;
  const isExact = isValidNumber && Math.abs(diferencia) < 0.01;
  const isSurplus = isValidNumber && diferencia > 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber) {
      setError('Ingrese un monto válido de efectivo contado físicamente');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm(contadoNum, notas.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error realizando el cierre de caja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#121216] border border-amber-500/35 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Arqueo & Cierre de Caja
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
          <div className="mx-5 mt-4 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Summary Box */}
          <div className="bg-[#181820] border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mb-1">
              Cálculo del Sistema (Valores Esperados)
            </p>
            <div className="flex justify-between text-zinc-300">
              <span>(+) Fondo Inicial de Apertura:</span>
              <span className="font-mono font-bold text-white">Bs. {liveStats.caja.montoApertura.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>(+) Ventas Cobradas en Efectivo ({liveStats.ventasCount} tickets):</span>
              <span className="font-mono font-bold">Bs. {liveStats.totalVentasEfectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span>* Ventas QR (Banco):</span>
              <span className="font-mono">Bs. {liveStats.totalVentasQR.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px]">
              <span>* Ventas Tarjeta (POS POS):</span>
              <span className="font-mono">Bs. {liveStats.totalVentasTarjeta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>(-) Salidas de Efectivo / Egresos ({liveStats.egresosCount}):</span>
              <span className="font-mono font-bold">- Bs. {liveStats.totalEgresos.toFixed(2)}</span>
            </div>
            {liveStats.cantidadVentasAnuladas > 0 && (
              <div className="flex justify-between text-pink-400 text-[11px] bg-pink-500/10 p-1.5 rounded">
                <span>(ℹ) Ventas Anuladas ({liveStats.cantidadVentasAnuladas}):</span>
                <span className="font-mono font-bold">Devuelto -Bs. {liveStats.totalVentasAnuladasEfectivo.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-700 flex justify-between text-sm font-bold text-white">
              <span>(=) Efectivo que DEBE haber en gaveta:</span>
              <span className="font-mono text-amber-300">Bs. {esperado.toFixed(2)}</span>
            </div>
          </div>

          {/* Arqueo Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Efectivo Físico Contado en Gaveta (Bs.) *
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
                value={montoContado}
                onChange={(e) => setMontoContado(e.target.value)}
                placeholder={esperado.toFixed(2)}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-11 pr-3.5 py-2.5 text-base text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Cuente físicamente billetes y monedas en la gaveta y digite el total.
            </p>
          </div>

          {/* Live Difference feedback */}
          {isValidNumber && (
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isExact 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : isSurplus
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {isExact ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="font-bold">
                  {isExact ? 'Cuadre Perfecto' : isSurplus ? 'Sobrante en Caja' : 'Faltante en Caja'}
                </span>
              </div>
              <span className="font-mono font-bold text-sm">
                {isExact 
                  ? 'Bs. 0.00' 
                  : isSurplus 
                  ? `+ Bs. ${diferencia.toFixed(2)}` 
                  : `- Bs. ${Math.abs(diferencia).toFixed(2)}`}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Observaciones del Cierre (Opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalle o justificación si existió diferencia en el arqueo..."
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
              <span>{loading ? 'Cerrando...' : 'Confirmar y Cerrar Caja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
