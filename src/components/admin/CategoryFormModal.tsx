import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Tags, Sparkles } from 'lucide-react';
import { categorySchema, type CategoryFormData } from '../../schemas/categorySchema';
import type { Category } from '../../types/domain';

interface CategoryFormModalProps {
  isOpen: boolean;
  categoryToEdit?: Category | null;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  categoryToEdit,
  onClose,
  onSave
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema)
  });

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        reset({
          nombre: categoryToEdit.nombre,
          descripcion: categoryToEdit.descripcion || ''
        });
      } else {
        reset({
          nombre: '',
          descripcion: ''
        });
      }
    }
  }, [isOpen, categoryToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Error guardando categoría:', err);
    } finally {
      setIsSubmitting(false);
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
            <Tags className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              placeholder="ej: Vestidos de Gala"
              {...register('nombre')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            {errors.nombre && <p className="text-[11px] text-red-400 mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descripción Opcional
            </label>
            <textarea
              rows={2}
              placeholder="Detalle o descripción de la línea..."
              {...register('descripcion')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : categoryToEdit ? 'Actualizar' : 'Crear'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
