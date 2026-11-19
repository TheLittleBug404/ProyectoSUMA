import type { Sale, SaleStats, UserRole, SaleStatus } from '../../types/domain';

export interface ISaleRepository {
  createSale(saleData: Omit<Sale, 'id' | 'fecha'>): Promise<Sale>;
  getSales(filters?: { from?: string; to?: string; empleadoId?: string; sucursalId?: string; estado?: SaleStatus }): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale | undefined>;
  getStats(filters?: { from?: string; to?: string; empleadoId?: string; productoId?: string; sucursalId?: string }): Promise<SaleStats>;
  voidSale(saleId: string, voidData: { userId: string; userNombre: string; userRol: UserRole; motivo: string }): Promise<Sale>;
}
