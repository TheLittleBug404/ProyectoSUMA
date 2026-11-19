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
  sueldo?: number; // Sueldo base mensual en Bolivianos (Bs.)
  createdAt?: string;
}

export type CashShiftStatus = 'ABIERTA' | 'CERRADA';
export type CashExpenseCategory = 'PROVEEDOR' | 'SERVICIOS' | 'SUELDO' | 'ADELANTO' | 'VARIOS';
export type SaleStatus = 'COMPLETADA' | 'ANULADA';

export interface CashRegister {
  id: string;
  sucursalId: string;
  empleadoId: string;
  empleadoNombre?: string;
  fechaApertura: string; // ISO
  montoApertura: number; // Fondo inicial / base en gaveta
  fechaCierre?: string; // ISO
  cerradoPorId?: string;
  cerradoPorNombre?: string;
  estado: CashShiftStatus;
  
  // Resumen calculado al cierre o en vivo
  totalVentasEfectivo: number;
  totalVentasQR: number;
  totalVentasTarjeta: number;
  totalEgresos: number;
  montoEsperadoEfectivo: number; // montoApertura + totalVentasEfectivo - totalEgresos
  montoRealEfectivo?: number; // Conteo físico arqueo
  diferencia?: number; // montoRealEfectivo - montoEsperadoEfectivo
  notas?: string;

  // Ventas anuladas / reembolsos
  totalVentasAnuladasEfectivo?: number;
  totalVentasAnuladasMonto?: number;
  cantidadVentasAnuladas?: number;
}

export interface CashExpense {
  id: string;
  cajaId?: string; // Vinculado a turno de caja abierta
  sucursalId: string;
  empleadoId: string;
  empleadoNombre?: string;
  tipo: 'EGRESO' | 'INGRESO_EXTRA';
  categoria: CashExpenseCategory;
  descripcion: string;
  monto: number;
  fecha: string; // ISO
  comprobante?: string;
}

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface ProductColorVariant {
  color: string;
  colorHex: string;
  stock: number;
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
  sucursalesIds?: string[]; // IDs de las sucursales donde se vende o ['TODAS']
  createdAt: string;
  talla?: string;
  tallas?: string[]; // Tallas disponibles (ej: ['S', 'M', 'L', 'XL'])
  stockPorTalla?: Record<string, number>; // { [talla]: stock }
  stockPorSucursal?: Record<string, number>; // { [sucursalId]: stock }
  color?: string;
  colorHex?: string; // Código hexadecimal para paleta visual (ej: #000000)
  colores?: ProductColorVariant[]; // Variantes de colores con stock individual
}

export interface SaleItem {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  talla?: string;
  color?: string;
  colorHex?: string;
}

export interface Customer {
  id: string;
  nombre: string;
  documento?: string; // CI / NIT
  telefono?: string; // Celular / WhatsApp
  email?: string;
  descuentoFrecuente?: number; // % descuento fijo (ej: 5 para 5%)
  totalCompras?: number;
  puntos?: number;
  notas?: string;
  createdAt: string;
}

export interface SaleReturnItem {
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  talla?: string;
  color?: string;
  motivo: string;
}

export interface SaleReturn {
  id: string;
  ventaId: string;
  numeroTicketOriginal: string;
  numeroDevolucion: string; // ej: DEV-123456
  empleadoId: string;
  empleadoNombre?: string;
  sucursalId: string;
  sucursalNombre?: string;
  fecha: string;
  tipo: 'DEVOLUCION_DINERO' | 'CAMBIO_PRENDA';
  itemsDevueltos: SaleReturnItem[];
  montoDevuelto: number;
  itemsNuevos?: SaleItem[];
  diferenciaCobrada?: number;
  notas?: string;
}

export interface Sale {
  id: string;
  numeroTicket: string;
  empleadoId: string;
  empleadoNombre?: string;
  sucursalId: string;
  sucursalNombre?: string;
  fecha: string; // ISO string
  items: SaleItem[];
  subtotal?: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  total: number;
  metodoPago: 'EFECTIVO' | 'QR' | 'TARJETA';
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteDocumento?: string;

  // Estado y Auditoría de Anulación
  estado?: SaleStatus; // 'COMPLETADA' (default) | 'ANULADA'
  anuladoPorId?: string;
  anuladoPorNombre?: string;
  anuladoPorRol?: UserRole;
  fechaAnulacion?: string; // ISO
  motivoAnulacion?: string;
}

export interface SaleStats {
  totalVentas: number;
  montoTotal: number;
  ticketPromedio: number;
  ventasPorDia: { fecha: string; total: number; cantidad: number }[];
  productosMasVendidos: { productoId: string; nombre: string; cantidad: number; total: number }[];
  ventasPorEmpleado: { empleadoId: string; nombre: string; total: number; cantidad: number }[];
}
