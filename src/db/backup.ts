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
    version: 1,
    timestamp: new Date().toISOString(),
    sucursales,
    usuarios,
    categorias,
    productos,
    ventas
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
    await db.transaction('rw', [db.sucursales, db.usuarios, db.categorias, db.productos, db.ventas], async () => {
      await db.sucursales.clear();
      await db.usuarios.clear();
      await db.categorias.clear();
      await db.productos.clear();
      await db.ventas.clear();

      if (data.sucursales?.length) await db.sucursales.bulkAdd(data.sucursales);
      if (data.usuarios?.length) await db.usuarios.bulkAdd(data.usuarios);
      if (data.categorias?.length) await db.categorias.bulkAdd(data.categorias);
      if (restoredProducts.length) await db.productos.bulkAdd(restoredProducts);
      if (data.ventas?.length) await db.ventas.bulkAdd(data.ventas);
    });

    return { success: true, message: 'Respaldo restaurado exitosamente' };
  } catch (error: any) {
    console.error('Error importando respaldo:', error);
    return { success: false, message: error.message || 'Error al procesar el archivo JSON' };
  }
}
