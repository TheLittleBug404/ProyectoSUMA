import { z } from 'zod';

export const userSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El email es requerido').email('Email no válido'),
  password: z.string().optional(),
  rol: z.enum(['ADMINISTRADOR', 'EMPLEADO', 'CLIENTE']),
  sucursalId: z.string(),
  activo: z.boolean(),
  sueldo: z.number().min(0, 'El sueldo debe ser mayor o igual a 0').optional()
});

export type UserFormData = z.infer<typeof userSchema>;
