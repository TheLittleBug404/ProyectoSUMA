import React from 'react';
import { X, Trash2, Plus, Minus, CreditCard, Tag } from 'lucide-react';
import type { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    // If quantity is greater than or equal to minWholesaleQty, use wholesale price, else retail
    const price = item.quantity >= item.product.minWholesaleQty
      ? item.product.priceWholesale
      : item.product.priceRetail;
    return sum + (price * item.quantity);
  }, 0);

  // Calculate how much was saved compared to buying everything at retail price
  const totalRetailPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.priceRetail * item.quantity);
  }, 0);
  
  const discountSaved = totalRetailPrice - subtotal;

  return (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel animate-slide-in-right"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          borderLeft: '1px solid var(--border-color)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Mi Carrito</h2>
          <button 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{ borderRadius: '50%', padding: '8px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cartItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)',
              marginTop: 'auto',
              marginBottom: 'auto'
            }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Tu carrito está vacío</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Explora nuestro catálogo y añade prendas premium.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const isWholesaleApplied = item.quantity >= item.product.minWholesaleQty;
              const activePrice = isWholesaleApplied ? item.product.priceWholesale : item.product.priceRetail;
              const itemTotal = activePrice * item.quantity;

              return (
                <div 
                  key={item.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {/* Thumb image */}
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name} 
                    style={{
                      width: '75px',
                      height: '95px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />

                  {/* Item Description details */}
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingRight: '10px' }}>
                          {item.product.name}
                        </h4>
                        <button 
                          onClick={() => onRemoveItem(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          className="btn-danger"
                          title="Eliminar producto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.product.model} &bull; Talla: {item.selectedSize}
                      </p>
                      
                      {/* Color chip */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: item.selectedColor.hex,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.selectedColor.name}</span>
                      </div>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      {/* Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '2px 4px' }}>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Applied Price Indicator */}
                      <div style={{ textAlign: 'right' }}>
                        {isWholesaleApplied ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                              <Tag size={10} /> Por Mayor
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                              Bs. {itemTotal.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {/* Proximity warning for wholesale */}
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              Mayor a partir de {item.product.minWholesaleQty}u
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Bs. {itemTotal.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal:</span>
                <span>Bs. {totalRetailPrice.toFixed(2)}</span>
              </div>
              
              {discountSaved > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--success)' }}>
                  <span>Descuento por Mayor:</span>
                  <span>- Bs. {discountSaved.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
                <span>Total a Pagar:</span>
                <span>Bs. {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="btn btn-primary"
              style={{ width: '100%', height: '52px', justifyContent: 'center', fontSize: '1rem' }}
            >
              <CreditCard size={18} />
              Proceder al Pago
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
