import { db } from '../../db/dexie';
import type { User } from '../../types/domain';
import type { IUserRepository } from '../interfaces/IUserRepository';

export class DexieUserRepository implements IUserRepository {
  async getByEmail(email: string): Promise<User | undefined> {
    const cleanEmail = email.trim().toLowerCase();
    const found = await db.usuarios.where('email').equalsIgnoreCase(cleanEmail).first();
    if (found) return found;

    if (cleanEmail === 'admin') {
      return await db.usuarios.where('email').equalsIgnoreCase('admin@samu.com').first();
    }
    if (cleanEmail === 'admin@samu.com') {
      return await db.usuarios.where('email').equalsIgnoreCase('admin').first();
    }
    return undefined;
  }

  async getById(id: string): Promise<User | undefined> {
    return await db.usuarios.get(id);
  }

  async getAll(sucursalId?: string): Promise<User[]> {
    let users = await db.usuarios.toArray();
    if (sucursalId) {
      users = users.filter(u => u.sucursalId === sucursalId);
    }
    return users;
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = await this.getByEmail(cleanEmail);
    if (existing) {
      throw new Error(`El email "${cleanEmail}" ya está registrado`);
    }

    const user: User = {
      ...userData,
      email: cleanEmail,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    await db.usuarios.add(user);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
      const existing = await this.getByEmail(updates.email);
      if (existing && existing.id !== id) {
        throw new Error(`El email "${updates.email}" ya está en uso`);
      }
    }

    await db.usuarios.update(id, updates);
    const updated = await db.usuarios.get(id);
    if (!updated) throw new Error(`Usuario ${id} no encontrado`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Soft delete para mantener histórico de ventas del empleado
    await db.usuarios.update(id, { activo: false });
  }
}

export const userRepository = new DexieUserRepository();
