import React, { useState } from 'react';
import { X, ArrowDownCircle, Sparkles } from 'lucide-react';
import type { CashExpenseCategory } from '../../types/domain';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    categoria: CashExpenseCategory;
    descripcion: string;
    monto: number;
    comprobante?: string;
  }) => Promise<void>;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [categoria, setCategoria] = useState<CashExpenseCategory>('PROVEEDOR');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      setError('El monto del egreso debe ser mayor a 0');
      return;
    }
    if (!descripcion.trim()) {
      setError('Ingrese una descripción o concepto del egreso');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onConfirm({
        categoria,
        descripcion: descripcion.trim(),
        monto: val,
        comprobante: comprobante.trim() || undefined
      });
      setDescripcion('');
      setMonto('');
      setComprobante('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error registrando egreso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#121216] border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-red-400">
            <ArrowDownCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Registrar Egreso / Salida de Efectivo
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
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Categoría del Gasto *
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CashExpenseCategory)}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-400 cursor-pointer"
            >
              <option value="PROVEEDOR">Pago a Proveedor (Telas, Hilos, Confección)</option>
              <option value="ADELANTO">Adelanto / Pago de Sueldo a Empleado</option>
              <option value="SERVICIOS">Servicios Básicos / Alquiler / Mantenimiento</option>
              <option value="VARIOS">Gastos Menores / Limpieza / Transporte</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Monto en Efectivo a Retirar (Bs.) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-red-400">
                Bs.
              </span>
              <input
                type="number"
                step="0.01"
                min="0.10"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="50.00"
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-11 pr-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-400"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Concepto / Detalle del Pago *
            </label>
            <input
              type="text"
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="ej: Pago de botones a distribuidora TextilSur"
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nro. de Factura / Recibo / Comprobante (Opcional)
            </label>
            <input
              type="text"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="ej: Recibo #4920"
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-400"
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Registrar Salida'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

