import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Upload, Sparkles, Image as ImageIcon, Palette, Check, Building2 } from 'lucide-react';
import { productSchema, type ProductFormData } from '../../schemas/productSchema';
import type { Product, Category, Branch } from '../../types/domain';

export const TEXTILE_PALETTE = [
  { name: 'Negro', hex: '#111827' },
  { name: 'Blanco', hex: '#FFFFFF', isLight: true },
  { name: 'Beige / Nude', hex: '#D2B48C' },
  { name: 'Crema / Marfil', hex: '#FFFDD0', isLight: true },
  { name: 'Rojo Carmesí', hex: '#DC2626' },
  { name: 'Vinotinto', hex: '#7F1D1D' },
  { name: 'Palo de Rosa', hex: '#E0A899' },
  { name: 'Rosa Pastel', hex: '#F472B6' },
  { name: 'Fucsia / Magenta', hex: '#D946EF' },
  { name: 'Lila / Lavanda', hex: '#C084FC' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Azul Celeste', hex: '#38BDF8' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Verde Militar', hex: '#4D7C0F' },
  { name: 'Dorado / Mostaza', hex: '#D97706' },
  { name: 'Terracota', hex: '#C2410C' },
  { name: 'Café / Marrón', hex: '#451A03' },
  { name: 'Gris Plomo', hex: '#4B5563' }
];

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  categories: Category[];
  branches: Branch[];
  onClose: () => void;
  onSave: (data: ProductFormData, imageBlob?: Blob) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  categories,
  branches,
  onClose,
  onSave
}) => {
  const [selectedBlob, setSelectedBlob] = useState<Blob | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['TODAS']);
  const [selectedTallas, setSelectedTallas] = useState<string[]>(['M']);
  const [branchStocks, setBranchStocks] = useState<Record<string, number>>({});

  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ÚNICA'];

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
  const watchedColor = watch('color');
  const watchedColorHex = watch('colorHex');

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setSelectedBranches(
          productToEdit.sucursalesIds && productToEdit.sucursalesIds.length > 0 
            ? productToEdit.sucursalesIds 
            : (productToEdit.sucursalId ? [productToEdit.sucursalId] : ['TODAS'])
        );
        setSelectedTallas(
          productToEdit.tallas && productToEdit.tallas.length > 0
            ? productToEdit.tallas
            : (productToEdit.talla ? [productToEdit.talla] : ['M'])
        );
        setBranchStocks(productToEdit.stockPorSucursal || {});
        reset({
          nombre: productToEdit.nombre,
          descripcion: productToEdit.descripcion,
          precio: productToEdit.precio,
          stock: productToEdit.stock,
          categoriaId: productToEdit.categoriaId,
          talla: productToEdit.talla || '',
          color: productToEdit.color || 'Negro',
          colorHex: productToEdit.colorHex || '#111827',
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
        // Nuevo producto: generar código QR sugerido y por defecto en TODAS las sucursales
        setSelectedBranches(['TODAS']);
        setSelectedTallas(['S', 'M', 'L']);
        setBranchStocks({});
        const autoCode = `SAMU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        reset({
          nombre: '',
          descripcion: '',
          precio: 0,
          stock: 10,
          categoriaId: categories[0]?.id || '',
          talla: 'M',
          color: 'Negro',
          colorHex: '#111827',
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
      await onSave({
        ...data,
        tallas: selectedTallas,
        talla: selectedTallas.join(', '),
        stockPorSucursal: Object.keys(branchStocks).length > 0 ? branchStocks : undefined,
        sucursalesIds: selectedBranches.length > 0 ? selectedBranches : ['TODAS']
      }, selectedBlob);
      onClose();
    } catch (err) {
      console.error('Error guardando producto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div 
        className="relative w-full max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl max-h-[94vh] flex flex-col bg-[#121216] border border-[#d4af37]/35 rounded-2xl shadow-2xl overflow-hidden my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fijo arriba para cualquier monitor */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#181820] border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-white tracking-wide">
                {productToEdit ? 'Editar Prenda' : 'Nueva Prenda en Inventario'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                Selecciona color, carga fotografía y completa ficha técnica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scroll interno adaptable a pantallas bajas (laptops 768p, tablets, 1080p, 4K) */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
              
              {/* ================= COLUMNA IZQUIERDA: Paleta de Colores + Fotografía debajo ================= */}
              <div className="md:col-span-5 space-y-4">
                
                {/* 1. Paleta Interactiva de Colores */}
                <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <label className="text-xs font-bold text-white tracking-wide">
                        Paleta de Colores *
                      </label>
                    </div>
                    {/* Live Color Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 shrink-0">
                      <span 
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0"
                        style={{ backgroundColor: watchedColorHex || '#111827' }} 
                      />
                      <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-[90px]">
                        {watchedColor || 'Negro'}
                      </span>
                    </div>
                  </div>

                  {/* Swatches Grid Responsivo */}
                  <div>
                    <p className="text-[10px] text-zinc-400 mb-2">
                      Toca un color para asignarlo a la prenda:
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {TEXTILE_PALETTE.map((swatch) => {
                        const isSelected = (watchedColorHex || '').toLowerCase() === swatch.hex.toLowerCase();

                        return (
                          <button
                            type="button"
                            key={swatch.hex}
                            onClick={() => {
                              setValue('color', swatch.name, { shouldValidate: true });
                              setValue('colorHex', swatch.hex, { shouldValidate: true });
                            }}
                            title={`${swatch.name} (${swatch.hex})`}
                            className={`group relative w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-md ${
                              swatch.isLight ? 'border border-zinc-400/50' : 'border border-white/10'
                            } ${
                              isSelected 
                                ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#16161d] scale-110' 
                                : 'hover:ring-1 hover:ring-zinc-400'
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isSelected && (
                              <Check className={`w-3.5 h-3.5 ${swatch.isLight ? 'text-zinc-900' : 'text-white'}`} />
                            )}
                          </button>
                        );
                      })}

                      {/* Selector Libre / Rueda Hex */}
                      <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-700">
                        <label 
                          title="Seleccionar color libre con cuentagotas"
                          className="relative w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full border border-zinc-600 overflow-hidden cursor-pointer flex items-center justify-center bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 hover:scale-110 transition-transform shadow"
                        >
                          <input
                            type="color"
                            value={watchedColorHex || '#111827'}
                            onChange={(e) => {
                              setValue('colorHex', e.target.value, { shouldValidate: true });
                            }}
                            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <span className="text-[10px] text-zinc-400">Rueda</span>
                      </div>
                    </div>
                  </div>

                  {/* Inputs Nombre & Hex */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                        Nombre Tono
                      </label>
                      <input
                        type="text"
                        placeholder="ej: Vinotinto"
                        {...register('color')}
                        className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                        Código HEX
                      </label>
                      <input
                        type="text"
                        placeholder="#000000"
                        {...register('colorHex')}
                        className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Fotografía de la Prenda (DEBAJO DE LA PALETA) */}
                <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <label className="text-xs font-bold text-white tracking-wide">
                        Fotografía de la Prenda
                      </label>
                    </div>
                    {previewUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Foto cargada
                      </span>
                    )}
                  </div>

                  {/* Vista Previa Adaptable de la Imagen */}
                  <div className="relative w-full aspect-[4/3] max-h-52 sm:max-h-60 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center group shadow-inner">
                    {previewUrl ? (
                      <>
                        <img 
                          src={previewUrl} 
                          alt="Prenda Preview" 
                          className="w-full h-full object-cover" 
                        />

                        {/* Insignia del color seleccionado superpuesta en la imagen */}
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg">
                          <span 
                            className="w-3 h-3 rounded-full border border-white/30 shrink-0 shadow-sm"
                            style={{ backgroundColor: watchedColorHex || '#111827' }} 
                          />
                          <span className="text-[10px] font-bold text-white tracking-wide">
                            {watchedColor || 'Color Seleccionado'}
                          </span>
                        </div>

                        {/* Botón para quitar foto */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBlob(undefined);
                            setValue('fotoUrl', '');
                            setPreviewUrl('');
                          }}
                          title="Quitar foto"
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-500 p-3 text-center">
                        <ImageIcon className="w-8 h-8 mb-1.5 opacity-40 text-amber-400" />
                        <p className="text-xs font-semibold text-zinc-400">Sin fotografía</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Sube un archivo o pega un enlace</p>
                      </div>
                    )}
                  </div>

                  {/* Zona de Subida / Drag & Drop */}
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
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-amber-400/70 rounded-xl p-2.5 sm:p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/80"
                  >
                    <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <p className="text-xs text-zinc-200 font-semibold leading-tight">
                        {selectedBlob ? 'Cambiar archivo seleccionado' : 'Subir foto desde PC'}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-tight">
                        JPG, PNG, WEBP • Guardado en IndexedDB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Input URL Web alternativo */}
                  <div>
                    <input
                      type="url"
                      placeholder="O pegar URL web de foto (https://...)"
                      {...register('fotoUrl')}
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-400 placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              </div>

              {/* ================= COLUMNA DERECHA: Campos de Datos de la Prenda ================= */}
              <div className="md:col-span-7 space-y-4">
                {/* Nombre */}
                <div>
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

                {/* Categoría & Código QR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                </div>

                {/* Asignación de Sucursales de Venta */}
                <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sucursales de Venta *</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-300">
                      {selectedBranches.includes('TODAS') 
                        ? 'Disponible en Todas las Sucursales' 
                        : `${selectedBranches.length} de ${branches.length} seleccionadas`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBranches.includes('TODAS')) {
                          setSelectedBranches(branches.map(b => b.id));
                        } else {
                          setSelectedBranches(['TODAS']);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        selectedBranches.includes('TODAS')
                          ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      ✓ Vender en Todas las Sedes
                    </button>
                    {!selectedBranches.includes('TODAS') && (
                      <span className="text-[10px] text-zinc-500">
                        Marca las sucursales donde estará disponible:
                      </span>
                    )}
                  </div>

                  {!selectedBranches.includes('TODAS') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-zinc-800 animate-fade-in">
                      {branches.map(b => {
                        const isChecked = selectedBranches.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBranches([...selectedBranches.filter(id => id !== 'TODAS'), b.id]);
                                } else {
                                  const filtered = selectedBranches.filter(id => id !== b.id);
                                  setSelectedBranches(filtered.length === 0 ? ['TODAS'] : filtered);
                                }
                              }}
                              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="truncate">{b.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Precio & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Stock Global Total *
                    </label>
                    <input
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                      className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                    {errors.stock && <p className="text-[11px] text-red-400 mt-1">{errors.stock.message}</p>}
                  </div>
                </div>

                {/* Tallas Disponibles de la Prenda */}
                <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      Tallas Disponibles *
                    </label>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {selectedTallas.join(', ') || 'Ninguna'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_SIZES.map(sz => {
                      const isSelected = selectedTallas.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedTallas.length > 1) {
                                setSelectedTallas(selectedTallas.filter(s => s !== sz));
                              }
                            } else {
                              setSelectedTallas([...selectedTallas, sz]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-zinc-950 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                              : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Distribución de Stock por Sucursal (si hay más de 1 sucursal) */}
                {branches.length > 1 && (
                  <div className="bg-[#16161d] border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                    <label className="text-xs font-bold text-white block">
                      Stock Distribuido por Sucursal (Opcional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {branches.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2 rounded-xl bg-[#181820] border border-zinc-800">
                          <span className="text-xs text-zinc-300 truncate max-w-[120px]">{b.nombre}:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={branchStocks[b.id] ?? ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = { ...branchStocks, [b.id]: val };
                              setBranchStocks(updated);
                              // Auto sumar a stock total si el usuario lo desea
                              const totalCalculated = Object.values(updated).reduce((a, b) => a + b, 0);
                              if (totalCalculated > 0) {
                                setValue('stock', totalCalculated);
                              }
                            }}
                            className="w-20 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Descripción de la Prenda *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Detalles sobre tejido, caída, calce, ocasión y cuidados recomendados..."
                    {...register('descripcion')}
                    className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                  {errors.descripcion && <p className="text-[11px] text-red-400 mt-1">{errors.descripcion.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Footer buttons - Fijo abajo, siempre visible sin importar altura de pantalla */}
          <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-[#14141a] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center sm:text-left">
              * Datos, color y foto se guardan en IndexedDB local
            </p>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : productToEdit ? 'Actualizar Prenda' : 'Guardar Prenda'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
