import type { Branch } from '../../types/domain';

export interface IBranchRepository {
  getAll(soloActivas?: boolean): Promise<Branch[]>;
  getById(id: string): Promise<Branch | undefined>;
  create(data: Omit<Branch, 'id'>): Promise<Branch>;
  update(id: string, updates: Partial<Branch>): Promise<Branch>;
  delete(id: string): Promise<void>;
}

