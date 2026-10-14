import Dexie, { type Table } from 'dexie';
import type { User, Category, Product, Sale, Branch } from '../types/domain';

export class SAMUDatabase extends Dexie {
  sucursales!: Table<Branch, string>;
  usuarios!: Table<User, string>;
  categorias!: Table<Category, string>;
  productos!: Table<Product, string>;
  ventas!: Table<Sale, string>;

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
  }
}

export const db = new SAMUDatabase();
