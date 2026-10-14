import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Sparkles, Award, ShieldCheck, Truck } from 'lucide-react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import samuLogo from '../assets/samu-logo.jpg';

interface CatalogProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ products, onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'name'>('default');

  // Categories list derived dynamically
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtered and sorted products
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.model.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.priceRetail - b.priceRetail);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.priceRetail - a.priceRetail);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div style={{ padding: '0 5%', marginBottom: '80px' }} className="animate-fade-in">
      {/* Hero Banner Component */}
      <div 
        className="glass-card" 
        style={{
          padding: '48px 40px',
          borderRadius: '24px',
          background: 'var(--hero-bg)',
          border: '1px solid var(--border-color)',
          textAlign: 'left',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px'
        }}
      >
        {/* Glow decorative background items */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          left: '-60px',
          width: '240px',
          height: '240px',
          background: 'var(--accent-primary)',
          borderRadius: '50%',
          filter: 'blur(110px)',
          opacity: 0.18,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          right: '-60px',
          width: '240px',
          height: '240px',
          background: 'var(--accent-primary)',
          borderRadius: '50%',
          filter: 'blur(110px)',
          opacity: 0.12,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 5 }}>
          <span 
            className="badge badge-wholesale" 
            style={{
              marginBottom: '16px',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <Sparkles size={13} color="var(--accent-primary)" /> Confección de Alta Calidad &bull; Nueva Colección
          </span>
          
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2.8rem', 
            fontWeight: 800, 
            lineHeight: 1.15, 
            marginBottom: '14px',
            letterSpacing: '0.5px' 
          }}>
            Elegancia & <span className="text-gradient">Exclusividad</span> Femenina
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Prendas confeccionadas con máxima dedicación y detalle. Precios especiales por mayor y por menor con despacho a todo el país.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <button 
              onClick={() => setSelectedCategory('Todos')} 
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.98rem' }}
            >
              Explorar Catálogo
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              gap: '14px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="var(--accent-primary)" /> Compra Segura
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={14} color="var(--accent-primary)" /> Envío Nacional
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={14} color="var(--accent-primary)" /> Garantía SAMU
              </span>
            </div>
          </div>
        </div>

        {/* Hero Logo Frame Badge */}
        <div style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'var(--hero-badge-bg)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            padding: '4px',
            background: 'var(--accent-gradient)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
            overflow: 'hidden'
          }}>
            <img 
              src={samuLogo} 
              alt="SAMU - Samara Muriel" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          </div>
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1rem', 
              fontWeight: 800, 
              letterSpacing: '1px',
              display: 'block'
            }}>
              SAMARA MURIEL
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Moda & Confección
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
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
            placeholder="Buscar por prenda, modelo o detalle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '44px', background: 'var(--bg-secondary)' }}
          />
        </div>

        {/* Sort & Quick info */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <ArrowUpDown size={15} color="var(--accent-primary)" />
            <span>Ordenar por:</span>
          </div>
          <select
            className="form-control"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              padding: '8px 16px',
              fontSize: '0.88rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              width: '190px',
              height: '42px'
            }}
          >
            <option value="default">Recomendados</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="name">Alfabético (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Categories chips filter bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: '30px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px'
      }}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-secondary"
              style={{
                padding: '8px 18px',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.02)',
                color: isSelected ? '#0b0b0c' : 'var(--text-secondary)',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? 'none' : '1px solid var(--border-color)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Catalog Grid */}
      {processedProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No se encontraron prendas</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prueba ajustando los filtros o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {processedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
