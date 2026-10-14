import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppNavbar } from '../components/layout/AppNavbar';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { CatalogPage } from '../pages/client/CatalogPage';
import { POSPage } from '../pages/employee/POSPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { BackupPage } from '../pages/admin/BackupPage';

// Layout que incluye la barra de navegación superior
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0c]">
      <AppNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[#d4af37]/15 py-6 px-4 text-center text-xs text-zinc-500 bg-[#0a0a0c]">
        <p>&copy; 2026 SAMU | Samara Muriel • Sistema 100% en Navegador (IndexedDB & Dexie)</p>
        <p className="mt-1 text-[11px] text-zinc-600">Punto de Venta e Inventario Textil Local</p>
      </footer>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Login sin layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas con AppLayout */}
        <Route element={<AppLayout />}>
          {/* Ruta pública / compartida */}
          <Route path="/catalogo" element={<CatalogPage />} />

          {/* Rutas Empleado / POS */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['EMPLEADO', 'ADMINISTRADOR']}>
                <POSPage />
              </ProtectedRoute>
            }
          />

          {/* Rutas Administrador */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/productos"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/respaldo"
            element={
              <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
                <BackupPage />
              </ProtectedRoute>
            }
          />

          {/* Redirección raíz y 404 */}
          <Route path="/" element={<Navigate to="/catalogo" replace />} />
          <Route path="*" element={<Navigate to="/catalogo" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
