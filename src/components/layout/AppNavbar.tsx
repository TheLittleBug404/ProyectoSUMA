import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ScanLine, 
  LayoutDashboard, 
  Shirt, 
  Tags, 
  Users, 
  Database, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import samuLogo from '../../assets/samu-logo.jpg';

export const AppNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.rol) {
      case 'ADMINISTRADOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <ShieldCheck className="w-3 h-3" /> Admin
          </span>
        );
      case 'EMPLEADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <UserCheck className="w-3 h-3" /> Empleado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <UserIcon className="w-3 h-3" /> Cliente
          </span>
        );
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-amber-400 text-zinc-950 font-bold shadow-[0_0_12px_rgba(212,175,55,0.3)]'
        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-amber-400 text-zinc-950 font-bold shadow'
        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
    }`;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0c]/95 border-b border-[#d4af37]/20 px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => {
            navigate('/catalogo');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#997524] shadow-[0_0_15px_rgba(212,175,55,0.35)] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img src={samuLogo} alt="SAMU Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-widest text-lg font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                SAMU
              </span>
              <span className="text-[9px] font-bold tracking-wider text-amber-400/90 border border-amber-500/40 rounded px-1.5 py-0.2 bg-amber-500/10">
                POS
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium">
              Samara Muriel • Moda
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          <NavLink to="/catalogo" className={navLinkClass}>
            <ShoppingBag className="w-3.5 h-3.5" /> Catálogo
          </NavLink>

          {(user?.rol === 'EMPLEADO' || user?.rol === 'ADMINISTRADOR') && (
            <NavLink to="/pos" className={navLinkClass}>
              <ScanLine className="w-3.5 h-3.5" /> Punto de Venta (POS)
            </NavLink>
          )}

          {user?.rol === 'ADMINISTRADOR' && (
            <>
              <NavLink to="/admin/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-3.5 h-3.5" /> Métricas
              </NavLink>
              <NavLink to="/admin/productos" className={navLinkClass}>
                <Shirt className="w-3.5 h-3.5" /> Prendas
              </NavLink>
              <NavLink to="/admin/categorias" className={navLinkClass}>
                <Tags className="w-3.5 h-3.5" /> Categorías
              </NavLink>
              <NavLink to="/admin/usuarios" className={navLinkClass}>
                <Users className="w-3.5 h-3.5" /> Equipo
              </NavLink>
              <NavLink to="/admin/respaldo" className={navLinkClass}>
                <Database className="w-3.5 h-3.5" /> Respaldo
              </NavLink>
            </>
          )}
        </div>

        {/* User profile & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-zinc-100">{user.nombre}</p>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>

              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              Iniciar Sesión
            </button>
          )}

          {/* Mobile Hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-4 pb-2 border-t border-zinc-800/80 mt-3 space-y-1.5 animate-fade-in">
          {user && (
            <div className="px-3 py-2 mb-2 bg-[#181820] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-100">{user.nombre}</p>
                <p className="text-[10px] text-zinc-400">{user.email}</p>
              </div>
              {getRoleBadge()}
            </div>
          )}

          <NavLink 
            to="/catalogo" 
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavLinkClass}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" /> Catálogo de Ropa
          </NavLink>

          {(user?.rol === 'EMPLEADO' || user?.rol === 'ADMINISTRADOR') && (
            <NavLink 
              to="/pos" 
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <ScanLine className="w-4 h-4 text-emerald-400" /> Punto de Venta (POS)
            </NavLink>
          )}

          {user?.rol === 'ADMINISTRADOR' && (
            <>
              <NavLink 
                to="/admin/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" /> Métricas & Dashboard
              </NavLink>
              <NavLink 
                to="/admin/productos" 
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Shirt className="w-4 h-4 text-amber-400" /> Gestión de Prendas
              </NavLink>
              <NavLink 
                to="/admin/categorias" 
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Tags className="w-4 h-4 text-amber-400" /> Categorías
              </NavLink>
              <NavLink 
                to="/admin/usuarios" 
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Users className="w-4 h-4 text-amber-400" /> Personal de Tienda
              </NavLink>
              <NavLink 
                to="/admin/respaldo" 
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                <Database className="w-4 h-4 text-amber-400" /> Respaldo JSON
              </NavLink>
            </>
          )}

          <div className="pt-2 border-t border-zinc-800/60">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
