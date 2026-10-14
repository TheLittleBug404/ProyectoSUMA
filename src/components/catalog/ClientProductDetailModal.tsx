import React, { useEffect, useState } from 'react';
import { X, QrCode as QrIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import type { Product, Category } from '../../types/domain';

interface ClientProductDetailModalProps {
  product: Product | null;
  category?: Category;
  onClose: () => void;
}

export const ClientProductDetailModal: React.FC<ClientProductDetailModalProps> = ({
  product,
  category,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [imgUrl, setImgUrl] = useState<string>('');

  useEffect(() => {
    if (!product) return;

    // Generar imagen QR
    QRCode.toDataURL(product.qrCode, { width: 220, margin: 1, color: { dark: '#1c1c1c', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(console.error);

    // Convertir Blob a ObjectURL si existe, o usar fotoUrl
    if (product.imagenBlob) {
      const url = URL.createObjectURL(product.imagenBlob);
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImgUrl(product.fotoUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800');
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#121216] border border-[#d4af37]/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-zinc-700 hover:border-amber-400 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image side */}
          <div className="relative aspect-[4/5] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <img
              src={imgUrl}
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
            {category && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-xs font-semibold bg-black/75 backdrop-blur-md border border-[#d4af37]/30 text-amber-300">
                {category.nombre}
              </span>
            )}
          </div>

          {/* Details side */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-wider text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  {product.qrCode}
                </span>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> En Stock ({product.stock})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    <AlertTriangle className="w-3 h-3" /> Agotado
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold font-serif text-white tracking-wide mb-2">
                {product.nombre}
              </h2>

              <p className="text-2xl font-bold text-amber-400 font-mono mb-4">
                Bs. {product.precio.toFixed(2)}
              </p>

              <p className="text-xs text-zinc-300 leading-relaxed mb-6">
                {product.descripcion}
              </p>

              {/* Talla & Color */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-lg bg-zinc-900/70 border border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Talla</span>
                  <span className="text-sm font-semibold text-zinc-100">{product.talla || 'Estándar'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Color</span>
                  <span className="text-sm font-semibold text-zinc-100">{product.color || 'Único'}</span>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="pt-4 border-t border-zinc-800 flex items-center gap-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-900">
              {qrDataUrl ? (
                <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 shadow">
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                  <QrIcon className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-amber-200">Código de Etiqueta QR</p>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                  Escaneable directamente en caja por el personal de tienda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
