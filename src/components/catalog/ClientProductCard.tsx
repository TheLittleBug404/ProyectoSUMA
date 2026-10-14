import React, { useEffect, useState } from 'react';
import { Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Product, Category } from '../../types/domain';

interface ClientProductCardProps {
  product: Product;
  category?: Category;
  onSelect: (product: Product) => void;
}

export const ClientProductCard: React.FC<ClientProductCardProps> = ({
  product,
  category,
  onSelect
}) => {
  const [imgUrl, setImgUrl] = useState<string>('');

  useEffect(() => {
    if (product.imagenBlob) {
      const url = URL.createObjectURL(product.imagenBlob);
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImgUrl(product.fotoUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800');
    }
  }, [product.imagenBlob, product.fotoUrl]);

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative bg-[#121216]/90 border border-[#d4af37]/20 hover:border-[#d4af37]/60 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(212,175,55,0.2)] cursor-pointer flex flex-col justify-between"
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
        <img
          src={imgUrl}
          alt={product.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Category Badge */}
        {category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/80 backdrop-blur-md border border-[#d4af37]/30 text-amber-300">
            {category.nombre}
          </span>
        )}

        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3.5 py-2 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-4 h-4" /> Ver Detalles
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-zinc-400">
            {product.qrCode}
          </span>
          {product.stock > 0 ? (
            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {product.stock} disp.
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Agotado
            </span>
          )}
        </div>

        <h3 className="font-serif font-bold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
          {product.nombre}
        </h3>

        <div className="flex items-baseline justify-between mt-1">
          <span className="font-mono text-base font-bold text-amber-400">
            Bs. {product.precio.toFixed(2)}
          </span>
          {product.talla && (
            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
              Talla: {product.talla}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
