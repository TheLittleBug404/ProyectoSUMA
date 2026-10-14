import { db } from '../../db/dexie';
import type { Category } from '../../types/domain';
import type { ICategoryRepository } from '../interfaces/ICategoryRepository';

export class DexieCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return await db.categorias.toArray();
  }

  async getById(id: string): Promise<Category | undefined> {
    return await db.categorias.get(id);
  }

  async create(categoryData: Omit<Category, 'id'>): Promise<Category> {
    const category: Category = {
      ...categoryData,
      id: crypto.randomUUID()
    };
    await db.categorias.add(category);
    return category;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    await db.categorias.update(id, updates);
    const updated = await db.categorias.get(id);
    if (!updated) throw new Error(`Categoría ${id} no encontrada`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Validar si existen productos usando esta categoria
    const count = await db.productos.where('categoriaId').equals(id).count();
    if (count > 0) {
      throw new Error(`No se puede eliminar la categoría porque tiene ${count} producto(s) asignado(s)`);
    }
    await db.categorias.delete(id);
  }
}

export const categoryRepository = new DexieCategoryRepository();
