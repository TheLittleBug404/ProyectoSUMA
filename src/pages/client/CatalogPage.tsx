import React, { useEffect, useState, useMemo } from 'react';
import { Search, Sparkles, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';
import type { Product, Category } from '../../types/domain';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { categoryRepository } from '../../repositories/dexie/DexieCategoryRepository';
import { ClientProductCard } from '../../components/catalog/ClientProductCard';
import { ClientProductDetailModal } from '../../components/catalog/ClientProductDetailModal';

export const CatalogPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'name'>('default');

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        productRepository.getAll({ soloActivos: true }),
        categoryRepository.getAll()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category map for instant lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(term) ||
        p.descripcion.toLowerCase().includes(term) ||
        p.qrCode.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoriaId === selectedCategory);
    }

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.precio - a.precio);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 mb-10 overflow-hidden border border-[#d4af37]/30 bg-gradient-to-r from-[#121216] via-[#1a1712] to-[#121216] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)]">
          {/* Subtle gold glow */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Colección Exclusiva 2026
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-wider leading-tight text-white mb-4">
              Catálogo Oficial <br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                Samara Muriel
              </span>
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Explora nuestra selección en alta costura y moda femenina. Consulta tallas, colores y disponibilidad en tienda física en tiempo real.
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-amber-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por prenda, descripción o código QR..."
              className="w-full bg-[#121216] border border-[#d4af37]/25 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-amber-400/70" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#121216] border border-[#d4af37]/25 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition-all cursor-pointer"
            >
              <option value="default">Orden por defecto</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="name">Nombre: A - Z</option>
            </select>

            <button
              onClick={loadData}
              title="Refrescar catálogo"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(212,175,55,0.35)] font-bold'
                : 'bg-[#121216] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            Todas las categorías
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(212,175,55,0.35)] font-bold'
                  : 'bg-[#121216] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Cargando prendas desde IndexedDB...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-[#121216]/50 border border-zinc-800 p-8">
            <Filter className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-zinc-300">No se encontraron prendas</p>
            <p className="text-xs text-zinc-500 mt-1">Prueba cambiando los filtros o la búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ClientProductCard
                key={product.id}
                product={product}
                category={categoryMap.get(product.categoriaId)}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ClientProductDetailModal
        product={selectedProduct}
        category={selectedProduct ? categoryMap.get(selectedProduct.categoriaId) : undefined}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
