import { db } from '../../db/dexie';
import type { Product } from '../../types/domain';
import type { IProductRepository } from '../interfaces/IProductRepository';

export class DexieProductRepository implements IProductRepository {
  async getAll(filter?: { categoriaId?: string; soloActivos?: boolean; sucursalId?: string }): Promise<Product[]> {
    let collection = db.productos.toCollection();

    let items = await collection.toArray();

    if (filter?.soloActivos !== false) {
      items = items.filter(p => p.activo !== false);
    }

    if (filter?.categoriaId) {
      items = items.filter(p => p.categoriaId === filter.categoriaId);
    }

    if (filter?.sucursalId) {
      items = items.filter(p => p.sucursalId === filter.sucursalId);
    }

    return items;
  }

  async getById(id: string): Promise<Product | undefined> {
    return await db.productos.get(id);
  }

  async getByQRCode(qrCode: string): Promise<Product | undefined> {
    return await db.productos.where('qrCode').equals(qrCode).first();
  }

  async create(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const product: Product = {
      ...productData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    await db.productos.add(product);
    return product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    await db.productos.update(id, updates);
    const updated = await db.productos.get(id);
    if (!updated) throw new Error(`Producto ${id} no encontrado`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Soft delete para mantener integridad con ventas pasadas
    await db.productos.update(id, { activo: false });
  }

  async updateStock(id: string, delta: number): Promise<void> {
    await db.transaction('rw', db.productos, async () => {
      const p = await db.productos.get(id);
      if (!p) throw new Error(`Producto ${id} no encontrado`);
      const newStock = p.stock + delta;
      if (newStock < 0) {
        throw new Error(`Stock insuficiente para "${p.nombre}". Disponible: ${p.stock}`);
      }
      await db.productos.update(id, { stock: newStock });
    });
  }
}

export const productRepository = new DexieProductRepository();
