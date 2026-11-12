import { db } from '../../db/dexie';
import type { SaleReturn } from '../../types/domain';
import type { IReturnRepository } from '../interfaces/IReturnRepository';

export class DexieReturnRepository implements IReturnRepository {
  async getAll(filter?: { sucursalId?: string; empleadoId?: string; from?: string; to?: string }): Promise<SaleReturn[]> {
    let list = await db.devoluciones.toArray();

    if (filter?.sucursalId) {
      list = list.filter(r => r.sucursalId === filter.sucursalId);
    }
    if (filter?.empleadoId) {
      list = list.filter(r => r.empleadoId === filter.empleadoId);
    }
    if (filter?.from) {
      const fromTime = new Date(filter.from).getTime();
      list = list.filter(r => new Date(r.fecha).getTime() >= fromTime);
    }
    if (filter?.to) {
      const toTime = new Date(filter.to).getTime();
      list = list.filter(r => new Date(r.fecha).getTime() <= toTime);
    }

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  async getById(id: string): Promise<SaleReturn | undefined> {
    return await db.devoluciones.get(id);
  }

  async getByTicketOriginal(numeroTicket: string): Promise<SaleReturn[]> {
    const list = await db.devoluciones.toArray();
    return list.filter(r => r.numeroTicketOriginal === numeroTicket);
  }

  async createReturn(data: Omit<SaleReturn, 'id' | 'numeroDevolucion' | 'fecha'>): Promise<SaleReturn> {
    return await db.transaction('rw', [db.devoluciones, db.productos, db.cajas, db.egresos], async () => {
      // 1. Reingresar prendas devueltas al inventario
      for (const retItem of data.itemsDevueltos) {
        const prod = await db.productos.get(retItem.productoId);
        if (prod) {
          const updatedStock = prod.stock + retItem.cantidad;
          const updatedStockPorSucursal = prod.stockPorSucursal ? { ...prod.stockPorSucursal } : {};
          if (data.sucursalId) {
            updatedStockPorSucursal[data.sucursalId] = (updatedStockPorSucursal[data.sucursalId] || 0) + retItem.cantidad;
          }

          const updatedStockPorTalla = prod.stockPorTalla ? { ...prod.stockPorTalla } : undefined;
          if (retItem.talla && updatedStockPorTalla) {
            updatedStockPorTalla[retItem.talla] = (updatedStockPorTalla[retItem.talla] || 0) + retItem.cantidad;
          }

          await db.productos.update(prod.id, {
            stock: updatedStock,
            stockPorSucursal: Object.keys(updatedStockPorSucursal).length > 0 ? updatedStockPorSucursal : undefined,
            stockPorTalla: updatedStockPorTalla
          });
        }
      }

      // 2. Si es cambio por otra prenda, descontar las nuevas del inventario
      if (data.tipo === 'CAMBIO_PRENDA' && data.itemsNuevos?.length) {
        for (const newItem of data.itemsNuevos) {
          const prod = await db.productos.get(newItem.productoId);
          if (prod) {
            if (prod.stock < newItem.cantidad) {
              throw new Error(`Stock insuficiente para prenda de cambio "${prod.nombre}"`);
            }
            const updatedStock = prod.stock - newItem.cantidad;
            const updatedStockPorSucursal = prod.stockPorSucursal ? { ...prod.stockPorSucursal } : {};
            if (data.sucursalId && updatedStockPorSucursal[data.sucursalId] !== undefined) {
              updatedStockPorSucursal[data.sucursalId] = Math.max(0, updatedStockPorSucursal[data.sucursalId] - newItem.cantidad);
            }

            const updatedStockPorTalla = prod.stockPorTalla ? { ...prod.stockPorTalla } : undefined;
            if (newItem.talla && updatedStockPorTalla && updatedStockPorTalla[newItem.talla] !== undefined) {
              updatedStockPorTalla[newItem.talla] = Math.max(0, updatedStockPorTalla[newItem.talla] - newItem.cantidad);
            }

            await db.productos.update(prod.id, {
              stock: updatedStock,
              stockPorSucursal: Object.keys(updatedStockPorSucursal).length > 0 ? updatedStockPorSucursal : undefined,
              stockPorTalla: updatedStockPorTalla
            });
          }
        }
      }

      // 3. Si hubo devolución en efectivo, registrar egreso en caja abierta
      if (data.tipo === 'DEVOLUCION_DINERO' && data.montoDevuelto > 0) {
        const cajaAbierta = await db.cajas
          .where('sucursalId')
          .equals(data.sucursalId)
          .and(c => c.estado === 'ABIERTA')
          .first();

        await db.egresos.add({
          id: crypto.randomUUID(),
          cajaId: cajaAbierta?.id,
          sucursalId: data.sucursalId,
          empleadoId: data.empleadoId,
          empleadoNombre: data.empleadoNombre,
          tipo: 'EGRESO',
          categoria: 'VARIOS',
          descripcion: `Reembolso por Devolución ticket #${data.numeroTicketOriginal}`,
          monto: data.montoDevuelto,
          fecha: new Date().toISOString()
        });
      }

      // 4. Guardar registro de devolución
      const saleReturn: SaleReturn = {
        ...data,
        id: crypto.randomUUID(),
        numeroDevolucion: `DEV-${Date.now().toString().slice(-6)}`,
        fecha: new Date().toISOString()
      };

      await db.devoluciones.add(saleReturn);
      return saleReturn;
    });
  }
}

export const returnRepository = new DexieReturnRepository();

