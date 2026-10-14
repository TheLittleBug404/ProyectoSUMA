import type { User } from '../../types/domain';

export interface IUserRepository {
  getByEmail(email: string): Promise<User | undefined>;
  getById(id: string): Promise<User | undefined>;
  getAll(sucursalId?: string): Promise<User[]>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>; // Soft-delete activo: false
}
