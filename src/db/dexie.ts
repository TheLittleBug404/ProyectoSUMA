import Dexie, { type Table } from 'dexie';
import type { User, Category, Product, Sale, Branch, CashRegister, CashExpense, Customer, SaleReturn } from '../types/domain';

export class SAMUDatabase extends Dexie {
  sucursales!: Table<Branch, string>;
  usuarios!: Table<User, string>;
  categorias!: Table<Category, string>;
  productos!: Table<Product, string>;
  ventas!: Table<Sale, string>;
  cajas!: Table<CashRegister, string>;
  egresos!: Table<CashExpense, string>;
  clientes!: Table<Customer, string>;
  devoluciones!: Table<SaleReturn, string>;

  constructor() {
    super('SAMU_POS_DB');

    // Esquema Version 1
    this.version(1).stores({
      sucursales: 'id, nombre, activa',
      usuarios: 'id, &email, rol, sucursalId, activo',
      categorias: 'id, &nombre',
      productos: 'id, &qrCode, nombre, categoriaId, sucursalId, activo, createdAt',
      ventas: 'id, &numeroTicket, empleadoId, sucursalId, fecha, total'
    });

    // Esquema Version 2: Control de Caja, Arqueos y Egresos
    this.version(2).stores({
      cajas: 'id, sucursalId, empleadoId, fechaApertura, fechaCierre, estado',
      egresos: 'id, cajaId, sucursalId, empleadoId, fecha, tipo, categoria'
    });

    // Esquema Version 3: Clientes CRM y Devoluciones/Cambios
    this.version(3).stores({
      clientes: 'id, documento, telefono, nombre, createdAt',
      devoluciones: 'id, ventaId, numeroTicketOriginal, empleadoId, sucursalId, fecha'
    });

    // Esquema Version 4: Anulación de Ventas y Auditoría
    this.version(4).stores({
      ventas: 'id, &numeroTicket, empleadoId, sucursalId, fecha, total, estado, fechaAnulacion'
    });
  }
}

export const db = new SAMUDatabase();
