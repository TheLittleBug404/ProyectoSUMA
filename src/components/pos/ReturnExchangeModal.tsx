import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Banknote, 
  Shirt, 
  Printer 
} from 'lucide-react';
import { saleRepository } from '../../repositories/dexie/DexieSaleRepository';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { returnRepository } from '../../repositories/dexie/DexieReturnRepository';
import type { Sale, Product, SaleItem, SaleReturnItem } from '../../types/domain';
import { useAuthStore } from '../../stores/useAuthStore';

interface ReturnExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [ticketSearch, setTicketSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [saleFound, setSaleFound] = useState<Sale | null>(null);
  const [searchError, setSearchError] = useState('');

  // Return selection
  const [selectedSaleItem, setSelectedSaleItem] = useState<SaleItem | null>(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('Cambio de talla / modelo');

  // Operation type
  const [operationType, setOperationType] = useState<'DEVOLUCION_DINERO' | 'CAMBIO_PRENDA'>('DEVOLUCION_DINERO');

  // Exchange garment search
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<Product | null>(null);
  const [selectedExchangeSize, setSelectedExchangeSize] = useState('M');

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReturn, setCompletedReturn] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTicketSearch('');
      setSaleFound(null);
      setSearchError('');
      setSelectedSaleItem(null);
      setSelectedExchangeProduct(null);
      setCompletedReturn(null);
      loadInventory();
    }
  }, [isOpen]);

  const loadInventory = async () => {
    try {
      const prods = await productRepository.getAll({ soloActivos: true });
      setInventoryProducts(prods);
    } catch (err) {
      console.error('Error cargando inventario:', err);
    }
  };

  const handleSearchTicket = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ticketSearch.trim()) return;

    try {
      setSearching(true);
      setSearchError('');
      setSaleFound(null);
      setSelectedSaleItem(null);

      const allSales = await saleRepository.getSales();
      const cleanQuery = ticketSearch.trim().toUpperCase();
      const match = allSales.find(
        s => s.numeroTicket.toUpperCase() === cleanQuery || s.numeroTicket.toUpperCase().includes(cleanQuery)
      );

      if (!match) {
        setSearchError(`No se encontró ninguna venta con el ticket "${ticketSearch}"`);
      } else {
        setSaleFound(match);
        if (match.items.length > 0) {
          setSelectedSaleItem(match.items[0]);
          setReturnQty(1);
        }
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error buscando ticket');
    } finally {
      setSearching(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!saleFound || !selectedSaleItem || !user) return;

    try {
      setIsSubmitting(true);

      const returnItem: SaleReturnItem = {
        productoId: selectedSaleItem.productoId,
        nombreProducto: selectedSaleItem.nombreProducto,
        cantidad: returnQty,
        precioUnitario: selectedSaleItem.precioUnitario,
        talla: selectedSaleItem.talla,
        motivo: returnReason
      };

      const montoDevuelto = selectedSaleItem.precioUnitario * returnQty;
      let itemsNuevos: SaleItem[] | undefined = undefined;
      let diferenciaCobrada = 0;

      if (operationType === 'CAMBIO_PRENDA' && selectedExchangeProduct) {
        itemsNuevos = [
          {
            productoId: selectedExchangeProduct.id,
            nombreProducto: selectedExchangeProduct.nombre,
            cantidad: 1,
            precioUnitario: selectedExchangeProduct.precio,
            subtotal: selectedExchangeProduct.precio,
            talla: selectedExchangeSize,
            color: selectedExchangeProduct.color
          }
        ];
        // Diferencia: precio nueva prenda - monto prenda devuelta
        diferenciaCobrada = selectedExchangeProduct.precio - montoDevuelto;
      }

      const res = await returnRepository.createReturn({
        ventaId: saleFound.id,
        numeroTicketOriginal: saleFound.numeroTicket,
        empleadoId: user.id,
        empleadoNombre: user.nombre,
        sucursalId: user.sucursalId || 'sucursal-principal-01',
        sucursalNombre: saleFound.sucursalNombre || 'Principal',
        tipo: operationType,
        itemsDevueltos: [returnItem],
        montoDevuelto: operationType === 'DEVOLUCION_DINERO' ? montoDevuelto : 0,
        itemsNuevos,
        diferenciaCobrada
      });

      setCompletedReturn(res);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error al procesar la devolución');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#121216] border border-[#d4af37]/35 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-[#181820]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
              <RotateCcw className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold font-serif text-white">
                Módulo de Cambios y Devoluciones
              </h2>
              <p className="text-[11px] text-zinc-400">
                Reingreso de prendas a inventario y ajuste de caja registradora
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

        {completedReturn ? (
          /* Success Receipt Card */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">¡Transacción Registrada con Éxito!</h3>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Comprobante: <span className="text-amber-400 font-bold">{completedReturn.numeroDevolucion}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#181820] border border-zinc-800 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-zinc-400">
                <span>Ticket Original:</span>
                <span className="font-mono text-white">{completedReturn.numeroTicketOriginal}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tipo Operación:</span>
                <span className="font-bold text-amber-300">
                  {completedReturn.tipo === 'DEVOLUCION_DINERO' ? 'Devolución de Efectivo' : 'Cambio de Prenda'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Prenda Devuelta:</span>
                <span className="text-white">
                  {completedReturn.itemsDevueltos[0]?.cantidad}x {completedReturn.itemsDevueltos[0]?.nombreProducto}
                </span>
              </div>
              {completedReturn.tipo === 'DEVOLUCION_DINERO' ? (
                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-zinc-800">
                  <span>Monto Reembolsado:</span>
                  <span>Bs. {completedReturn.montoDevuelto.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-zinc-800">
                  <span>Diferencia Cobrada / Ajuste:</span>
                  <span>Bs. {completedReturn.diferenciaCobrada.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir Comprobante
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Step 1: Ticket Search Form */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Paso 1: Número de Ticket de Venta *
              </label>
              <form onSubmit={handleSearchTicket} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Ej: TICK-123456"
                    className="w-full bg-[#181820] border border-zinc-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !ticketSearch.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar</span>
                </button>
              </form>

              {searchError && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchError}
                </p>
              )}
            </div>

            {/* Step 2: Sale Items Selector */}
            {saleFound && (
              <div className="p-4 rounded-xl bg-[#181820] border border-zinc-800 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                  <span className="font-bold text-white">Venta: {saleFound.numeroTicket}</span>
                  <span className="text-zinc-400 font-mono">
                    {new Date(saleFound.fecha).toLocaleDateString('es-BO')} • Total: Bs. {saleFound.total.toFixed(2)}
                  </span>
                </div>

                <label className="block text-[11px] font-semibold text-zinc-400 uppercase">
                  Selecciona la prenda que devuelve el cliente:
                </label>

                <div className="space-y-1.5">
                  {saleFound.items.map((it, idx) => {
                    const isSelected = selectedSaleItem?.productoId === it.productoId;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedSaleItem(it);
                          setReturnQty(1);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/40 text-white'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shirt className="w-4 h-4 text-amber-400" />
                          <div>
                            <p className="font-semibold">{it.nombreProducto}</p>
                            <p className="text-[10px] text-zinc-400">
                              Cant: {it.cantidad} {it.talla ? `• Talla: ${it.talla}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-amber-300">
                          Bs. {it.precioUnitario.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {selectedSaleItem && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                        Cantidad a devolver:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedSaleItem.cantidad}
                        value={returnQty}
                        onChange={(e) => setReturnQty(Math.min(selectedSaleItem.cantidad, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-400 mb-1">
                        Motivo del cambio/devolución:
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="Cambio de talla / modelo">Cambio de talla / modelo</option>
                        <option value="Defecto de fábrica o costura">Defecto de fábrica o costura</option>
                        <option value="Cliente no satisfecho con prenda">Cliente no satisfecho con prenda</option>
                        <option value="Otro motivo">Otro motivo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Operation Mode (Refund vs Exchange) */}
            {selectedSaleItem && (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-zinc-300">
                  Paso 2: Tipo de Solución
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOperationType('DEVOLUCION_DINERO')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      operationType === 'DEVOLUCION_DINERO'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow'
                        : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Devolver Efectivo
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperationType('CAMBIO_PRENDA')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      operationType === 'CAMBIO_PRENDA'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow'
                        : 'bg-[#181820] border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" /> Cambio de Prenda
                  </button>
                </div>

                {operationType === 'CAMBIO_PRENDA' && (
                  <div className="p-3.5 rounded-xl bg-[#181820] border border-amber-500/30 space-y-3 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-amber-300 uppercase">
                      Selecciona la nueva prenda que se lleva el cliente:
                    </label>

                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => setExchangeSearch(e.target.value)}
                      placeholder="Buscar por nombre en catálogo..."
                      className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {inventoryProducts
                        .filter(p => !exchangeSearch || p.nombre.toLowerCase().includes(exchangeSearch.toLowerCase()))
                        .map(p => {
                          const isPicked = selectedExchangeProduct?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedExchangeProduct(p);
                                if (p.tallas && p.tallas.length > 0) setSelectedExchangeSize(p.tallas[0]);
                              }}
                              className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer ${
                                isPicked
                                  ? 'bg-amber-400 text-zinc-950 font-bold border-amber-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{p.nombre}</span>
                              <span className="font-mono">Bs. {p.precio.toFixed(2)}</span>
                            </div>
                          );
                        })}
                    </div>

                    {selectedExchangeProduct && (
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                        <span className="text-zinc-300">Talla para la nueva prenda:</span>
                        <div className="flex gap-1">
                          {(selectedExchangeProduct.tallas || ['S', 'M', 'L']).map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setSelectedExchangeSize(sz)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                selectedExchangeSize === sz ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Balance Summary */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-zinc-400">Prenda a favor del cliente:</p>
                    <p className="font-bold text-emerald-400 font-mono">
                      - Bs. {(selectedSaleItem.precioUnitario * returnQty).toFixed(2)}
                    </p>
                  </div>

                  {operationType === 'CAMBIO_PRENDA' && selectedExchangeProduct && (
                    <div className="text-right">
                      <p className="text-zinc-400">Nueva prenda:</p>
                      <p className="font-bold text-amber-400 font-mono">
                        + Bs. {selectedExchangeProduct.precio.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="text-right border-l border-zinc-800 pl-4">
                    <p className="text-zinc-400 font-bold uppercase text-[10px]">
                      {operationType === 'DEVOLUCION_DINERO' 
                        ? 'Total a devolver al cliente:' 
                        : (selectedExchangeProduct?.precio || 0) >= (selectedSaleItem.precioUnitario * returnQty)
                          ? 'Cliente paga diferencia:'
                          : 'Devolver saldo al cliente:'}
                    </p>
                    <p className="text-sm font-black text-white font-mono">
                      Bs. {operationType === 'DEVOLUCION_DINERO'
                        ? (selectedSaleItem.precioUnitario * returnQty).toFixed(2)
                        : Math.abs((selectedExchangeProduct?.precio || 0) - (selectedSaleItem.precioUnitario * returnQty)).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  disabled={isSubmitting || (operationType === 'CAMBIO_PRENDA' && !selectedExchangeProduct)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Procesando Reingreso...'
                      : operationType === 'DEVOLUCION_DINERO'
                        ? 'CONFIRMAR REEMBOLSO Y REINGRESAR PRENDA'
                        : 'CONFIRMAR CAMBIO DE PRENDA'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

