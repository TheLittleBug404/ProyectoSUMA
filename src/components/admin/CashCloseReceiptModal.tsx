import React from 'react';
import { X, Printer, Receipt } from 'lucide-react';
import type { CashRegister } from '../../types/domain';

interface CashCloseReceiptModalProps {
  isOpen: boolean;
  caja: CashRegister | null;
  onClose: () => void;
}

export const CashCloseReceiptModal: React.FC<CashCloseReceiptModalProps> = ({
  isOpen,
  caja,
  onClose
}) => {
  if (!isOpen || !caja) return null;

  const handlePrint = () => {
    window.print();
  };

  const diferencia = caja.diferencia ?? 0;
  const isExact = Math.abs(diferencia) < 0.01;
  const isSurplus = diferencia > 0.01;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2 text-amber-300">
            <Receipt className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Comprobante de Cierre de Caja & Arqueo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Content */}
        <div className="p-6 bg-[#0e0e12] text-zinc-200 text-xs font-mono space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Brand header */}
          <div className="text-center pb-3 border-b border-dashed border-zinc-700">
            <h2 className="text-base font-bold text-amber-400 tracking-wider">SAMU | Samara Muriel</h2>
            <p className="text-[11px] text-zinc-400">Punto de Venta e Inventario Textil</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Av. 16 de Julio (El Prado), La Paz - Bolivia</p>
            <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold uppercase tracking-wider">
              ACTA DE CORTE & ARQUEO DE CAJA
            </div>
          </div>

          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#14141a] p-3 rounded-xl border border-zinc-800">
            <div>
              <p className="text-zinc-500">Caja / Turno:</p>
              <p className="font-bold text-zinc-200">#{caja.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-zinc-500">Estado:</p>
              <p className="font-bold text-emerald-400">{caja.estado}</p>
            </div>
            <div>
              <p className="text-zinc-500">Apertura:</p>
              <p className="text-zinc-300">
                {new Date(caja.fechaApertura).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              <p className="text-[10px] text-zinc-400">Por: {caja.empleadoNombre || 'Personal'}</p>
            </div>
            <div>
              <p className="text-zinc-500">Cierre:</p>
              <p className="text-zinc-300">
                {caja.fechaCierre 
                  ? new Date(caja.fechaCierre).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
                  : 'En curso'}
              </p>
              <p className="text-[10px] text-zinc-400">Por: {caja.cerradoPorNombre || caja.empleadoNombre || 'Admin'}</p>
            </div>
          </div>

          {/* Breakdown numbers */}
          <div className="space-y-2 border-t border-b border-dashed border-zinc-700 py-3 text-xs">
            <div className="flex justify-between items-center text-zinc-300">
              <span>(+) Fondo Inicial de Apertura:</span>
              <span className="font-bold">Bs. {caja.montoApertura.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-400">
              <span>(+) Ventas en Efectivo:</span>
              <span className="font-bold">Bs. {caja.totalVentasEfectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>(+) Ventas por QR:</span>
              <span className="font-bold">Bs. {caja.totalVentasQR.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-300">
              <span>(+) Ventas por Tarjeta:</span>
              <span className="font-bold">Bs. {caja.totalVentasTarjeta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-400">
              <span>(-) Egresos / Gastos de Turno:</span>
              <span className="font-bold">- Bs. {caja.totalEgresos.toFixed(2)}</span>
            </div>
            {caja.cantidadVentasAnuladas && caja.cantidadVentasAnuladas > 0 ? (
              <div className="flex justify-between items-center text-pink-400 text-[11px] pt-1">
                <span>(ℹ) Ventas Anuladas ({caja.cantidadVentasAnuladas}):</span>
                <span className="font-bold">Devuelto -Bs. {(caja.totalVentasAnuladasEfectivo || 0).toFixed(2)}</span>
              </div>
            ) : null}
          </div>

          {/* Cash reconciliation summary */}
          <div className="p-3.5 rounded-xl bg-[#14141a] border border-amber-500/20 space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Efectivo Teórico Esperado:</span>
              <span className="font-bold text-white">Bs. {caja.montoEsperadoEfectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-300">
              <span>Efectivo Físico Contado:</span>
              <span className="font-bold text-amber-300">Bs. {(caja.montoRealEfectivo ?? 0).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-bold">
              <span>Diferencia de Caja:</span>
              <span className={
                isExact ? 'text-emerald-400' : isSurplus ? 'text-amber-300' : 'text-red-400'
              }>
                {isExact 
                  ? 'Bs. 0.00 (CUADRADO)' 
                  : isSurplus 
                  ? `+ Bs. ${diferencia.toFixed(2)} (SOBRANTE)` 
                  : `- Bs. ${Math.abs(diferencia).toFixed(2)} (FALTANTE)`}
              </span>
            </div>
          </div>

          {caja.notas && (
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="text-zinc-500 font-semibold block">Notas / Observaciones:</span>
              {caja.notas}
            </div>
          )}

          <div className="text-center text-[10px] text-zinc-500 pt-2 border-t border-dashed border-zinc-700">
            <p>Sistema SAMU POS Local • Auditoría Interna</p>
            <p className="mt-0.5">Firma Responsable: _______________________</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-[#181820] border-t border-zinc-800 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Comprobante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
