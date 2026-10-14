import React from 'react';
import { ShoppingCart, LogOut, ShieldCheck, UserCheck, Eye, User as UserIcon, Sun, Moon } from 'lucide-react';
import type { User } from '../types';
import samuLogo from '../assets/samu-logo.jpg';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentView: 'customer' | 'admin' | 'employee';
  onChangeView: (view: 'customer' | 'admin' | 'employee') => void;
  cartItemCount: number;
  onOpenCart: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  currentView,
  onChangeView,
  cartItemCount,
  onOpenCart,
  theme,
  onToggleTheme,
}) => {
  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 90,
      padding: '14px 5%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '30px'
    }}>
      {/* Brand logo & name */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} 
        onClick={() => onChangeView(user.role === 'employee' ? 'employee' : 'customer')}
        title="SAMU - Samara Muriel"
      >
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          padding: '2px',
          background: 'var(--accent-gradient)',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <img 
            src={samuLogo} 
            alt="SAMU Logo" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.4rem', 
            fontWeight: 800, 
            letterSpacing: '1.5px',
            lineHeight: 1.1
          }}>
            SAMU <span className="text-gradient">MURIEL</span>
          </span>
          <span style={{ 
            fontSize: '0.72rem', 
            color: 'var(--text-muted)', 
            letterSpacing: '0.8px', 
            textTransform: 'uppercase',
            fontWeight: 500,
            marginTop: '2px'
          }}>
            Confección Femenina
          </span>
        </div>
      </div>

      {/* View Switcher & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {/* Toggle views for Admin or Employee */}
        {(user.role === 'admin' || user.role === 'employee') && (
          <div className="glass-panel" style={{
            display: 'flex',
            padding: '4px',
            borderRadius: '10px',
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)'
          }}>
            {/* Storefront View */}
            <button
              type="button"
              onClick={() => onChangeView('customer')}
              className="btn btn-toggle"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: currentView === 'customer' ? 'var(--accent-gradient)' : 'transparent',
                color: currentView === 'customer' ? '#0b0b0c' : 'var(--text-secondary)',
                fontWeight: currentView === 'customer' ? 700 : 500,
                boxShadow: currentView === 'customer' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Eye size={13} />
              Tienda
            </button>

            {/* Employee POS Terminal View */}
            <button
              type="button"
              onClick={() => onChangeView('employee')}
              className="btn btn-toggle"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: currentView === 'employee' ? 'var(--accent-gradient)' : 'transparent',
                color: currentView === 'employee' ? '#0b0b0c' : 'var(--text-secondary)',
                fontWeight: currentView === 'employee' ? 700 : 500,
                boxShadow: currentView === 'employee' ? 'var(--shadow-sm)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <UserCheck size={13} />
              Terminal Empleado
            </button>

            {/* Admin Dashboard View (only for admin) */}
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => onChangeView('admin')}
                className="btn btn-toggle"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  background: currentView === 'admin' ? 'var(--accent-gradient)' : 'transparent',
                  color: currentView === 'admin' ? '#0b0b0c' : 'var(--text-secondary)',
                  fontWeight: currentView === 'admin' ? 700 : 500,
                  boxShadow: currentView === 'admin' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ShieldCheck size={13} />
                Admin
              </button>
            )}
          </div>
        )}

        {/* Customer Cart button (shown when in storefront view) */}
        {currentView === 'customer' && (
          <button
            onClick={onOpenCart}
            className="btn btn-secondary"
            style={{
              position: 'relative',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '12px'
            }}
          >
            <ShoppingCart size={18} color="var(--accent-primary)" />
            <span>Carrito</span>
            {cartItemCount > 0 && (
              <span className="animate-scale-up" style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--accent-gradient)',
                color: '#0b0b0c',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: 'var(--shadow-glow)'
              }}>
                {cartItemCount}
              </span>
            )}
          </button>
        )}

        {/* User profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn btn-secondary"
            style={{
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun size={15} color="var(--accent-primary)" /> : <Moon size={15} color="var(--accent-primary)" />}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserIcon size={13} color="var(--accent-primary)" />
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user.name || user.username}
              </span>
            </div>
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-gold)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {user.role === 'admin' ? 'Administrador' : user.role === 'employee' ? 'Empleado Tienda' : 'Cliente'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="btn btn-danger btn-sm"
            title="Cerrar Sesión"
            style={{ padding: '8px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
