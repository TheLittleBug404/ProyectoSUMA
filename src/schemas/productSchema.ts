import { z } from 'zod';

export const productSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  categoriaId: z.string().min(1, 'Seleccione una categoría'),
  talla: z.string().optional(),
  tallas: z.array(z.string()).optional(),
  stockPorSucursal: z.record(z.string(), z.number()).optional(),
  stockPorTalla: z.record(z.string(), z.number()).optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  colores: z.array(z.object({
    color: z.string(),
    colorHex: z.string(),
    stock: z.number().int().min(0)
  })).optional(),
  sucursalesIds: z.array(z.string()).optional(),
  qrCode: z.string().optional(),
  fotoUrl: z.string().optional()
});

export type ProductFormData = z.infer<typeof productSchema>;
