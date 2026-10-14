import type { Category } from '../../types/domain';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | undefined>;
  create(category: Omit<Category, 'id'>): Promise<Category>;
  update(id: string, updates: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
}
