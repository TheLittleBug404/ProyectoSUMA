import type { Worker } from '../types';

export const initialWorkers: Worker[] = [
  { id: 'w1', name: 'Juan Carlos Pérez', username: 'juan', password: '123', role: 'Vendedor Principal', branch: 'La Paz - El Prado', salesThisMonth: 12450.00, transactions: 48, status: 'Activo' },
  { id: 'w2', name: 'María René Delgado', username: 'maria', password: '123', role: 'Cajera Encargada', branch: 'Santa Cruz - Equipetrol', salesThisMonth: 19800.00, transactions: 72, status: 'Activo' },
  { id: 'w3', name: 'Carlos Rojas', username: 'carlos', password: '123', role: 'Supervisor de Tienda', branch: 'Cochabamba - Plaza Colón', salesThisMonth: 15400.00, transactions: 55, status: 'Activo' },
  { id: 'w4', name: 'Ana Sofía Gutiérrez', username: 'ana', password: '123', role: 'Asistente de Ventas', branch: 'La Paz - El Prado', salesThisMonth: 8900.00, transactions: 36, status: 'Activo' },
  { id: 'w5', name: 'Luis Fernando Méndez', username: 'luis', password: '123', role: 'Asistente de Ventas', branch: 'Santa Cruz - Equipetrol', salesThisMonth: 14100.00, transactions: 51, status: 'Activo' }
];
