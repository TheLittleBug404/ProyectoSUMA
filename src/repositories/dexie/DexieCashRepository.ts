import { db } from '../../db/dexie';
import type { CashRegister, CashExpense } from '../../types/domain';
import type { 
  ICashRepository, 
  OpenCashRegisterDTO, 
  RegisterExpenseDTO, 
  CloseCashRegisterDTO, 
  LiveCashStats, 
  CashPeriodSummary 
} from '../interfaces/ICashRepository';

export class DexieCashRepository implements ICashRepository {
  async getActiveCashRegister(sucursalId = 'sucursal-principal-01'): Promise<CashRegister | undefined> {
    const openShifts = await db.cajas
      .where('estado')
      .equals('ABIERTA')
      .toArray();

    return openShifts.find(c => !sucursalId || c.sucursalId === sucursalId);
  }

  async openCashRegister(data: OpenCashRegisterDTO): Promise<CashRegister> {
    const existing = await this.getActiveCashRegister(data.sucursalId);
    if (existing) {
      throw new Error(`Ya existe una caja abierta en esta sucursal (Abierta por ${existing.empleadoNombre || 'Personal'})`);
    }

    const newRegister: CashRegister = {
      id: crypto.randomUUID(),
      sucursalId: data.sucursalId,
      empleadoId: data.empleadoId,
      empleadoNombre: data.empleadoNombre,
      fechaApertura: new Date().toISOString(),
      montoApertura: Number(data.montoApertura) || 0,
      estado: 'ABIERTA',
      totalVentasEfectivo: 0,
      totalVentasQR: 0,
      totalVentasTarjeta: 0,
      totalEgresos: 0,
      montoEsperadoEfectivo: Number(data.montoApertura) || 0,
      notas: data.notas
    };

    await db.cajas.add(newRegister);
    return newRegister;
  }

  async getLiveStats(cajaId: string): Promise<LiveCashStats> {
    const caja = await db.cajas.get(cajaId);
    if (!caja) throw new Error(`Caja ${cajaId} no encontrada`);

    const fromTime = new Date(caja.fechaApertura).getTime();
    const toTime = caja.fechaCierre ? new Date(caja.fechaCierre).getTime() : Date.now();

    // Ventas registradas durante el turno
    const allSales = await db.ventas.toArray();
    const shiftSales = allSales.filter(s => {
      const saleTime = new Date(s.fecha).getTime();
      const matchBranch = !caja.sucursalId || s.sucursalId === caja.sucursalId;
      return matchBranch && saleTime >= fromTime && saleTime <= toTime;
    });

    let totalVentasEfectivo = 0;
    let totalVentasQR = 0;
    let totalVentasTarjeta = 0;
    let totalVentasAnuladasEfectivo = 0;
    let totalVentasAnuladasMonto = 0;
    let cantidadVentasAnuladas = 0;
    let completedCount = 0;

    for (const sale of shiftSales) {
      if (sale.estado === 'ANULADA') {
        cantidadVentasAnuladas++;
        totalVentasAnuladasMonto += sale.total;
        if (sale.metodoPago === 'EFECTIVO') totalVentasAnuladasEfectivo += sale.total;
      } else {
        completedCount++;
        if (sale.metodoPago === 'EFECTIVO') totalVentasEfectivo += sale.total;
        else if (sale.metodoPago === 'QR') totalVentasQR += sale.total;
        else if (sale.metodoPago === 'TARJETA') totalVentasTarjeta += sale.total;
      }
    }

    const totalVentasGeneral = totalVentasEfectivo + totalVentasQR + totalVentasTarjeta;

    // Egresos del turno
    const allExpenses = await db.egresos.toArray();
    const shiftExpenses = allExpenses.filter(e => {
      if (e.cajaId === caja.id) return true;
      const expTime = new Date(e.fecha).getTime();
      const matchBranch = !caja.sucursalId || e.sucursalId === caja.sucursalId;
      return matchBranch && expTime >= fromTime && expTime <= toTime;
    });

    let totalEgresos = 0;
    for (const exp of shiftExpenses) {
      if (exp.tipo === 'INGRESO_EXTRA') {
        totalEgresos -= exp.monto;
      } else {
        totalEgresos += exp.monto;
      }
    }

    const montoEsperadoEfectivo = caja.montoApertura + totalVentasEfectivo - totalEgresos;

    return {
      caja,
      totalVentasEfectivo,
      totalVentasQR,
      totalVentasTarjeta,
      totalVentasGeneral,
      ventasCount: completedCount,
      totalVentasAnuladasEfectivo,
      totalVentasAnuladasMonto,
      cantidadVentasAnuladas,
      totalEgresos,
      egresosCount: shiftExpenses.length,
      montoEsperadoEfectivo
    };
  }

