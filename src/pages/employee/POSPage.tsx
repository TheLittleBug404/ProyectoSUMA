import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Camera, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  AlertCircle, 
  ShoppingBag, 
  Sparkles,
  Barcode,
  RotateCcw,
  UserCheck,
  Percent,
  X
} from 'lucide-react';
import type { Product, Category, Sale, Customer } from '../../types/domain';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { categoryRepository } from '../../repositories/dexie/DexieCategoryRepository';
import { saleRepository } from '../../repositories/dexie/DexieSaleRepository';
import { branchRepository } from '../../repositories/dexie/DexieBranchRepository';
import { customerRepository } from '../../repositories/dexie/DexieCustomerRepository';
import { useCartStore } from '../../stores/useCartStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { QRScannerModal } from '../../components/pos/QRScannerModal';
import { TicketReceiptModal } from '../../components/pos/TicketReceiptModal';
import { ReturnExchangeModal } from '../../components/pos/ReturnExchangeModal';
import { VoidSaleModal } from '../../components/pos/VoidSaleModal';
import { Ban } from 'lucide-react';

export const POSPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    items,
    paymentMethod,
    cliente,
    descuentoPorcentaje,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setPaymentMethod,
    setCliente,
    setDescuentoPorcentaje,
    getSubtotal,
    getDescuentoMonto,
    getTotal,
    getItemCount,
    toSaleItems
  } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branchName, setBranchName] = useState<string>('Sucursal Principal');
  const [loading, setLoading] = useState(true);

  // Selected size per product card
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  // Selected color per product card
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({});

  // Filters for left catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Barcode input for USB scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeFeedback, setBarcodeFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [saleError, setSaleError] = useState('');

  // Cash change calculator helper
  const [cashGiven, setCashGiven] = useState<string>('');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const sucursalFiltro = user?.rol === 'ADMINISTRADOR' ? undefined : (user?.sucursalId || 'sucursal-principal-01');
      const [prods, cats, branch, custs] = await Promise.all([
        productRepository.getAll({ soloActivos: true, sucursalId: sucursalFiltro }),
        categoryRepository.getAll(),
        user?.sucursalId ? branchRepository.getById(user.sucursalId) : undefined,
        customerRepository.getAll()
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
      if (branch) setBranchName(branch.nombre);
    } catch (err) {
      console.error('Error cargando inventario en POS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Category map
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c.nombre]));
  }, [categories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.qrCode.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      list = list.filter(p => p.categoriaId === selectedCategory);
    }

    return list;
  }, [products, searchTerm, selectedCategory]);

  // Handle barcode / QR code scan
  const handleProcessCode = async (code: string): Promise<{ success: boolean; message?: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return { success: false };

    const product = await productRepository.getByQRCode(cleanCode);

    if (!product) {
      return { success: false, message: `Código "${cleanCode}" no encontrado` };
    }

    if (product.stock <= 0) {
      return { success: false, message: `"${product.nombre}" está agotado` };
    }

    const chosenSize = selectedSizes[product.id] || product.tallas?.[0] || product.talla || 'ÚNICA';
    let chosenColor: string | undefined = selectedColors[product.id];
    let chosenColorHex: string | undefined;

    if (product.colores && product.colores.length > 0) {
      const variant = product.colores.find(c => c.color === chosenColor) || product.colores.find(c => c.stock > 0) || product.colores[0];
      chosenColor = variant.color;
      chosenColorHex = variant.colorHex;
    } else {
      chosenColor = product.color;
      chosenColorHex = product.colorHex;
    }

    const res = addItem(product, 1, chosenSize, chosenColor, chosenColorHex);
    if (!res.success) {
      return { success: false, message: res.message };
    }

    return { 
      success: true, 
      message: `Agregado: ${product.nombre} (${chosenSize}${chosenColor ? ` - ${chosenColor}` : ''})` 
    };
  };

  // Submit barcode from text input (or laser USB scanner)
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const res = await handleProcessCode(barcodeInput);
    setBarcodeFeedback({
      msg: res.message || '',
      isError: !res.success
    });

    setBarcodeInput('');
    setTimeout(() => setBarcodeFeedback(null), 3000);
  };

  // Checkout submission
  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) return;

    try {
      setIsProcessingSale(true);
      setSaleError('');

      const saleData = {
        numeroTicket: `TICK-${Date.now().toString().slice(-6)}`,
        empleadoId: user.id,
        empleadoNombre: user.nombre,
        sucursalId: user.sucursalId || 'sucursal-principal-01',
        sucursalNombre: branchName,
        items: toSaleItems(),
        subtotal: getSubtotal(),
        descuentoPorcentaje: descuentoPorcentaje,
        descuentoMonto: getDescuentoMonto(),
        total: getTotal(),
        metodoPago: paymentMethod,
        clienteId: cliente?.id,
        clienteNombre: cliente?.nombre,
        clienteTelefono: cliente?.telefono,
        clienteDocumento: cliente?.documento
      };

      const newSale = await saleRepository.createSale(saleData);

      // Refrescar inventario local para reflejar nuevo stock descontado
      await loadInventory();

      setCompletedSale(newSale);
      clearCart();
      setCashGiven('');
    } catch (err: any) {
      console.error('Error registrando venta:', err);
      setSaleError(err.message || 'Error al procesar la venta en caja');
    } finally {
      setIsProcessingSale(false);
    }
  };

  const total = getTotal();
  const subtotal = getSubtotal();
  const descuentoMonto = getDescuentoMonto();
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - total);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Terminal Punto de Venta (POS)
              </h1>
              <p className="text-xs text-zinc-400">
                Cajero: <span className="text-amber-300 font-semibold">{user?.nombre}</span> • <span className="text-zinc-300">{branchName}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Button: Void Sale Modal */}
          <button
            onClick={() => setIsVoidModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-all cursor-pointer"
          >
            <Ban className="w-4 h-4" />
            <span>Anular Venta</span>
          </button>

          {/* Button: Return and Exchange Modal */}
          <button
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-pink-300 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Devoluciones / Cambios</span>
          </button>

          {/* Barcode USB Gun scanner input */}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 sm:w-60">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none flex items-center">
              <Barcode className="w-4 h-4" />
            </span>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanear o escribir QR..."
              className="w-full bg-[#18181f] border border-[#d4af37]/30 rounded-xl pl-11 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
            />
          </form>

          {/* Camera Scanner Trigger */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Escanear con Cámara</span>
          </button>
        </div>
      </div>

      {/* Barcode feedback alert */}
      {barcodeFeedback && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            barcodeFeedback.isError
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{barcodeFeedback.msg}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Catalog, Right Cart Drawer */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 7 Columns - Quick Product Browser */}
        <div className="lg:col-span-7 bg-[#121216] border border-zinc-800 rounded-2xl p-5 shadow-lg">
          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar prenda rápida..."
                className="w-full bg-[#18181f] border border-zinc-700 rounded-xl pl-11 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#18181f] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Products List / Grid */}
          <div className="max-h-[560px] overflow-y-auto pr-1 space-y-2.5">
            {loading ? (
              <div className="py-20 text-center text-xs text-zinc-400">
                Cargando inventario...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500">
                No hay prendas coincidentes con la búsqueda.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const availableSizes = p.tallas && p.tallas.length > 0 ? p.tallas : (p.talla ? [p.talla] : ['ÚNICA']);
                const currentPickedSize = selectedSizes[p.id] || availableSizes[0];

                const hasColorVariants = !!(p.colores && p.colores.length > 0);
                const availableColors = hasColorVariants ? p.colores! : [];
                const currentPickedColor = selectedColors[p.id] || (hasColorVariants ? availableColors[0].color : (p.color || ''));
                const currentVariant = hasColorVariants 
                  ? (availableColors.find(c => c.color === currentPickedColor) || availableColors[0])
                  : null;
                const currentPickedColorHex = currentVariant ? currentVariant.colorHex : (p.colorHex || '');

                // Calcular stock restante considerando el color elegido si hay variantes
                const variantStock = currentVariant ? currentVariant.stock : p.stock;
                const inCartVariantCount = items
                  .filter(i => i.product.id === p.id && (!currentPickedColor || i.color === currentPickedColor))
                  .reduce((acc, curr) => acc + curr.quantity, 0);
                const remainingStock = Math.max(0, variantStock - inCartVariantCount);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#18181f] border border-zinc-800 hover:border-amber-400/50 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={p.imagenBlob ? URL.createObjectURL(p.imagenBlob) : (p.fotoUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200")}
                          alt={p.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-100 truncate">{p.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                          <span className="font-mono text-amber-400/90">{p.qrCode}</span>
                          <span>•</span>
                          <span>{categoryMap.get(p.categoriaId)}</span>
                          {!hasColorVariants && p.color && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-zinc-300">
                                {p.colorHex && (
                                  <span 
                                    className="w-2 h-2 rounded-full border border-white/20 shrink-0" 
                                    style={{ backgroundColor: p.colorHex }} 
                                  />
                                )}
                                <span>{p.color}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Tallas selector pills on product card */}
                        {availableSizes.length > 1 ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-zinc-500">Talla:</span>
                            {availableSizes.map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSizes(prev => ({ ...prev, [p.id]: sz }));
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  currentPickedSize === sz
                                    ? 'bg-amber-400 text-zinc-950 shadow'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Talla: <span className="text-zinc-300 font-semibold">{availableSizes[0]}</span>
                          </p>
                        )}

                        {/* Colores selector pills on product card */}
                        {hasColorVariants && (
                          <div className="flex items-center flex-wrap gap-1 mt-1.5">
                            <span className="text-[10px] text-zinc-500">Color:</span>
                            {availableColors.map(c => {
                              const isSelected = (currentPickedColor === c.color);
                              const inCartThis = items
                                .filter(i => i.product.id === p.id && i.color === c.color)
                                .reduce((sum, item) => sum + item.quantity, 0);
                              const rem = Math.max(0, c.stock - inCartThis);

                              return (
                                <button
                                  key={c.color}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedColors(prev => ({ ...prev, [p.id]: c.color }));
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                                      : 'bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full border border-black/30 shrink-0"
                                    style={{ backgroundColor: c.colorHex }}
                                  />
                                  <span>{c.color}</span>
                                  <span className={`text-[9px] font-mono ${isSelected ? 'text-zinc-900 font-bold' : (rem > 0 ? 'text-zinc-400' : 'text-red-400')}`}>
                                    ({rem})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-400 font-mono">
                          Bs. {p.precio.toFixed(2)}
                        </p>
                        <p className={`text-[10px] font-semibold ${
                          remainingStock > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {remainingStock > 0 ? `${remainingStock} disp.` : 'Agotado'}
                        </p>
                      </div>

                      <button
                        onClick={() => addItem(p, 1, currentPickedSize, currentPickedColor, currentPickedColorHex)}
                        disabled={remainingStock <= 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400/15 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: 5 Columns - POS Cart & Payment Terminal */}
        <div className="lg:col-span-5 bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-serif text-white">Prendas en Venta</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {getItemCount()} items
                </span>
              </div>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Vaciar
                </button>
              )}
            </div>

            {/* Customer VIP Selector Section */}
            <div className="mb-3 p-2.5 rounded-xl bg-[#181820] border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cliente / Descuento VIP</span>
                </label>
                {cliente && (
                  <button
                    onClick={() => setCliente(null)}
                    className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Quitar
                  </button>
                )}
              </div>

              {cliente ? (
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs">
                  <div>
                    <p className="font-bold text-cyan-200">{cliente.nombre}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      {cliente.documento || cliente.telefono || 'Cliente Registrado'}
                    </p>
                  </div>
                  {cliente.descuentoFrecuente ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {cliente.descuentoFrecuente}% OFF VIP
                    </span>
                  ) : null}
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => {
                    const picked = customers.find(c => c.id === e.target.value);
                    if (picked) setCliente(picked);
                  }}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">Cliente Ocasional / General</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.documento ? `(${c.documento})` : ''} {c.descuentoFrecuente ? `• ${c.descuentoFrecuente}% OFF` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Error banner if checkout failed */}
            {saleError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{saleError}</span>
              </div>
            )}

            {/* Cart Item List */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 mb-4">
              {items.length === 0 ? (
                <div className="py-10 text-center text-zinc-500">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-xs font-semibold">El carrito está vacío</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Escanea una etiqueta o selecciona del catálogo</p>
                </div>
              ) : (
                items.map((item) => {
                  const maxStock = item.color && item.product.colores?.length
                    ? (item.product.colores.find(c => c.color.toLowerCase() === item.color?.toLowerCase())?.stock ?? item.product.stock)
                    : item.product.stock;

                  return (
                    <div
                      key={`${item.product.id}-${item.talla || ''}-${item.color || ''}`}
                      className="p-2.5 rounded-xl bg-[#18181f] border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-zinc-100 truncate">{item.product.nombre}</p>
                          {item.talla && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {item.talla}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                              {item.colorHex && (
                                <span 
                                  className="w-1.5 h-1.5 rounded-full border border-white/20 shrink-0" 
                                  style={{ backgroundColor: item.colorHex }} 
                                />
                              )}
                              {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          Bs. {item.product.precio.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Quantity stepper */}
                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.talla, item.color)}
                            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.talla, item.color)}
                            disabled={item.quantity >= maxStock}
                            className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold font-mono text-amber-400 w-16 text-right">
                          Bs. {item.subtotal.toFixed(2)}
                        </span>

                        <button
                          onClick={() => removeItem(item.product.id, item.talla, item.color)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Checkout & Payment Area */}
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'EFECTIVO'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                      : 'bg-[#18181f] text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Efectivo
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'QR'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'bg-[#18181f] text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Pago QR
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TARJETA')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'TARJETA'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow'
                      : 'bg-[#18181f] text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Tarjeta
                </button>
              </div>
            </div>

            {/* Discount row if applicable or adjustable */}
            <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-[#181820] border border-zinc-800">
              <span className="text-zinc-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>Descuento Promocional:</span>
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={descuentoPorcentaje || ''}
                  onChange={(e) => setDescuentoPorcentaje(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-12 bg-black border border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs focus:outline-none focus:border-amber-400"
                />
                <span className="text-zinc-400 text-xs">%</span>
              </div>
            </div>

            {/* Cash calculator helper if cash selected */}
            {paymentMethod === 'EFECTIVO' && total > 0 && (
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Efectivo Recibido:</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={total.toString()}
                    className="w-24 bg-black border border-zinc-700 rounded-lg px-2 py-1 text-right text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                {cashGivenNum > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                    <span className="text-zinc-400">Cambio a entregar:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Bs. {changeDue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Totals Breakdown and Checkout Action */}
            <div className="space-y-2 pt-1">
              {descuentoMonto > 0 && (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">Bs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Descuento ({descuentoPorcentaje}%):</span>
                    <span className="font-mono">- Bs. {descuentoMonto.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-1 border-t border-zinc-800">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Total a Cobrar</span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  Bs. {total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isProcessingSale}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessingSale ? (
                  <span>Registrando Venta...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>COBRAR VENTA ({items.length} prendas)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleProcessCode}
      />

      {/* Return & Exchange Modal */}
      <ReturnExchangeModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={() => {
          loadInventory();
        }}
      />

      {/* Void Sale Modal */}
      <VoidSaleModal
        isOpen={isVoidModalOpen}
        onClose={() => setIsVoidModalOpen(false)}
        onSuccess={(voided) => {
          loadInventory();
          setBarcodeFeedback({
            msg: `Venta #${voided.numeroTicket} anulada correctamente. Stock restituido.`,
            isError: false
          });
          setTimeout(() => setBarcodeFeedback(null), 4000);
        }}
      />

      {/* Ticket Receipt Modal on Sale Success */}
      <TicketReceiptModal
        sale={completedSale}
        cashierName={user?.nombre || 'Cajero'}
        branchName={branchName}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
};
