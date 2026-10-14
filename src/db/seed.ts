import bcrypt from 'bcryptjs';
import { db } from './dexie';
import type { Branch, User, Category, Product } from '../types/domain';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-01',
    nombre: 'Polos y Tops',
    descripcion: 'Prendas superiores casuales y elegantes'
  },
  {
    id: 'cat-02',
    nombre: 'Pantalones y Jeans',
    descripcion: 'Jeans rígidos, wide leg, cargo y pantalones sastre'
  },
  {
    id: 'cat-03',
    nombre: 'Chompas y Suéteres',
    descripcion: 'Prendas tejidas, cuellos tortuga, cárdigans y abrigos ligeros'
  },
  {
    id: 'cat-04',
    nombre: 'Vestidos y Enterizos',
    descripcion: 'Moda femenina para eventos, gala y noche'
  },
  {
    id: 'cat-05',
    nombre: 'Casacas y Chaquetas',
    descripcion: 'Casacas de cuero, blazers y prendas de abrigo'
  }
];

// Base de datos de productos vacía para producción Vercel
export const INITIAL_PRODUCTS: Product[] = [];

export async function seedInitialDataIfNeeded(): Promise<boolean> {
  const usersCount = await db.usuarios.count();

  // 1. Asegurar Sucursal Principal
  const branchCount = await db.sucursales.count();
  if (branchCount === 0) {
    const sucursalPrincipal: Branch = {
      id: 'sucursal-principal-01',
      nombre: 'Principal',
      direccion: 'Av. 16 de Julio (El Prado), Edif. Alameda Nº 1420',
      telefono: '+591 70123456',
      activa: true
    };
    await db.sucursales.add(sucursalPrincipal);
  }

  // 2. Asegurar categorías base
  const catCount = await db.categorias.count();
  if (catCount === 0) {
    await db.categorias.bulkAdd(INITIAL_CATEGORIES);
  }

  // 3. Limpiar datos de prueba antiguos si existen (para producción Vercel)
  const isMigrated = localStorage.getItem('samu_prod_clean_v1');
  if (!isMigrated) {
    // Vaciar productos de prueba
    await db.productos.clear();
    await db.ventas.clear();

    // Eliminar empleados de prueba y configurar único administrador
    await db.usuarios.clear();

    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Abc.12345', salt);

    const admin: User = {
      id: 'user-admin-01',
      nombre: 'Administrador',
      email: 'admin',
      passwordHash: adminHash,
      rol: 'ADMINISTRADOR',
      sucursalId: 'sucursal-principal-01',
      activo: true,
      createdAt: new Date().toISOString()
    };

    await db.usuarios.add(admin);
    localStorage.setItem('samu_prod_clean_v1', 'true');
    console.log('✅ Base de datos vaciada para producción. Único admin: admin / Abc.12345');
    return true;
  }

  // Si no hay usuarios en absoluto, crear el admin
  if (usersCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Abc.12345', salt);

    const admin: User = {
      id: 'user-admin-01',
      nombre: 'Administrador',
      email: 'admin',
      passwordHash: adminHash,
      rol: 'ADMINISTRADOR',
      sucursalId: 'sucursal-principal-01',
      activo: true,
      createdAt: new Date().toISOString()
    };

    await db.usuarios.add(admin);
    return true;
  }

  return false;
}

// Función manual para resetear la base de datos limpia a producción
export async function resetDatabaseToEmptyProduction(): Promise<void> {
  await db.productos.clear();
  await db.ventas.clear();
  await db.usuarios.clear();

  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Abc.12345', salt);

  const admin: User = {
    id: 'user-admin-01',
    nombre: 'Administrador',
    email: 'admin',
    passwordHash: adminHash,
    rol: 'ADMINISTRADOR',
    sucursalId: 'sucursal-principal-01',
    activo: true,
    createdAt: new Date().toISOString()
  };

  await db.usuarios.add(admin);
  localStorage.setItem('samu_prod_clean_v1', 'true');
}
