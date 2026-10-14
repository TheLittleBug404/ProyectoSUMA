import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X, Download } from 'lucide-react';
import type { Product } from '../../types/domain';

interface PrintQREtiquetteModalProps {
  product: Product | null;
  onClose: () => void;
}

export const PrintQREtiquetteModal: React.FC<PrintQREtiquetteModalProps> = ({
  product,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!product) return;
    QRCode.toDataURL(product.qrCode, {
      width: 280,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [product]);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${product.qrCode}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181820] border-b border-zinc-800 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Etiqueta Imprimible de Prenda
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Hang Tag */}
        <div className="p-6 bg-white text-zinc-950 font-sans flex flex-col items-center text-center">
          {/* Header */}
          <div className="w-full pb-3 border-b-2 border-black">
            <h2 className="font-serif text-xl font-black tracking-widest text-black">SAMU</h2>
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-700">Samara Muriel</p>
          </div>

          {/* QR Code */}
          <div className="my-4 p-2 bg-white border-2 border-black rounded-lg">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 object-contain" />
            )}
          </div>

          {/* Barcode code */}
          <p className="font-mono text-xs font-bold tracking-widest text-black mb-3">
            {product.qrCode}
          </p>

          {/* Product details */}
          <div className="w-full pt-3 border-t-2 border-black space-y-1">
            <h3 className="text-sm font-bold text-black uppercase line-clamp-2">
              {product.nombre}
            </h3>
            
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-zinc-800">
              {product.talla && <span>TALLA: {product.talla}</span>}
              {product.color && <span>• COLOR: {product.color}</span>}
            </div>

            <p className="text-2xl font-black text-black font-mono pt-1">
              Bs. {product.precio.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#181820] border-t border-zinc-800 flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <Printer className="w-4 h-4" /> Imprimir Etiqueta
          </button>
          <button
            onClick={handleDownloadQR}
            title="Descargar solo imagen PNG"
            className="p-2.5 rounded-xl text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
