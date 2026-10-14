import React from 'react';
import { Eye, Tag } from 'lucide-react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
      height: '100%',
      border: '1px solid var(--border-color)',
      borderRadius: '18px'
    }}>
      {/* Product Image */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '120%', // 5:6 aspect ratio
        overflow: 'hidden',
        background: 'var(--product-img-bg)'
      }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="product-card-image"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
        {/* Category Badge */}
        <span className="badge badge-retail" style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
          background: 'rgba(10, 10, 12, 0.85)',
          backdropFilter: 'blur(6px)',
          border: '1px solid var(--border-color)'
        }}>
          {product.category}
        </span>

        {/* Model Badge */}
        <span className="badge badge-wholesale" style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 10,
          background: 'rgba(212, 175, 55, 0.22)',
          backdropFilter: 'blur(6px)',
          borderColor: 'rgba(212, 175, 55, 0.5)',
          color: '#fbf9f5'
        }}>
          {product.model}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ fontSize: '1.18rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
          {product.name}
        </h3>
        
        {/* Price list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'rgba(212, 175, 55, 0.04)',
          padding: '10px 14px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Por Menor (Unidad):</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Bs. {product.priceRetail.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(212, 175, 55, 0.2)', paddingTop: '6px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <Tag size={12} color="var(--accent-primary)" />
              Por Mayor (mín. {product.minWholesaleQty}u):
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              Bs. {product.priceWholesale.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Colors & Sizes previews */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: 'auto' }}>
          {/* Colors */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {product.colors.map((c, i) => (
              <span
                key={i}
                title={c.name}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: c.hex,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              />
            ))}
          </div>
          {/* Sizes */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {product.sizes.slice(0, 4).map((s, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 500
                }}
              >
                {s}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(product)}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
        >
          <Eye size={16} />
          Ver Opciones
        </button>
      </div>
    </div>
  );
};
