import { db } from './dexie';
import type { Product } from '../types/domain';

interface BackupData {
  version: number;
  timestamp: string;
  sucursales: any[];
  usuarios: any[];
  categorias: any[];
  productos: any[];
  ventas: any[];
  cajas?: any[];
  egresos?: any[];
  clientes?: any[];
  devoluciones?: any[];
}

// Convert Blob to Base64 String
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert Base64 String to Blob
async function base64ToBlob(base64: string): Promise<Blob> {
  const res = await fetch(base64);
  return await res.blob();
}

export async function exportDatabaseBackup(): Promise<string> {
  const sucursales = await db.sucursales.toArray();
  const usuarios = await db.usuarios.toArray();
  const categorias = await db.categorias.toArray();
  const rawProductos = await db.productos.toArray();
  const ventas = await db.ventas.toArray();
  const cajas = await db.cajas.toArray();
  const egresos = await db.egresos.toArray();
  const clientes = await db.clientes.toArray();
  const devoluciones = await db.devoluciones.toArray();

  // Convertir imagenes Blob a base64
  const productos = await Promise.all(
    rawProductos.map(async (prod) => {
      if (prod.imagenBlob) {
        const base64 = await blobToBase64(prod.imagenBlob);
        return { ...prod, imagenBlobBase64: base64, imagenBlob: undefined };
      }
      return prod;
    })
  );

  const backup: BackupData = {
    version: 3,
    timestamp: new Date().toISOString(),
    sucursales,
    usuarios,
    categorias,
    productos,
    ventas,
    cajas,
    egresos,
    clientes,
    devoluciones
  };

  return JSON.stringify(backup, null, 2);
}

export async function downloadBackupFile(filename = `SAMU_backup_${new Date().toISOString().slice(0, 10)}.json`): Promise<void> {
  const jsonString = await exportDatabaseBackup();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data: BackupData = JSON.parse(jsonString);

    if (!data.version || !Array.isArray(data.usuarios) || !Array.isArray(data.productos)) {
      throw new Error('El archivo no contiene un formato de respaldo válido de SAMU POS');
    }

    // Convertir imagenes base64 de vuelta a Blob
    const restoredProducts: Product[] = await Promise.all(
      data.productos.map(async (prod: any) => {
        let imagenBlob: Blob | undefined = undefined;
        if (prod.imagenBlobBase64) {
          imagenBlob = await base64ToBlob(prod.imagenBlobBase64);
        }
        const { imagenBlobBase64, ...cleanProd } = prod;
        return { ...cleanProd, imagenBlob };
      })
    );

    // Sobrescribir tablas atómicamente
    await db.transaction('rw', [
      db.sucursales, 
      db.usuarios, 
      db.categorias, 
      db.productos, 
      db.ventas, 
      db.cajas, 
      db.egresos,
      db.clientes,
      db.devoluciones
    ], async () => {
      await db.sucursales.clear();
      await db.usuarios.clear();
      await db.categorias.clear();
      await db.productos.clear();
      await db.ventas.clear();
      await db.cajas.clear();
      await db.egresos.clear();
      await db.clientes.clear();
      await db.devoluciones.clear();

      if (data.sucursales?.length) await db.sucursales.bulkAdd(data.sucursales);
      if (data.usuarios?.length) await db.usuarios.bulkAdd(data.usuarios);
      if (data.categorias?.length) await db.categorias.bulkAdd(data.categorias);
      if (restoredProducts.length) await db.productos.bulkAdd(restoredProducts);
      if (data.ventas?.length) await db.ventas.bulkAdd(data.ventas);
      if (data.cajas?.length) await db.cajas.bulkAdd(data.cajas);
      if (data.egresos?.length) await db.egresos.bulkAdd(data.egresos);
      if (data.clientes?.length) await db.clientes.bulkAdd(data.clientes);
      if (data.devoluciones?.length) await db.devoluciones.bulkAdd(data.devoluciones);
    });

    return { success: true, message: 'Respaldo restaurado exitosamente' };
  } catch (error: any) {
    console.error('Error importando respaldo:', error);
    return { success: false, message: error.message || 'Error al procesar el archivo JSON' };
  }
}

