import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { productSchema, type ProductFormData } from '../../schemas/productSchema';
import type { Product, Category } from '../../types/domain';

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: ProductFormData, imageBlob?: Blob) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  categories,
  onClose,
  onSave
}) => {
  const [selectedBlob, setSelectedBlob] = useState<Blob | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema)
  });

  const watchedFotoUrl = watch('fotoUrl');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        reset({
          nombre: productToEdit.nombre,
          descripcion: productToEdit.descripcion,
          precio: productToEdit.precio,
          stock: productToEdit.stock,
          categoriaId: productToEdit.categoriaId,
          talla: productToEdit.talla || '',
          color: productToEdit.color || '',
          qrCode: productToEdit.qrCode,
          fotoUrl: productToEdit.fotoUrl || ''
        });

        if (productToEdit.imagenBlob) {
          setSelectedBlob(productToEdit.imagenBlob);
          setPreviewUrl(URL.createObjectURL(productToEdit.imagenBlob));
        } else if (productToEdit.fotoUrl) {
          setSelectedBlob(undefined);
          setPreviewUrl(productToEdit.fotoUrl);
        } else {
          setSelectedBlob(undefined);
          setPreviewUrl('');
        }
      } else {
        // Nuevo producto: generar código QR sugerido
        const autoCode = `SAMU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        reset({
          nombre: '',
          descripcion: '',
          precio: 0,
          stock: 10,
          categoriaId: categories[0]?.id || '',
          talla: 'M',
          color: 'Negro',
          qrCode: autoCode,
          fotoUrl: ''
        });
        setSelectedBlob(undefined);
        setPreviewUrl('');
      }
    }
  }, [isOpen, productToEdit, categories, reset]);

  // Si cambia la URL web y no hay un archivo Blob subido, actualizar el preview automáticamente
  useEffect(() => {
    if (!selectedBlob) {
      setPreviewUrl(watchedFotoUrl || '');
    }
  }, [watchedFotoUrl, selectedBlob]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSubmitting(true);
      await onSave(data, selectedBlob);
      onClose();
    } catch (err) {
      console.error('Error guardando producto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl my-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181820] border-b border-zinc-800">
          <h3 className="text-base font-bold font-serif text-white tracking-wide">
            {productToEdit ? 'Editar Prenda' : 'Nueva Prenda en Inventario'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nombre de la Prenda *
              </label>
              <input
                type="text"
                placeholder="ej: Vestido Satinado Samara"
                {...register('nombre')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              {errors.nombre && <p className="text-[11px] text-red-400 mt-1">{errors.nombre.message}</p>}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Categoría *
              </label>
              <select
                {...register('categoriaId')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.categoriaId && <p className="text-[11px] text-red-400 mt-1">{errors.categoriaId.message}</p>}
            </div>

            {/* Código QR */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Código QR / Barras *
              </label>
              <input
                type="text"
                placeholder="SAMU-XXXX-000"
                {...register('qrCode')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Precio de Venta (Bs.) *
              </label>
              <input
                type="number"
                step="0.5"
                {...register('precio', { valueAsNumber: true })}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
              {errors.precio && <p className="text-[11px] text-red-400 mt-1">{errors.precio.message}</p>}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Stock Inicial *
              </label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
              {errors.stock && <p className="text-[11px] text-red-400 mt-1">{errors.stock.message}</p>}
            </div>

            {/* Talla */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Talla
              </label>
              <input
                type="text"
                placeholder="S, M, L, 28, 30..."
                {...register('talla')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Color
              </label>
              <input
                type="text"
                placeholder="ej: Negro, Oro, Terracota..."
                {...register('color')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Descripción de la Prenda *
              </label>
              <textarea
                rows={2}
                placeholder="Detalles sobre tejido, caída, calce y cuidados..."
                {...register('descripcion')}
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
              {errors.descripcion && <p className="text-[11px] text-red-400 mt-1">{errors.descripcion.message}</p>}
            </div>

            {/* Fotografía: URL Web o Archivo Local */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                Fotografía de la Prenda
              </label>

              {/* Input URL Web */}
              <div>
                <input
                  type="url"
                  placeholder="Pegar enlace de imagen web (ej: https://images.unsplash.com/...)"
                  {...register('fotoUrl')}
                  className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-zinc-500"
                />
              </div>

              {/* Subir archivo desde PC o vista previa */}
              <div className="flex items-center gap-4 pt-1">
                <div className="w-20 h-24 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative group">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBlob(undefined);
                          setValue('fotoUrl', '');
                          setPreviewUrl('');
                        }}
                        title="Quitar foto"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-7 h-7 text-zinc-600" />
                  )}
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setSelectedBlob(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="flex-1 border-2 border-dashed border-zinc-700 hover:border-amber-400/70 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-zinc-900/30 hover:bg-zinc-900/60"
                >
                  <Upload className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-xs text-zinc-200 font-semibold">
                    {selectedBlob ? 'Cambiar archivo local seleccionado' : 'O subir archivo desde tu computadora'}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Soporta JPG, PNG, WEBP • Guardado local en IndexedDB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : productToEdit ? 'Actualizar Prenda' : 'Crear Prenda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
