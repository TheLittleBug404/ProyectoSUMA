import { db } from '../../db/dexie';
import type { Sale, SaleStats, UserRole, SaleStatus } from '../../types/domain';
import type { ISaleRepository } from '../interfaces/ISaleRepository';

export class DexieSaleRepository implements ISaleRepository {
  async createSale(saleData: Omit<Sale, 'id' | 'fecha'>): Promise<Sale> {
    return await db.transaction('rw', [db.ventas, db.productos, db.clientes], async () => {
      // 1. Validar y descontar stock de cada ítem
      for (const item of saleData.items) {
        const prod = await db.productos.get(item.productoId);
        if (!prod) {
          throw new Error(`Producto ${item.productoId} no encontrado en inventario`);
        }
        if (prod.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, Solicitado: ${item.cantidad}`);
        }

        const updatedStockPorSucursal = prod.stockPorSucursal ? { ...prod.stockPorSucursal } : undefined;
        if (updatedStockPorSucursal && saleData.sucursalId && updatedStockPorSucursal[saleData.sucursalId] !== undefined) {
          updatedStockPorSucursal[saleData.sucursalId] = Math.max(0, updatedStockPorSucursal[saleData.sucursalId] - item.cantidad);
        }

        const updatedStockPorTalla = prod.stockPorTalla ? { ...prod.stockPorTalla } : undefined;
        if (updatedStockPorTalla && item.talla && updatedStockPorTalla[item.talla] !== undefined) {
          updatedStockPorTalla[item.talla] = Math.max(0, updatedStockPorTalla[item.talla] - item.cantidad);
        }

        let updatedColores = prod.colores ? [...prod.colores] : undefined;
        if (updatedColores && item.color) {
          updatedColores = updatedColores.map(c => 
            c.color.toLowerCase() === item.color?.toLowerCase()
              ? { ...c, stock: Math.max(0, c.stock - item.cantidad) }
              : c
          );
        }

        await db.productos.update(prod.id, {
          stock: prod.stock - item.cantidad,
          stockPorSucursal: updatedStockPorSucursal,
          stockPorTalla: updatedStockPorTalla,
          colores: updatedColores
        });
      }

      // 2. Si hay cliente registrado, actualizar sus compras y puntos (1 punto por cada 10 Bs)
      if (saleData.clienteId) {
        const cliente = await db.clientes.get(saleData.clienteId);
        if (cliente) {
          const currentTotal = cliente.totalCompras || 0;
          const currentPuntos = cliente.puntos || 0;
          const puntosGanados = Math.floor(saleData.total / 10);
          await db.clientes.update(cliente.id, {
            totalCompras: currentTotal + saleData.total,
            puntos: currentPuntos + puntosGanados
          });
        }
      }

      // 3. Guardar la venta con fecha actual y estado COMPLETADA
      const sale: Sale = {
        ...saleData,
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        estado: 'COMPLETADA'
      };

      await db.ventas.add(sale);
      return sale;
    });
  }

  async voidSale(
    saleId: string, 
    voidData: { userId: string; userNombre: string; userRol: UserRole; motivo: string }
  ): Promise<Sale> {
    return await db.transaction('rw', [db.ventas, db.productos, db.clientes], async () => {
      const sale = await db.ventas.get(saleId);
      if (!sale) throw new Error(`Venta con ID ${saleId} no encontrada`);
      if (sale.estado === 'ANULADA') {
        throw new Error(`La venta #${sale.numeroTicket} ya fue anulada previamente`);
      }

      // 1. Reingresar todas las prendas vendidas al stock de la sucursal y global
      for (const item of sale.items) {
        const prod = await db.productos.get(item.productoId);
        if (prod) {
          const updatedStock = prod.stock + item.cantidad;
          const updatedStockPorSucursal = prod.stockPorSucursal ? { ...prod.stockPorSucursal } : undefined;
          if (updatedStockPorSucursal && sale.sucursalId && updatedStockPorSucursal[sale.sucursalId] !== undefined) {
            updatedStockPorSucursal[sale.sucursalId] = updatedStockPorSucursal[sale.sucursalId] + item.cantidad;
          }

          const updatedStockPorTalla = prod.stockPorTalla ? { ...prod.stockPorTalla } : undefined;
          if (updatedStockPorTalla && item.talla && updatedStockPorTalla[item.talla] !== undefined) {
            updatedStockPorTalla[item.talla] = updatedStockPorTalla[item.talla] + item.cantidad;
          }

          let updatedColores = prod.colores ? [...prod.colores] : undefined;
          if (updatedColores && item.color) {
            updatedColores = updatedColores.map(c => 
              c.color.toLowerCase() === item.color?.toLowerCase()
                ? { ...c, stock: c.stock + item.cantidad }
                : c
            );
          }

          await db.productos.update(prod.id, {
            stock: updatedStock,
            stockPorSucursal: updatedStockPorSucursal,
            stockPorTalla: updatedStockPorTalla,
            colores: updatedColores
          });
        }
      }

      // 2. Revertir compras y puntos del cliente si aplica
      if (sale.clienteId) {
        const cliente = await db.clientes.get(sale.clienteId);
        if (cliente) {
          const currentTotal = cliente.totalCompras || 0;
          const currentPuntos = cliente.puntos || 0;
          const puntosARestar = Math.floor(sale.total / 10);
          await db.clientes.update(cliente.id, {
            totalCompras: Math.max(0, currentTotal - sale.total),
            puntos: Math.max(0, currentPuntos - puntosARestar)
          });
        }
      }

      // 3. Actualizar la venta a estado ANULADA con auditoría
      const updatedSale: Sale = {
        ...sale,
        estado: 'ANULADA',
        anuladoPorId: voidData.userId,
        anuladoPorNombre: voidData.userNombre,
        anuladoPorRol: voidData.userRol,
        fechaAnulacion: new Date().toISOString(),
        motivoAnulacion: voidData.motivo
      };

      await db.ventas.put(updatedSale);
      return updatedSale;
    });
  }

  async getSales(filters?: { from?: string; to?: string; empleadoId?: string; sucursalId?: string; estado?: SaleStatus }): Promise<Sale[]> {
    let sales = await db.ventas.toArray();

    if (filters?.estado) {
      sales = sales.filter(s => (s.estado || 'COMPLETADA') === filters.estado);
    }

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
      // Ignorar ventas anuladas para estadísticas de facturación real
      if (sale.estado === 'ANULADA') continue;

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
