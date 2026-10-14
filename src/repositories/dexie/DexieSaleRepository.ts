import { db } from '../../db/dexie';
import type { Sale, SaleStats } from '../../types/domain';
import type { ISaleRepository } from '../interfaces/ISaleRepository';

export class DexieSaleRepository implements ISaleRepository {
  async createSale(saleData: Omit<Sale, 'id' | 'fecha'>): Promise<Sale> {
    return await db.transaction('rw', db.ventas, db.productos, async () => {
      // 1. Validar y descontar stock de cada ítem
      for (const item of saleData.items) {
        const prod = await db.productos.get(item.productoId);
        if (!prod) {
          throw new Error(`Producto ${item.productoId} no encontrado en inventario`);
        }
        if (prod.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, Solicitado: ${item.cantidad}`);
        }

        await db.productos.update(prod.id, {
          stock: prod.stock - item.cantidad
        });
      }

      // 2. Guardar la venta con fecha actual
      const sale: Sale = {
        ...saleData,
        id: crypto.randomUUID(),
        fecha: new Date().toISOString()
      };

      await db.ventas.add(sale);
      return sale;
    });
  }

  async getSales(filters?: { from?: string; to?: string; empleadoId?: string; sucursalId?: string }): Promise<Sale[]> {
    let sales = await db.ventas.toArray();

    if (filters?.sucursalId) {
      sales = sales.filter(s => s.sucursalId === filters.sucursalId);
    }

    if (filters?.empleadoId) {
      sales = sales.filter(s => s.empleadoId === filters.empleadoId);
    }

    if (filters?.from) {
      const fromTime = new Date(filters.from).getTime();
      sales = sales.filter(s => new Date(s.fecha).getTime() >= fromTime);
    }

    if (filters?.to) {
      const toTime = new Date(filters.to).getTime();
      sales = sales.filter(s => new Date(s.fecha).getTime() <= toTime);
    }

    return sales.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async getSaleById(id: string): Promise<Sale | undefined> {
    return await db.ventas.get(id);
  }

  async getStats(filters?: { from?: string; to?: string; empleadoId?: string; productoId?: string; sucursalId?: string }): Promise<SaleStats> {
    const sales = await this.getSales({
      from: filters?.from,
      to: filters?.to,
      empleadoId: filters?.empleadoId,
      sucursalId: filters?.sucursalId
    });

    const users = await db.usuarios.toArray();
    const userMap = new Map(users.map(u => [u.id, u.nombre]));

    let totalVentas = 0;
    let montoTotal = 0;
    const ventasPorDiaMap = new Map<string, { total: number; cantidad: number }>();
    const productosMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
    const empleadoMap = new Map<string, { nombre: string; total: number; cantidad: number }>();

    for (const sale of sales) {
      // Filtro opcional por producto individual
      const hasProduct = filters?.productoId 
        ? sale.items.some(i => i.productoId === filters.productoId)
        : true;

      if (!hasProduct) continue;

      totalVentas++;
      montoTotal += sale.total;

      // Por dia (YYYY-MM-DD)
      const dayKey = sale.fecha.split('T')[0];
      const prevDay = ventasPorDiaMap.get(dayKey) || { total: 0, cantidad: 0 };
      ventasPorDiaMap.set(dayKey, {
        total: prevDay.total + sale.total,
        cantidad: prevDay.cantidad + 1
      });

      // Por empleado
      const empNombre = userMap.get(sale.empleadoId) || 'Empleado Desconocido';
      const prevEmp = empleadoMap.get(sale.empleadoId) || { nombre: empNombre, total: 0, cantidad: 0 };
      empleadoMap.set(sale.empleadoId, {
        nombre: empNombre,
        total: prevEmp.total + sale.total,
        cantidad: prevEmp.cantidad + 1
      });

      // Por producto
      for (const item of sale.items) {
        if (filters?.productoId && item.productoId !== filters.productoId) continue;

        const prevProd = productosMap.get(item.productoId) || {
          nombre: item.nombreProducto,
          cantidad: 0,
          total: 0
        };
        productosMap.set(item.productoId, {
          nombre: item.nombreProducto,
          cantidad: prevProd.cantidad + item.cantidad,
          total: prevProd.total + item.subtotal
        });
      }
    }

    const ventasPorDia = Array.from(ventasPorDiaMap.entries())
      .map(([fecha, data]) => ({ fecha, total: data.total, cantidad: data.cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const productosMasVendidos = Array.from(productosMap.entries())
      .map(([productoId, data]) => ({
        productoId,
        nombre: data.nombre,
        cantidad: data.cantidad,
        total: data.total
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const ventasPorEmpleado = Array.from(empleadoMap.entries())
      .map(([empleadoId, data]) => ({
        empleadoId,
        nombre: data.nombre,
        total: data.total,
        cantidad: data.cantidad
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalVentas,
      montoTotal,
      ticketPromedio: totalVentas > 0 ? montoTotal / totalVentas : 0,
      ventasPorDia,
      productosMasVendidos,
      ventasPorEmpleado
    };
  }
}

export const saleRepository = new DexieSaleRepository();