  async registerExpense(data: RegisterExpenseDTO): Promise<CashExpense> {
    const expense: CashExpense = {
      id: crypto.randomUUID(),
      cajaId: data.cajaId,
      sucursalId: data.sucursalId,
      empleadoId: data.empleadoId,
      empleadoNombre: data.empleadoNombre,
      tipo: data.tipo || 'EGRESO',
      categoria: data.categoria,
      descripcion: data.descripcion,
      monto: Number(data.monto) || 0,
      fecha: new Date().toISOString(),
      comprobante: data.comprobante
    };

    await db.egresos.add(expense);
    return expense;
  }

  async closeCashRegister(data: CloseCashRegisterDTO): Promise<CashRegister> {
    const liveStats = await this.getLiveStats(data.id);
    const caja = liveStats.caja;

    if (caja.estado === 'CERRADA') {
      throw new Error('Esta caja ya fue cerrada previamente');
    }

    const fechaCierre = new Date().toISOString();
    const montoRealEfectivo = Number(data.montoRealEfectivo) || 0;
    const diferencia = montoRealEfectivo - liveStats.montoEsperadoEfectivo;

    const updated: CashRegister = {
      ...caja,
      fechaCierre,
      cerradoPorId: data.cerradoPorId,
      cerradoPorNombre: data.cerradoPorNombre,
      estado: 'CERRADA',
      totalVentasEfectivo: liveStats.totalVentasEfectivo,
      totalVentasQR: liveStats.totalVentasQR,
      totalVentasTarjeta: liveStats.totalVentasTarjeta,
      totalEgresos: liveStats.totalEgresos,
      montoEsperadoEfectivo: liveStats.montoEsperadoEfectivo,
      montoRealEfectivo,
      diferencia,
      totalVentasAnuladasEfectivo: liveStats.totalVentasAnuladasEfectivo,
      totalVentasAnuladasMonto: liveStats.totalVentasAnuladasMonto,
      cantidadVentasAnuladas: liveStats.cantidadVentasAnuladas,
      notas: data.notas ? `${caja.notas || ''} | Cierre: ${data.notas}`.trim() : caja.notas
    };

    await db.cajas.put(updated);
    return updated;
  }

  async getCashRegisters(filters?: { from?: string; to?: string; sucursalId?: string }): Promise<CashRegister[]> {
    let registers = await db.cajas.toArray();

    if (filters?.sucursalId) {
      registers = registers.filter(r => r.sucursalId === filters.sucursalId);
    }
    if (filters?.from) {
      const fromTime = new Date(filters.from).getTime();
      registers = registers.filter(r => new Date(r.fechaApertura).getTime() >= fromTime);
    }
    if (filters?.to) {
      const toTime = new Date(filters.to).getTime();
      registers = registers.filter(r => new Date(r.fechaApertura).getTime() <= toTime);
    }

    return registers.sort((a, b) => new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime());
  }

