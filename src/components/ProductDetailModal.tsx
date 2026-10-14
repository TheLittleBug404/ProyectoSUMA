import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Info, Check, Plus, Minus, Tag } from 'lucide-react';
import type { Product, CartItem } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<'retail' | 'wholesale'>('retail');

  // Reset defaults when product changes
  useEffect(() => {
    setSelectedColor(product.colors[0]);
    setSelectedSize(product.sizes[0]);
    setQuantity(1);
    setPurchaseType('retail');
  }, [product]);

  // Handle switching purchase type
  const handleTypeChange = (type: 'retail' | 'wholesale') => {
    setPurchaseType(type);
    if (type === 'wholesale' && quantity < product.minWholesaleQty) {
      setQuantity(product.minWholesaleQty);
    } else if (type === 'retail' && quantity >= product.minWholesaleQty) {
      setQuantity(1); // Reset to 1 for retail
    }
  };

  // Automatically update purchase type based on quantity
  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    setQuantity(newQty);

    if (newQty >= product.minWholesaleQty) {
      setPurchaseType('wholesale');
    } else {
      setPurchaseType('retail');
    }
  };

  const handleAdd = () => {
    onAddToCart({
      product,
      selectedColor,
      selectedSize,
      quantity
    });
    onClose();
  };

  // Calculations
  const currentUnitPrice = purchaseType === 'wholesale' ? product.priceWholesale : product.priceRetail;
  const totalPrice = currentUnitPrice * quantity;
  const savedAmount = purchaseType === 'wholesale'
    ? (product.priceRetail - product.priceWholesale) * quantity
    : 0;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="glass-card animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '850px',
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
        {/* Close Button */}
        <button
          onClick={onClose}
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

        {/* Product Image Panel */}
        <div style={{
          position: 'relative',
          height: '100%',
          minHeight: '350px',
          background: 'var(--product-img-bg)'
        }}>
          <img
            src={selectedColor.imageUrl || product.imageUrl}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
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
              {product.model}
            </span>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, margin: 0, textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
              {product.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              Categoría: {product.category}
            </p>
          </div>
        </div>

        {/* Details & Customization Panel */}
        <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '550px', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '20px', lineHeight: '1.6' }}>
            {product.description}
          </p>

          {/* Color Picker */}
          <div style={{ marginBottom: '20px' }}>
            <span className="form-label">Color: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedColor.name}</span></span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {product.colors.map((color, index) => {
                const isSelected = selectedColor.name === color.name;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color.hex,
                      border: isSelected ? '2px solid #fff' : '2px solid transparent',
                      outline: isSelected ? '2px solid var(--accent-primary)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title={color.name}
                  >
                    {isSelected && (
                      <Check size={14} color={color.hex === '#F9F6F0' ? '#000' : '#fff'} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Picker */}
          <div style={{ marginBottom: '24px' }}>
            <span className="form-label">Talla Disponible:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wholesale / Retail Toggle Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <span className="form-label">Modalidad de Compra:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => handleTypeChange('retail')}
                className="btn"
                style={{
                  background: purchaseType === 'retail' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: purchaseType === 'retail' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  color: purchaseType === 'retail' ? '#fff' : 'var(--text-secondary)',
                  flexDirection: 'column',
                  padding: '12px',
                  borderRadius: '12px',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Por Menor (Unidad)</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Bs. {product.priceRetail.toFixed(2)}</span>
              </button>

              <button
                onClick={() => handleTypeChange('wholesale')}
                className="btn"
                style={{
                  background: purchaseType === 'wholesale' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.02)',
                  border: purchaseType === 'wholesale' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  color: purchaseType === 'wholesale' ? '#fff' : 'var(--text-secondary)',
                  flexDirection: 'column',
                  padding: '12px',
                  borderRadius: '12px',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} color="var(--accent-primary)" /> Por Mayor (mín. {product.minWholesaleQty}u)
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>Bs. {product.priceWholesale.toFixed(2)}</span>
              </button>
            </div>
          </div>

          {/* Quantity Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span className="form-label" style={{ margin: 0 }}>Cantidad:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                className="btn btn-secondary"
                style={{ padding: '8px', borderRadius: '8px', minWidth: '32px', height: '32px' }}
              >
                <Minus size={14} />
              </button>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="btn btn-secondary"
                style={{ padding: '8px', borderRadius: '8px', minWidth: '32px', height: '32px' }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Dynamic Helper Info */}
          {purchaseType === 'retail' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              background: 'rgba(212, 175, 55, 0.06)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <Info size={14} color="var(--accent-primary)" />
              <span>
                Agrega <strong>{product.minWholesaleQty - quantity}</strong> prenda(s) más para acceder a precio por mayor (Bs. {product.priceWholesale.toFixed(2)} c/u).
              </span>
            </div>
          )}

          {purchaseType === 'wholesale' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              color: 'var(--success)',
              background: 'rgba(16, 185, 129, 0.08)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <Check size={14} />
              <span>
                ¡Precio por mayor aplicado! Ahorras <strong>Bs. {savedAmount.toFixed(2)}</strong>.
              </span>
            </div>
          )}

          {/* Total & Add Button */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Total:</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                Bs. {totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleAdd}
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', justifyContent: 'center' }}
            >
              <ShoppingCart size={18} />
              Añadir al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
