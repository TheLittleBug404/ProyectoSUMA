import { z } from 'zod';

export const branchSchema = z.object({
  nombre: z.string().min(2, 'El nombre de la sucursal debe tener al menos 2 caracteres'),
  direccion: z.string().min(3, 'La dirección es requerida'),
  telefono: z.string().optional(),
  activa: z.boolean()
});

export type BranchFormData = z.infer<typeof branchSchema>;

