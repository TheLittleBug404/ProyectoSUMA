import type { CashRegister, CashExpense, CashExpenseCategory } from '../../types/domain';

export interface OpenCashRegisterDTO {
  sucursalId: string;
  empleadoId: string;
  empleadoNombre: string;
  montoApertura: number;
  notas?: string;
}

export interface RegisterExpenseDTO {
  cajaId?: string;
  sucursalId: string;
  empleadoId: string;
  empleadoNombre: string;
  tipo?: 'EGRESO' | 'INGRESO_EXTRA';
  categoria: CashExpenseCategory;
  descripcion: string;
  monto: number;
  comprobante?: string;
}

export interface CloseCashRegisterDTO {
  id: string;
  cerradoPorId: string;
  cerradoPorNombre: string;
  montoRealEfectivo: number;
  notas?: string;
}

export interface LiveCashStats {
  caja: CashRegister;
  totalVentasEfectivo: number;
  totalVentasQR: number;
  totalVentasTarjeta: number;
  totalVentasGeneral: number;
  ventasCount: number;
  totalVentasAnuladasEfectivo: number;
  totalVentasAnuladasMonto: number;
  cantidadVentasAnuladas: number;
  totalEgresos: number;
  egresosCount: number;
  montoEsperadoEfectivo: number;
}

export interface CashPeriodSummary {
  periodo: 'dia' | 'semana' | 'mes' | 'rango';
  desde: string;
  hasta: string;
  totalVentasEfectivo: number;
  totalVentasQR: number;
  totalVentasTarjeta: number;
  totalIngresosVentas: number;
  totalVentasAnuladas?: number;
  montoVentasAnuladas?: number;
  totalEgresos: number;
  balanceNeto: number; // totalIngresosVentas - totalEgresos
  cierresRealizados: number;
  ticketsCount: number;
}

export interface ICashRepository {
  getActiveCashRegister(sucursalId?: string): Promise<CashRegister | undefined>;
  openCashRegister(data: OpenCashRegisterDTO): Promise<CashRegister>;
  getLiveStats(cajaId: string): Promise<LiveCashStats>;
  registerExpense(data: RegisterExpenseDTO): Promise<CashExpense>;
  closeCashRegister(data: CloseCashRegisterDTO): Promise<CashRegister>;
  getCashRegisters(filters?: { from?: string; to?: string; sucursalId?: string }): Promise<CashRegister[]>;
  getExpenses(filters?: { from?: string; to?: string; cajaId?: string; sucursalId?: string }): Promise<CashExpense[]>;
  deleteExpense(id: string): Promise<void>;
  getPeriodSummary(filters: { periodo: 'dia' | 'semana' | 'mes' | 'rango'; from?: string; to?: string; sucursalId?: string }): Promise<CashPeriodSummary>;
}

