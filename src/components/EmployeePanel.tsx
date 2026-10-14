import React, { useState, useMemo } from 'react';
import { 
  Search, 
  QrCode, 
  Eye, 
  ShoppingCart, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  UserCheck, 
  X,
  Store
} from 'lucide-react';
import type { Product, CartItem, User, Worker } from '../types';
import samuLogo from '../assets/samu-logo.jpg';

interface EmployeePanelProps {
  user: User;
  products: Product[];
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  workers: Worker[];
  onRecordSale: (workerId: string, amount: number) => void;
  onOpenStorefront?: () => void;
}

export const EmployeePanel: React.FC<EmployeePanelProps> = ({
  user,
  products,
  workers,
  onRecordSale,
}) => {
  // Find current worker profile
  const currentWorker = useMemo(() => {
    return workers.find(w => w.username.toLowerCase() === user.username.toLowerCase() || w.id === user.workerId) || {
      id: user.workerId || 'w_temp',
      name: user.name || user.username,
      username: user.username,
      role: 'Vendedor / Atención en Tienda',
      branch: user.branch || 'La Paz - El Prado',
      salesThisMonth: 0,
      transactions: 0,
      status: 'Activo' as const
    };
  }, [workers, user]);

  // Search & Filter State for Stock
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock'>('all');

  // Product Presentation Modal
  const [presentationProduct, setPresentationProduct] = useState<Product | null>(null);
  const [presentationColor, setPresentationColor] = useState<{ name: string; hex: string; imageUrl?: string } | null>(null);
  const [presentationSize, setPresentationSize] = useState<string>('');

  // POS Basket State (Venta Directa del Empleado)
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  
  // QR Payment Flow State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrRefCode, setQrRefCode] = useState('');
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: string;
    date: string;
    items: CartItem[];
    subtotal: number;
    total: number;
    discount: number;
    refCode: string;
    sellerName: string;
    branch: string;
  } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchStock = stockFilter === 'all' 
        ? true 
        : stockFilter === 'inStock' 
          ? p.inStock 
          : !p.inStock;
      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Open presentation
  const handleOpenPresentation = (product: Product) => {
    setPresentationProduct(product);
    setPresentationColor(product.colors[0] || null);
    setPresentationSize(product.sizes[0] || '');
  };

  // Add item to POS Cart
  const handleAddToPosCart = (product: Product, color = product.colors[0], size = product.sizes[0], qty = 1) => {
    const itemUniqueId = `pos-${product.id}-${color.name}-${size}`;
    setPosCart(prev => {
      const existing = prev.find(item => item.id === itemUniqueId);
      if (existing) {
        return prev.map(item => 
          item.id === itemUniqueId ? { ...item, quantity: item.quantity + qty } : item
        );
      } else {
        return [...prev, {
          id: itemUniqueId,
          product,
          selectedColor: color,
          selectedSize: size,
          quantity: qty
        }];
      }
    });
  };

  const handleUpdatePosQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setPosCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setPosCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
    }
  };

  const handleRemovePosItem = (itemId: string) => {
    setPosCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Cart Calculations
  const posSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => {
      const price = item.quantity >= item.product.minWholesaleQty 
        ? item.product.priceWholesale 
        : item.product.priceRetail;
      return sum + (price * item.quantity);
    }, 0);
  }, [posCart]);

  const posRetailTotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + (item.product.priceRetail * item.quantity), 0);
  }, [posCart]);

  const posDiscount = posRetailTotal - posSubtotal;

  // Process QR Payment
  const handleOpenQRPayment = () => {
    if (posCart.length === 0) return;
    setQrRefCode('QR-' + Math.floor(100000 + Math.random() * 900000));
    setIsQRModalOpen(true);
  };

  const handleConfirmQRPayment = () => {
    if (!qrRefCode.trim()) return;
    setIsProcessingQR(true);

    setTimeout(() => {
      const receiptData = {
        receiptNumber: 'REC-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' }),
        items: [...posCart],
        subtotal: posRetailTotal,
        total: posSubtotal,
        discount: posDiscount,
        refCode: qrRefCode,
        sellerName: currentWorker.name,
        branch: currentWorker.branch
      };

      // Record sale in worker performance
      onRecordSale(currentWorker.id, posSubtotal);

      setLastReceipt(receiptData);
      setPosCart([]);
      setIsProcessingQR(false);
      setIsQRModalOpen(false);
    }, 1200);
  };

  return (
    <div style={{ padding: '0 5%', marginBottom: '80px' }} className="animate-fade-in">
      {/* Employee Top Profile & Metrics Banner */}
      <div 
        className="glass-card" 
        style={{
          padding: '24px 30px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 18, 22, 0.85) 100%)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            padding: '2px',
            background: 'var(--accent-gradient)',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img src={samuLogo} alt="SAMU" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                Terminal de Empleado
              </h1>
              <span className="badge badge-wholesale" style={{ fontSize: '0.75rem' }}>
                <UserCheck size={12} style={{ marginRight: '4px' }} /> {currentWorker.role}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
              Atendiendo: <strong style={{ color: 'var(--text-primary)' }}>{currentWorker.name}</strong> &bull; Sucursal: <strong style={{ color: 'var(--text-gold)' }}>{currentWorker.branch}</strong>
            </p>
          </div>
        </div>

        {/* Worker quick stats */}
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid var(--border-color)',
            padding: '10px 18px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ventas del Mes
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', margin: '2px 0 0 0' }}>
              Bs. {currentWorker.salesThisMonth.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{
            background: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid var(--border-color)',
            padding: '10px 18px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Transacciones
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
              {currentWorker.transactions}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: Stock Search & POS Order Cart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '30px',
        alignItems: 'start'
      }}>
        {/* Left Column: Stock Search & Product List */}
        <div>
          {/* Search and Filters */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--accent-primary)'
                }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar prenda por nombre, modelo, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '44px' }}
                />
              </div>

              {/* In Stock toggle */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: stockFilter === 'all' ? 'var(--accent-gradient)' : undefined,
                    color: stockFilter === 'all' ? '#0b0b0c' : undefined,
                    fontWeight: stockFilter === 'all' ? 700 : 500
                  }}
                >
                  Todo ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('inStock')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: stockFilter === 'inStock' ? 'var(--accent-gradient)' : undefined,
                    color: stockFilter === 'inStock' ? '#0b0b0c' : undefined,
                    fontWeight: stockFilter === 'inStock' ? 700 : 500
                  }}
                >
                  En Stock ({products.filter(p => p.inStock).length})
                </button>
              </div>
            </div>

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="btn btn-secondary"
                  style={{
                    padding: '5px 14px',
                    fontSize: '0.8rem',
                    borderRadius: '999px',
                    background: selectedCategory === cat ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                    borderColor: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--border-color)',
                    color: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === cat ? 700 : 500
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Stock Table / Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className="glass-card" 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{
                      width: '84px',
                      height: '96px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      background: 'var(--product-img-bg)',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge badge-retail" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {p.category}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: p.inStock ? 'var(--success-bg)' : 'rgba(239, 68, 68, 0.15)',
                        color: p.inStock ? 'var(--success)' : 'var(--danger)',
                        border: p.inStock ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {p.inStock ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>

                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: 700, 
                      color: 'var(--text-primary)', 
                      margin: '6px 0 2px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {p.name}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Modelo: {p.model}
                    </p>
                  </div>
                </div>

                {/* Pricing & Stock Details */}
                <div style={{
                  background: 'var(--card-subtle-bg)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Menor (u.)</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Bs. {p.priceRetail.toFixed(2)}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-gold)', fontSize: '0.72rem', display: 'block' }}>Mayor (&ge;{p.minWholesaleQty}u)</span>
                    <strong style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>Bs. {p.priceWholesale.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Color and size badges preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {p.colors.map((c, i) => (
                      <span
                        key={i}
                        title={c.name}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {p.sizes.slice(0, 4).map((s, i) => (
                      <span key={i} style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenPresentation(p)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', gap: '4px' }}
                    title="Mostrar prenda con detalle al cliente"
                  >
                    <Eye size={13} color="var(--accent-primary)" /> Mostrar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToPosCart(p)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.8rem', gap: '4px' }}
                  >
                    <Plus size={13} /> Cobrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: POS Venta Directa & Cobro QR Terminal */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="var(--accent-primary)" />
                Venta en Mostrador
              </h3>
              {posCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPosCart([])}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart items list */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {posCart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 10px', color: 'var(--text-muted)' }}>
                  <Store size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sin prendas seleccionadas</p>
                  <p style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    Agrega prendas desde el catálogo para iniciar el cobro por QR.
                  </p>
                </div>
              ) : (
                posCart.map((item) => {
                  const isWholesale = item.quantity >= item.product.minWholesaleQty;
                  const unitPrice = isWholesale ? item.product.priceWholesale : item.product.priceRetail;
                  const itemTotal = unitPrice * item.quantity;

                  return (
                    <div 
                      key={item.id}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'var(--card-subtle-bg)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        style={{ width: '42px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product.name}
                        </h5>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.selectedSize} &bull; {item.selectedColor.name}
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isWholesale ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            Bs. {itemTotal.toFixed(2)}
                          </span>
                          {isWholesale && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-gold)', fontWeight: 600 }}>
                              (Mayor)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdatePosQty(item.id, item.quantity - 1)}
                          style={{ padding: '3px 6px', border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: '0.82rem', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePosQty(item.id, item.quantity + 1)}
                          style={{ padding: '3px 6px', border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePosItem(item.id)}
                          style={{ padding: '3px 6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calculations and Single QR Checkout */}
            {posCart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Subtotal:</span>
                    <span>Bs. {posRetailTotal.toFixed(2)}</span>
                  </div>
                  {posDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                      <span>Descuento por Mayor:</span>
                      <span>- Bs. {posDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '2px' }}>
                    <span>Total a Cobrar:</span>
                    <span>Bs. {posSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenQRPayment}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '50px',
                    fontSize: '0.98rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  <QrCode size={20} />
                  Cobrar por QR Simple
                </button>
              </div>
            )}
          </div>

          {/* Last Digital Receipt Quick Preview */}
          {lastReceipt && (
            <div 
              className="glass-card animate-scale-up" 
              style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Venta Registrada
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lastReceipt.receiptNumber}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                Monto cobrado: <strong style={{ color: 'var(--accent-primary)' }}>Bs. {lastReceipt.total.toFixed(2)}</strong>
              </p>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                Código QR: {lastReceipt.refCode} &bull; {lastReceipt.date}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Presentation Modal (Mostrar Producto al Cliente) */}
      {presentationProduct && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setPresentationProduct(null)}>
          <div 
            className="glass-card animate-scale-up" 
            style={{
              width: '100%',
              maxWidth: '860px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              overflow: 'hidden',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              border: '1px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPresentationProduct(null)}
              className="btn btn-secondary" 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                borderRadius: '50%',
                padding: '8px',
                zIndex: 20
              }}
            >
              <X size={18} />
            </button>

            {/* Product Image */}
            <div style={{ position: 'relative', height: '100%', minHeight: '380px', background: 'var(--product-img-bg)' }}>
              <img 
                src={(presentationColor && presentationColor.imageUrl) || presentationProduct.imageUrl} 
                alt={presentationProduct.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'linear-gradient(transparent, rgba(10, 10, 12, 0.95))',
                padding: '24px',
                color: '#fff'
              }}>
                <span className="badge badge-wholesale" style={{ marginBottom: '8px' }}>
                  {presentationProduct.model}
                </span>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 800, margin: 0 }}>
                  {presentationProduct.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                  SAMU Confecciones &bull; Categoría: {presentationProduct.category}
                </p>
              </div>
            </div>

            {/* Presentation Controls */}
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <span className="badge badge-retail" style={{ marginBottom: '8px' }}>
                  Vista para el Cliente
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  {presentationProduct.description}
                </p>
              </div>

              {/* Color Select */}
              <div style={{ marginBottom: '18px' }}>
                <span className="form-label" style={{ fontSize: '0.85rem' }}>
                  Colores disponibles: <strong style={{ color: 'var(--text-primary)' }}>{presentationColor?.name}</strong>
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {presentationProduct.colors.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPresentationColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        border: presentationColor?.name === c.name ? '2px solid #fff' : '2px solid transparent',
                        outline: presentationColor?.name === c.name ? '2px solid var(--accent-primary)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={c.name}
                    >
                      {presentationColor?.name === c.name && (
                        <Check size={14} color={c.hex === '#F9F6F0' ? '#000' : '#fff'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Select */}
              <div style={{ marginBottom: '20px' }}>
                <span className="form-label" style={{ fontSize: '0.85rem' }}>Talla:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {presentationProduct.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPresentationSize(s)}
                      style={{
                        minWidth: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: presentationSize === s ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        background: presentationSize === s ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                        color: presentationSize === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price rules callout */}
              <div style={{
                background: 'var(--card-subtle-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                textAlign: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio por Unidad</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                    Bs. {presentationProduct.priceRetail.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gold)' }}>Por Mayor (&ge;{presentationProduct.minWholesaleQty}u)</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--accent-primary)' }}>
                    Bs. {presentationProduct.priceWholesale.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Add to current POS order button */}
              <button
                type="button"
                onClick={() => {
                  if (presentationColor) {
                    handleAddToPosCart(presentationProduct, presentationColor, presentationSize, 1);
                    setPresentationProduct(null);
                  }
                }}
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', marginTop: 'auto' }}
              >
                <Plus size={16} /> Añadir a la Venta Directa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ONLY QR Payment Terminal for Employee */}
      {isQRModalOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => !isProcessingQR && setIsQRModalOpen(false)}>
          <div 
            className="glass-card animate-scale-up" 
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '32px 28px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isProcessingQR && (
              <button 
                onClick={() => setIsQRModalOpen(false)}
                className="btn btn-secondary" 
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  borderRadius: '50%',
                  padding: '8px'
                }}
              >
                <X size={16} />
              </button>
            )}

            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '14px'
            }}>
              <QrCode size={28} color="#0b0b0c" />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Cobro QR Simple
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Muestre el código QR al cliente para escanear con su aplicación bancaria.
            </p>

            {/* QR Code Container */}
            <div style={{
              background: '#ffffff',
              padding: '18px',
              borderRadius: '16px',
              display: 'inline-block',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              marginBottom: '20px',
              border: '3px solid var(--accent-primary)'
            }}>
              {/* Dynamic QR SVG Generator */}
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* QR Pattern Simulation with High-Res aesthetics */}
                <rect width="200" height="200" fill="#ffffff" />
                {/* Corner Top-Left */}
                <rect x="15" y="15" width="50" height="50" fill="#000000" rx="6" />
                <rect x="23" y="23" width="34" height="34" fill="#ffffff" rx="3" />
                <rect x="31" y="31" width="18" height="18" fill="#000000" rx="2" />
                
                {/* Corner Top-Right */}
                <rect x="135" y="15" width="50" height="50" fill="#000000" rx="6" />
                <rect x="143" y="23" width="34" height="34" fill="#ffffff" rx="3" />
                <rect x="151" y="31" width="18" height="18" fill="#000000" rx="2" />
                
                {/* Corner Bottom-Left */}
                <rect x="15" y="135" width="50" height="50" fill="#000000" rx="6" />
                <rect x="23" y="143" width="34" height="34" fill="#ffffff" rx="3" />
                <rect x="31" y="151" width="18" height="18" fill="#000000" rx="2" />
                
                {/* QR Grid Dots & Data Patterns */}
                <rect x="75" y="20" width="12" height="12" fill="#000" />
                <rect x="95" y="20" width="12" height="12" fill="#000" />
                <rect x="115" y="20" width="12" height="12" fill="#000" />
                <rect x="75" y="40" width="12" height="12" fill="#000" />
                <rect x="105" y="40" width="12" height="12" fill="#000" />
                <rect x="75" y="60" width="12" height="12" fill="#000" />
                <rect x="90" y="60" width="12" height="12" fill="#000" />
                <rect x="110" y="60" width="12" height="12" fill="#000" />
                
                {/* Center SAMU Emblem */}
                <circle cx="100" cy="100" r="22" fill="#d4af37" stroke="#ffffff" strokeWidth="3" />
                <text x="100" y="104" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#000">SAMU</text>
                
                {/* Bottom and Right Patterns */}
                <rect x="75" y="135" width="12" height="12" fill="#000" />
                <rect x="95" y="145" width="12" height="12" fill="#000" />
                <rect x="115" y="135" width="12" height="12" fill="#000" />
                <rect x="135" y="75" width="12" height="12" fill="#000" />
                <rect x="155" y="90" width="12" height="12" fill="#000" />
                <rect x="170" y="115" width="12" height="12" fill="#000" />
                <rect x="145" y="140" width="12" height="12" fill="#000" />
                <rect x="165" y="155" width="12" height="12" fill="#000" />
              </svg>
            </div>

            {/* Total Display */}
            <div style={{
              background: 'var(--card-subtle-bg)',
              border: '1px solid var(--border-color)',
              padding: '12px 18px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monto a Cobrar</span>
              <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-primary)', margin: '2px 0 0 0' }}>
                Bs. {posSubtotal.toFixed(2)}
              </p>
            </div>

            {/* Reference & Confirmation */}
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                Código de Referencia / Comprobante QR
              </label>
              <input
                type="text"
                className="form-control"
                value={qrRefCode}
                onChange={(e) => setQrRefCode(e.target.value)}
                placeholder="Ej: QR-489201"
                required
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmQRPayment}
              disabled={isProcessingQR || !qrRefCode.trim()}
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '1rem', fontWeight: 700 }}
            >
              {isProcessingQR ? 'Verificando Pago QR...' : 'Confirmar Cobro QR'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
