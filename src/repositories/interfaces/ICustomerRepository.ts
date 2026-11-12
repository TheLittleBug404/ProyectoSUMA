import type { Customer } from '../../types/domain';

export interface ICustomerRepository {
  getAll(filter?: { search?: string }): Promise<Customer[]>;
  getById(id: string): Promise<Customer | undefined>;
  getByDocumento(doc: string): Promise<Customer | undefined>;
  create(data: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  delete(id: string): Promise<void>;
  recordPurchase(id: string, amount: number): Promise<void>;
}

