import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { playSuccessBeep } from '../../utils/audio';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<{ success: boolean; message?: string }>;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan
}) => {
  const [scanResult, setScanResult] = useState<{ text: string; isError?: boolean } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-viewport';
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsInitializing(true);
    setCameraError(null);
    setScanResult(null);
    isProcessingRef.current = false;

    // Esperar a que el DOM monte el div
    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 }
          },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            playSuccessBeep();
            const res = await onScan(decodedText);

            if (mounted) {
              setScanResult({
                text: res.message || `Código: ${decodedText}`,
                isError: !res.success
              });

              // Pausa de 1.5s antes de volver a escanear
              setTimeout(() => {
                isProcessingRef.current = false;
                setScanResult(null);
              }, 1500);
            }
          },
          () => {
            // Error de frame intermedio normal mientras enfoca
          }
        );

        if (mounted) setIsInitializing(false);
      } catch (err: any) {
        console.error('Error iniciando cámara:', err);
        if (mounted) {
          setIsInitializing(false);
          setCameraError(
            err.message || 'No se pudo acceder a la cámara. Verifique permisos o use entrada manual.'
          );
        }
      }
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
          }).catch(console.error);
        } else {
          scannerRef.current.clear();
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.2)] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#16161c]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Escáner QR de Prendas</h3>
              <p className="text-[10px] text-zinc-400">Apunta la cámara a la etiqueta del producto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport de Cámara */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-xl overflow-hidden border-2 border-dashed border-[#d4af37]/40 flex items-center justify-center">
            <div id={containerId} className="w-full h-full" />

            {isInitializing && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
                <span className="text-xs text-zinc-300">Iniciando cámara...</span>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 p-4 bg-black/90 flex flex-col items-center justify-center text-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-8 h-8" />
                <p className="font-semibold">{cameraError}</p>
                <p className="text-[11px] text-zinc-400">Puedes escribir el código QR abajo en la caja.</p>
              </div>
            )}
          </div>

          {/* Toast de Resultado de Escaneo */}
          {scanResult && (
            <div className={`mt-3 w-full p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fade-in ${
              scanResult.isError
                ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}>
              {scanResult.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              )}
              <span className="truncate">{scanResult.text}</span>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-[11px] text-zinc-400">
              El producto se añadirá al carrito automáticamente al ser detectado.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
};
