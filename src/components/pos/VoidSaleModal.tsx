import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ban, 
  Search, 
  AlertTriangle, 
  Banknote 
} from 'lucide-react';
import { saleRepository } from '../../repositories/dexie/DexieSaleRepository';
import type { Sale } from '../../types/domain';
import { useAuthStore } from '../../stores/useAuthStore';

interface VoidSaleModalProps {
  isOpen: boolean;
  preselectedSale?: Sale | null;
  onClose: () => void;
  onSuccess: (voidedSale: Sale) => void;
}

const COMMON_REASONS = [
  'Error de digitación o cobro en caja',
  'Prenda o talla equivocada por el cliente',
  'Cliente desistió de la compra / no llevó prendas',
  'Cobro duplicado por error de sistema',
  'Cambio de método de pago requerido',
  'Otro motivo'
];

export const VoidSaleModal: React.FC<VoidSaleModalProps> = ({
  isOpen,
  preselectedSale,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [ticketQuery, setTicketQuery] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Void reason form
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voidError, setVoidError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTicketQuery('');
      setSearchError('');
      setVoidError('');
      setSelectedReason(COMMON_REASONS[0]);
      setCustomReason('');

      if (preselectedSale) {
        setFoundSale(preselectedSale);
      } else {
        setFoundSale(null);
      }
    }
  }, [isOpen, preselectedSale]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = ticketQuery.trim().toUpperCase();
    if (!query) return;

    try {
      setSearching(true);
      setSearchError('');
      setFoundSale(null);

      const allSales = await saleRepository.getSales();
      const match = allSales.find(
        s => s.numeroTicket.toUpperCase() === query || s.numeroTicket.toUpperCase().includes(query)
      );

      if (!match) {
        setSearchError(`No se encontró ningún ticket con el código "${ticketQuery}"`);
      } else {
        setFoundSale(match);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error buscando la venta');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!foundSale || !user) return;

    const finalReason = selectedReason === 'Otro motivo' 
      ? (customReason.trim() || 'Sin motivo detallado')
      : selectedReason;

    if (!finalReason) {
      setVoidError('Debes especificar un motivo para anular la venta');
      return;
    }

    try {
      setIsSubmitting(true);
      setVoidError('');

      const voided = await saleRepository.voidSale(foundSale.id, {
        userId: user.id,
        userNombre: user.nombre,
        userRol: user.rol,
        motivo: finalReason
      });

      onSuccess(voided);
      onClose();
    } catch (err: any) {
      setVoidError(err.message || 'Error al anular la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#121216] border border-red-500/40 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
              <Ban className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-serif text-white">
                Anulación de Venta & Devolución
              </h2>
              <p className="text-[11px] text-zinc-400">
                Reintegra prendas al stock y cuadra la caja registradora
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Step 1: Search ticket if not preselected */}
          {!preselectedSale && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Ingresa el Número de Ticket a Anular *
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={ticketQuery}
                    onChange={(e) => setTicketQuery(e.target.value)}
                    placeholder="Ej: TICK-123456"
                    className="w-full bg-[#181820] border border-zinc-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400 font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !ticketQuery.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {searching ? 'Buscando...' : 'Buscar'}
                </button>
              </form>

              {searchError && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {searchError}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Sale Found Details */}
          {foundSale && (
            <div className="p-4 rounded-xl bg-[#181820] border border-zinc-800 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
                <div>
                  <span className="font-mono font-bold text-amber-300">{foundSale.numeroTicket}</span>
                  <p className="text-[10px] text-zinc-400">
                    {new Date(foundSale.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-white">
                    Bs. {foundSale.total.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-zinc-400">Pago: {foundSale.metodoPago}</p>
                </div>
              </div>

              {/* Status warning if already annulled */}
              {foundSale.estado === 'ANULADA' ? (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Ban className="w-4 h-4" /> Esta venta YA FUE ANULADA
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Anulada por: <span className="text-white font-semibold">{foundSale.anuladoPorNombre}</span> ({foundSale.anuladoPorRol})
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Motivo: <span className="text-zinc-200">{foundSale.motivoAnulacion}</span>
                  </p>
                </div>
              ) : (
                <>
                  {/* Items that will return to stock */}
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Prendas a reintegrar al inventario:
                    </p>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {foundSale.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                          <span className="text-zinc-200">
                            {it.cantidad}x {it.nombreProducto} {it.talla ? `[${it.talla}]` : ''}
                          </span>
                          <span className="font-mono text-zinc-400">Bs. {it.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cash refund note */}
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4" /> Dinero a devolver al cliente:
                    </span>
                    <span className="font-mono font-bold text-sm">Bs. {foundSale.total.toFixed(2)}</span>
                  </div>

                  {/* Mandatory Reason */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Motivo de la Anulación *
                    </label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-400 cursor-pointer"
                    >
                      {COMMON_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    {selectedReason === 'Otro motivo' && (
                      <input
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Escribe el motivo detallado..."
                        className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-400 mt-1"
                      />
                    )}
                  </div>

                  {/* Error display */}
                  {voidError && (
                    <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                      {voidError}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmVoid}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Anulando...' : 'Confirmar Anulación y Devolución'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