  async getExpenses(filters?: { from?: string; to?: string; cajaId?: string; sucursalId?: string }): Promise<CashExpense[]> {
    let expenses = await db.egresos.toArray();

    if (filters?.cajaId) {
      expenses = expenses.filter(e => e.cajaId === filters.cajaId);
    }
    if (filters?.sucursalId) {
      expenses = expenses.filter(e => e.sucursalId === filters.sucursalId);
    }
    if (filters?.from) {
      const fromTime = new Date(filters.from).getTime();
      expenses = expenses.filter(e => new Date(e.fecha).getTime() >= fromTime);
    }
    if (filters?.to) {
      const toTime = new Date(filters.to).getTime();
      expenses = expenses.filter(e => new Date(e.fecha).getTime() <= toTime);
    }

    return expenses.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async deleteExpense(id: string): Promise<void> {
    await db.egresos.delete(id);
  }

  async getPeriodSummary(filters: { periodo: 'dia' | 'semana' | 'mes' | 'rango'; from?: string; to?: string; sucursalId?: string }): Promise<CashPeriodSummary> {
    const now = new Date();
    let desde = filters.from;
    let hasta = filters.to || now.toISOString();

    if (filters.periodo === 'dia') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      desde = startOfDay.toISOString();
      hasta = endOfDay.toISOString();
    } else if (filters.periodo === 'semana') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      desde = weekStart.toISOString();
    } else if (filters.periodo === 'mes') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      desde = monthStart.toISOString();
    }

    const fromTime = desde ? new Date(desde).getTime() : 0;
    const toTime = hasta ? new Date(hasta).getTime() : Infinity;

    // Ventas
    const sales = await db.ventas.toArray();
    const periodSales = sales.filter(s => {
      const t = new Date(s.fecha).getTime();
      const matchBranch = !filters.sucursalId || s.sucursalId === filters.sucursalId;
      return matchBranch && t >= fromTime && t <= toTime;
    });

    let totalVentasEfectivo = 0;
    let totalVentasQR = 0;
    let totalVentasTarjeta = 0;
    let totalVentasAnuladas = 0;
    let montoVentasAnuladas = 0;
    let completedTickets = 0;

    for (const sale of periodSales) {
      if (sale.estado === 'ANULADA') {
        totalVentasAnuladas++;
        montoVentasAnuladas += sale.total;
      } else {
        completedTickets++;
        if (sale.metodoPago === 'EFECTIVO') totalVentasEfectivo += sale.total;
        else if (sale.metodoPago === 'QR') totalVentasQR += sale.total;
        else if (sale.metodoPago === 'TARJETA') totalVentasTarjeta += sale.total;
      }
    }

    const totalIngresosVentas = totalVentasEfectivo + totalVentasQR + totalVentasTarjeta;

    // Egresos
    const expenses = await db.egresos.toArray();
    const periodExpenses = expenses.filter(e => {
      const t = new Date(e.fecha).getTime();
      const matchBranch = !filters.sucursalId || e.sucursalId === filters.sucursalId;
      return matchBranch && t >= fromTime && t <= toTime;
    });

    let totalEgresos = 0;
    for (const exp of periodExpenses) {
      if (exp.tipo === 'INGRESO_EXTRA') {
        totalEgresos -= exp.monto;
      } else {
        totalEgresos += exp.monto;
      }
    }

    // Cierres de caja en el período
    const registers = await db.cajas.toArray();
    const periodRegisters = registers.filter(r => {
      const t = new Date(r.fechaApertura).getTime();
      const matchBranch = !filters.sucursalId || r.sucursalId === filters.sucursalId;
      return matchBranch && t >= fromTime && t <= toTime && r.estado === 'CERRADA';
    });

    return {
      periodo: filters.periodo,
      desde: desde || '',
      hasta: hasta || '',
      totalVentasEfectivo,
      totalVentasQR,
      totalVentasTarjeta,
      totalIngresosVentas,
      totalVentasAnuladas,
      montoVentasAnuladas,
      totalEgresos,
      balanceNeto: totalIngresosVentas - totalEgresos,
      cierresRealizados: periodRegisters.length,
      ticketsCount: completedTickets
    };
  }
}

export const cashRepository = new DexieCashRepository();

