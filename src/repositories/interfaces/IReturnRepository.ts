import type { SaleReturn } from '../../types/domain';

export interface IReturnRepository {
  getAll(filter?: { sucursalId?: string; empleadoId?: string; from?: string; to?: string }): Promise<SaleReturn[]>;
  getById(id: string): Promise<SaleReturn | undefined>;
  getByTicketOriginal(numeroTicket: string): Promise<SaleReturn[]>;
  createReturn(data: Omit<SaleReturn, 'id' | 'numeroDevolucion' | 'fecha'>): Promise<SaleReturn>;
}

