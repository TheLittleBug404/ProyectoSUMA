import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserCheck, AlertCircle, Save } from 'lucide-react';
import { customerSchema, type CustomerFormData } from '../../schemas/customerSchema';
import type { Customer } from '../../types/domain';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit
}) => {
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      nombre: '',
      documento: '',
      telefono: '',
      email: '',
      descuentoFrecuente: 0,
      notas: ''
    }
  });

  useEffect(() => {
    if (customer) {
      reset({
        nombre: customer.nombre,
        documento: customer.documento || '',
        telefono: customer.telefono || '',
        email: customer.email || '',
        descuentoFrecuente: customer.descuentoFrecuente || 0,
        notas: customer.notas || ''
      });
    } else {
      reset({
        nombre: '',
        documento: '',
        telefono: '',
        email: '',
        descuentoFrecuente: 0,
        notas: ''
      });
    }
  }, [customer, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121216] border border-[#d4af37]/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-serif text-white">
                {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Actualiza los datos del cliente y descuentos' : 'Agrega un cliente al directorio de la tienda'}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              {...register('nombre')}
              placeholder="Ej: Laura Vargas"
              className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            {errors.nombre && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.nombre.message}
              </p>
            )}
          </div>

          {/* Documento y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                CI / NIT / Documento
              </label>
              <input
                type="text"
                {...register('documento')}
                placeholder="Ej: 8492019 LP"
                className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                {...register('telefono')}
                placeholder="Ej: 70123456"
                className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Email y Descuento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Correo Electrónico (Opcional)
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Descuento Frecuente (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                {...register('descuentoFrecuente', { valueAsNumber: true })}
                placeholder="Ej: 10 para 10% OFF"
                className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Notas / Preferencias (Opcional)
            </label>
            <textarea
              rows={2}
              {...register('notas')}
              placeholder="Ej: Prefiere vestidos talla M en tonos oscuros"
              className="w-full bg-[#181820] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

