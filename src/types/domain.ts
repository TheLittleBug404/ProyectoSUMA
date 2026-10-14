export type UserRole = 'CLIENTE' | 'EMPLEADO' | 'ADMINISTRADOR';

export interface Branch {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: UserRole;
  sucursalId: string;
  activo: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  categoriaId: string;
  imagenBlob?: Blob;
  fotoUrl?: string; // URL web de fotografia externa
  qrCode: string; // Codigo unico para escaneo
  activo: boolean;
  sucursalId: string;
  createdAt: string;
  talla?: string;
  color?: string;
}

export interface SaleItem {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  numeroTicket: string;
  empleadoId: string;
  sucursalId: string;
  fecha: string; // ISO string
  items: SaleItem[];
  total: number;
  metodoPago: 'EFECTIVO' | 'QR' | 'TARJETA';
}

export interface SaleStats {
  totalVentas: number;
  montoTotal: number;
  ticketPromedio: number;
  ventasPorDia: { fecha: string; total: number; cantidad: number }[];
  productosMasVendidos: { productoId: string; nombre: string; cantidad: number; total: number }[];
  ventasPorEmpleado: { empleadoId: string; nombre: string; total: number; cantidad: number }[];
}
