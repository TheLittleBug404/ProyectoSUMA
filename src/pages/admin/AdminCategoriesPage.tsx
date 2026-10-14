import React, { useEffect, useState } from 'react';
import { Plus, Tags, Edit2, Trash2, RefreshCw, Shirt } from 'lucide-react';
import type { Category, Product } from '../../types/domain';
import { categoryRepository } from '../../repositories/dexie/DexieCategoryRepository';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { CategoryFormModal } from '../../components/admin/CategoryFormModal';
import type { CategoryFormData } from '../../schemas/categorySchema';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        categoryRepository.getAll(),
        productRepository.getAll({ soloActivos: true })
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoriaId === categoryId).length;
  };

  const handleSaveCategory = async (data: CategoryFormData) => {
    if (categoryToEdit) {
      await categoryRepository.update(categoryToEdit.id, data);
    } else {
      await categoryRepository.create(data);
    }
    await loadData();
  };

  const handleDeleteCategory = async (cat: Category) => {
    const count = getProductCount(cat.id);
    if (count > 0) {
      alert(`No se puede eliminar la categoría "${cat.nombre}" porque tiene ${count} prenda(s) asignada(s). Reasigna las prendas primero.`);
      return;
    }

    if (window.confirm(`¿Seguro que deseas eliminar la categoría "${cat.nombre}"?`)) {
      try {
        await categoryRepository.delete(cat.id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Categorías de Colección
              </h1>
              <p className="text-xs text-zinc-400">
                Líneas de moda, prendas asignadas y ordenamiento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refrescar"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setCategoryToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181820] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4">Descripción</th>
                  <th className="py-3.5 px-4 text-center">Prendas Vinculadas</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-400">
                      Cargando categorías...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-500">
                      No hay categorías registradas. Crea una nueva.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => {
                    const count = getProductCount(c.id);

                    return (
                      <tr key={c.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {c.nombre}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">
                          {c.descripcion || <span className="italic text-zinc-600">Sin descripción</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-amber-300 border border-zinc-700">
                            <Shirt className="w-3 h-3" /> {count} prendas
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCategoryToEdit(c);
                                setIsModalOpen(true);
                              }}
                              title="Editar Categoría"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c)}
                              title="Eliminar Categoría"
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

      <CategoryFormModal
        isOpen={isModalOpen}
        categoryToEdit={categoryToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
      />
    </div>
  );
};
