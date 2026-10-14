import type { Sale, SaleStats } from '../../types/domain';

export interface ISaleRepository {
  createSale(saleData: Omit<Sale, 'id' | 'fecha'>): Promise<Sale>;
  getSales(filters?: { from?: string; to?: string; empleadoId?: string; sucursalId?: string }): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale | undefined>;
  getStats(filters?: { from?: string; to?: string; empleadoId?: string; productoId?: string; sucursalId?: string }): Promise<SaleStats>;
}
