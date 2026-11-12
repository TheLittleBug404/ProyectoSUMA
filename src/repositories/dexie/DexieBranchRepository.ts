import { db } from '../../db/dexie';
import type { Branch } from '../../types/domain';
import type { IBranchRepository } from '../interfaces/IBranchRepository';

export class DexieBranchRepository implements IBranchRepository {
  async getAll(soloActivas?: boolean): Promise<Branch[]> {
    let branches = await db.sucursales.toArray();
    if (soloActivas) {
      branches = branches.filter(b => b.activa);
    }
    return branches;
  }

  async getById(id: string): Promise<Branch | undefined> {
    return await db.sucursales.get(id);
  }

  async create(data: Omit<Branch, 'id'>): Promise<Branch> {
    const branch: Branch = {
      ...data,
      id: `sucursal-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      activa: data.activa !== false
    };

    await db.sucursales.add(branch);
    return branch;
  }

  async update(id: string, updates: Partial<Branch>): Promise<Branch> {
    await db.sucursales.update(id, updates);
    const updated = await db.sucursales.get(id);
    if (!updated) throw new Error(`Sucursal ${id} no encontrada`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    // Soft delete para resguardar integridad de ventas y productos
    await db.sucursales.update(id, { activa: false });
  }
}

export const branchRepository = new DexieBranchRepository();

