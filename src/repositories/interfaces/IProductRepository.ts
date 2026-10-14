import type { Product } from '../../types/domain';

export interface IProductRepository {
  getAll(filter?: { categoriaId?: string; soloActivos?: boolean; sucursalId?: string }): Promise<Product[]>;
  getById(id: string): Promise<Product | undefined>;
  getByQRCode(qrCode: string): Promise<Product | undefined>;
  create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>; // Soft-delete activo: false
  updateStock(id: string, delta: number): Promise<void>;
}
