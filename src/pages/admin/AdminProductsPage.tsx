import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  QrCode, 
  Shirt, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import type { Product, Category } from '../../types/domain';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { categoryRepository } from '../../repositories/dexie/DexieCategoryRepository';
import { ProductFormModal } from '../../components/admin/ProductFormModal';
import { PrintQREtiquetteModal } from '../../components/admin/PrintQREtiquetteModal';
import type { ProductFormData } from '../../schemas/productSchema';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToPrintQR, setProductToPrintQR] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        productRepository.getAll({ soloActivos: true }),
        categoryRepository.getAll()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error cargando inventario admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c.nombre]));
  }, [categories]);

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

  const handleSaveProduct = async (data: ProductFormData, imageBlob?: Blob) => {
    if (productToEdit) {
      await productRepository.update(productToEdit.id, {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        stock: data.stock,
        categoriaId: data.categoriaId,
        talla: data.talla,
        color: data.color,
        qrCode: data.qrCode || productToEdit.qrCode,
        fotoUrl: data.fotoUrl,
        imagenBlob: imageBlob || productToEdit.imagenBlob
      });
    } else {
      await productRepository.create({
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        stock: data.stock,
        categoriaId: data.categoriaId,
        talla: data.talla,
        color: data.color,
        qrCode: data.qrCode || `SAMU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        fotoUrl: data.fotoUrl,
        imagenBlob: imageBlob,
        activo: true,
        sucursalId: 'sucursal-principal-01'
      });
    }

    await loadData();
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de desactivar la prenda "${name}"?`)) {
      await productRepository.delete(id);
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Gestión de Inventario & Prendas
              </h1>
              <p className="text-xs text-zinc-400">
                CRUD completo, stock, fotos Blob y generación de códigos QR
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Prenda</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por prenda, código QR o descripción..."
              className="w-full bg-[#121216] border border-zinc-800 rounded-xl pl-11 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              title="Refrescar lista"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181820] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">Prenda / Foto</th>
                  <th className="py-3.5 px-4">Código QR</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Talla / Color</th>
                  <th className="py-3.5 px-4">Precio</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      Cargando inventario desde IndexedDB...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No se encontraron prendas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const imgUrl = p.imagenBlob 
                      ? URL.createObjectURL(p.imagenBlob) 
                      : (p.fotoUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=200');

                    return (
                      <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                        {/* Prenda & Foto */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={imgUrl} alt={p.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate max-w-[200px]">{p.nombre}</p>
                              <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">{p.descripcion}</p>
                            </div>
                          </div>
                        </td>

                        {/* Código QR */}
                        <td className="py-3 px-4 font-mono font-semibold text-amber-300">
                          {p.qrCode}
                        </td>

                        {/* Categoría */}
                        <td className="py-3 px-4 text-zinc-300">
                          {categoryMap.get(p.categoriaId) || 'Sin Categoría'}
                        </td>

                        {/* Talla / Color */}
                        <td className="py-3 px-4 text-zinc-400">
                          <span className="text-zinc-200 font-semibold">{p.talla || 'N/A'}</span>
                          {p.color && <span className="text-zinc-500"> • {p.color}</span>}
                        </td>

                        {/* Precio */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          Bs. {p.precio.toFixed(2)}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          {p.stock > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> {p.stock} unids.
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> Agotado
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Imprimir Etiqueta QR */}
                            <button
                              onClick={() => setProductToPrintQR(p)}
                              title="Imprimir Etiqueta de Prenda (Hang Tag)"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setIsFormModalOpen(true);
                              }}
                              title="Editar Prenda"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar (Soft-delete) */}
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.nombre)}
                              title="Desactivar Prenda"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        productToEdit={productToEdit}
        categories={categories}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProduct}
      />

      <PrintQREtiquetteModal
        product={productToPrintQR}
        onClose={() => setProductToPrintQR(null)}
      />
    </div>
  );
};
