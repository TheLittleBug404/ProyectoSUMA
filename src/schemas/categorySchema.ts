import { z } from 'zod';

export const categorySchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional()
});

export type CategoryFormData = z.infer<typeof categorySchema>;