// Helper para descargar CSV con BOM UTF-8 para Excel
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Exportar Ventas a CSV para Excel
export async function exportSalesToCSV(): Promise<void> {
  const ventas = await db.ventas.toArray();
  const sorted = ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const headers = ['Nº Ticket', 'Fecha', 'Hora', 'Sucursal', 'Cajero', 'Cliente', 'Doc Cliente', 'Estado', 'Motivo Anulación', 'Subtotal (Bs)', 'Descuento (Bs)', 'Total (Bs)', 'Método de Pago', 'Prendas Vendidas'];
  const rows = sorted.map(v => {
    const fechaObj = new Date(v.fecha);
    const fechaStr = fechaObj.toLocaleDateString('es-BO');
    const horaStr = fechaObj.toLocaleTimeString('es-BO');
    const itemsResumen = v.items.map(i => `${i.cantidad}x ${i.nombreProducto}${i.talla ? ` [${i.talla}]` : ''}`).join(' | ');

    return [
      `"${v.numeroTicket}"`,
      `"${fechaStr}"`,
      `"${horaStr}"`,
      `"${v.sucursalNombre || v.sucursalId || 'Principal'}"`,
      `"${v.empleadoNombre || 'Cajero'}"`,
      `"${v.clienteNombre || 'Cliente General'}"`,
      `"${v.clienteDocumento || '-'}"`,
      `"${v.estado || 'COMPLETADA'}"`,
      `"${v.motivoAnulacion || '-'}"`,
      (v.subtotal || v.total).toFixed(2),
      (v.descuentoMonto || 0).toFixed(2),
      v.total.toFixed(2),
      `"${v.metodoPago}"`,
      `"${itemsResumen}"`
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  downloadCSV(csv, `samu_ventas_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 2. Exportar Inventario a CSV para Excel
export async function exportInventoryToCSV(): Promise<void> {
  const productos = await db.productos.toArray();
  const categorias = await db.categorias.toArray();
  const catMap = new Map(categorias.map(c => [c.id, c.nombre]));

  const headers = ['Código QR / Barra', 'Nombre de Prenda', 'Categoría', 'Precio (Bs)', 'Stock Global', 'Tallas Disponibles', 'Color', 'Estado'];
  const rows = productos.map(p => {
    const tallasStr = p.tallas?.length ? p.tallas.join(', ') : (p.talla || 'Única');
    const catNombre = catMap.get(p.categoriaId) || 'Sin Categoría';

    return [
      `"${p.qrCode}"`,
      `"${p.nombre}"`,
      `"${catNombre}"`,
      p.precio.toFixed(2),
      p.stock,
      `"${tallasStr}"`,
      `"${p.color || '-'}"`,
      p.activo ? 'ACTIVO' : 'INACTIVO'
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  downloadCSV(csv, `samu_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
}

// 3. Exportar Clientes a CSV para Excel
export async function exportCustomersToCSV(): Promise<void> {
  const clientes = await db.clientes.toArray();
  const headers = ['Nombre Completo', 'CI / Documento', 'Teléfono / WhatsApp', 'Email', 'Descuento VIP (%)', 'Total Compras (Bs)', 'Puntos Acumulados', 'Fecha Registro'];
  const rows = clientes.map(c => {
    const fechaStr = new Date(c.createdAt).toLocaleDateString('es-BO');
    return [
      `"${c.nombre}"`,
      `"${c.documento || '-'}"`,
      `"${c.telefono || '-'}"`,
      `"${c.email || '-'}"`,
      c.descuentoFrecuente || 0,
      (c.totalCompras || 0).toFixed(2),
      c.puntos || 0,
      `"${fechaStr}"`
    ].join(';');
  });

  const csv = [headers.join(';'), ...rows].join('\r\n');
  downloadCSV(csv, `samu_clientes_${new Date().toISOString().slice(0, 10)}.csv`);
}
