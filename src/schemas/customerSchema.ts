import { z } from 'zod';

export const customerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  descuentoFrecuente: z.number().min(0).max(100).optional(),
  notas: z.string().optional()
});

export type CustomerFormData = z.infer<typeof customerSchema>;

