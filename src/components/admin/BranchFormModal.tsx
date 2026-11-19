import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Building2, Sparkles, MapPin, Phone } from 'lucide-react';
import { branchSchema, type BranchFormData } from '../../schemas/branchSchema';
import type { Branch } from '../../types/domain';

interface BranchFormModalProps {
  isOpen: boolean;
  branchToEdit?: Branch | null;
  onClose: () => void;
  onSave: (data: BranchFormData) => Promise<void>;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  branchToEdit,
  onClose,
  onSave
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema)
  });

  useEffect(() => {
    if (isOpen) {
      if (branchToEdit) {
        reset({
          nombre: branchToEdit.nombre,
          direccion: branchToEdit.direccion || '',
          telefono: branchToEdit.telefono || '',
          activa: branchToEdit.activa
        });
      } else {
        reset({
          nombre: '',
          direccion: '',
          telefono: '',
          activa: true
        });
      }
    }
  }, [isOpen, branchToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: BranchFormData) => {
    await onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-300">
            <Building2 className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal de Tienda'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre de la Sucursal *
            </label>
            <input
              type="text"
              placeholder="ej: Sucursal Calacoto - Zona Sur"
              {...register('nombre')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              autoFocus
            />
            {errors.nombre && <p className="text-[11px] text-red-400 mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Dirección de la Tienda *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-500">
                <MapPin className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="ej: Calle 21 de Calacoto Nº 8300"
                {...register('direccion')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            {errors.direccion && <p className="text-[11px] text-red-400 mt-1">{errors.direccion.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Teléfono de Contacto (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-500">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="+591 2 2791234"
                {...register('telefono')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="branch-activa"
              {...register('activa')}
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="branch-activa" className="text-xs text-zinc-300 font-semibold cursor-pointer">
              Sucursal Activa (Habilitada para ventas y personal)
            </label>
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : branchToEdit ? 'Actualizar Sucursal' : 'Crear Sucursal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

