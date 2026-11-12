import { db } from '../../db/dexie';
import type { Customer } from '../../types/domain';
import type { ICustomerRepository } from '../interfaces/ICustomerRepository';

export class DexieCustomerRepository implements ICustomerRepository {
  async getAll(filter?: { search?: string }): Promise<Customer[]> {
    let list = await db.clientes.toArray();

    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.documento && c.documento.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => (b.totalCompras || 0) - (a.totalCompras || 0));
  }

  async getById(id: string): Promise<Customer | undefined> {
    return await db.clientes.get(id);
  }

  async getByDocumento(doc: string): Promise<Customer | undefined> {
    const list = await db.clientes.toArray();
    return list.find(c => c.documento?.trim().toLowerCase() === doc.trim().toLowerCase());
  }

  async create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const customer: Customer = {
      ...data,
      id: crypto.randomUUID(),
      totalCompras: 0,
      puntos: 0,
      createdAt: new Date().toISOString()
    };
    await db.clientes.add(customer);
    return customer;
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const existing = await db.clientes.get(id);
    if (!existing) throw new Error('Cliente no encontrado');

    const updated = { ...existing, ...data };
    await db.clientes.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.clientes.delete(id);
  }

  async recordPurchase(id: string, amount: number): Promise<void> {
    const customer = await db.clientes.get(id);
    if (!customer) return;

    const currentTotal = customer.totalCompras || 0;
    const currentPoints = customer.puntos || 0;
    // 1 punto por cada 10 Bs de compra
    const pointsEarned = Math.floor(amount / 10);

    await db.clientes.update(id, {
      totalCompras: currentTotal + amount,
      puntos: currentPoints + pointsEarned
    });
  }
}

export const customerRepository = new DexieCustomerRepository();

