import React, { useState } from 'react';
import { Lock, User as UserIcon, Sun, Moon } from 'lucide-react';
import type { User, Worker } from '../types';
import samuLogo from '../assets/samu-logo.jpg';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  workers: Worker[];
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, theme, onToggleTheme, workers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const userLower = username.trim().toLowerCase();
      const pwd = password.trim();

      // 1. Admin login
      if (userLower === 'alex' && pwd === '12345') {
        onLoginSuccess({
          username: 'Alex',
          role: 'admin',
        });
        return;
      }
      
      // 2. Customer login
      if (userLower === 'ricky' && pwd === '12345') {
        onLoginSuccess({
          username: 'Ricky',
          role: 'customer',
        });
        return;
      }

      // 3. Generic employee fallback
      if (userLower === 'empleado' && (pwd === '12345' || pwd === '123')) {
        onLoginSuccess({
          username: 'empleado',
          name: 'Empleado General',
          role: 'employee',
          branch: 'La Paz - El Prado'
        });
        return;
      }

      // 4. Match against registered Workers list (dynamic & initial)
      const matchedWorker = workers.find(w => 
        (w.username && w.username.toLowerCase() === userLower) ||
        w.name.toLowerCase().includes(userLower) ||
        w.id.toLowerCase() === userLower
      );

      if (matchedWorker) {
        const validPwd = matchedWorker.password || '123';
        if (pwd === validPwd || pwd === '12345' || pwd === '123') {
          onLoginSuccess({
            username: matchedWorker.username || matchedWorker.name.toLowerCase().split(' ')[0],
            name: matchedWorker.name,
            role: 'employee',
            workerId: matchedWorker.id,
            branch: matchedWorker.branch
          });
          return;
        }
      }

      setError('Usuario o contraseña incorrectos. Intente de nuevo.');
      setIsLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--login-bg)',
      position: 'relative'
    }} className="animate-fade-in">
      {/* Floating Theme Toggle */}
      <button
        type="button"
        onClick={onToggleTheme}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          borderRadius: '50%',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          zIndex: 10
        }}
        title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      >
        {theme === 'dark' ? <Sun size={20} color="var(--accent-primary)" /> : <Moon size={20} color="var(--accent-primary)" />}
      </button>

      <div className="glass-card animate-scale-up" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '44px 34px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px'
      }}>
        {/* Brand Logo */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            padding: '3px',
            background: 'var(--accent-gradient)',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <img 
              src={samuLogo} 
              alt="SAMU Logo" 
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>

        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '2.1rem', 
          fontWeight: 900, 
          letterSpacing: '2px', 
          marginBottom: '4px',
          lineHeight: 1.1 
        }}>
          SAMU <span className="text-gradient">MURIEL</span>
        </h2>
        <p style={{ 
          color: 'var(--text-gold)', 
          fontSize: '0.88rem', 
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '6px' 
        }}>
          Samara Muriel
        </p>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.88rem', 
          marginBottom: '28px',
          fontStyle: 'italic'
        }}>
          Confección de ropa femenina & venta exclusiva
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            textAlign: 'left'
          }} className="animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-primary)'
              }} />
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="Ej: ricky / juan / alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '42px' }}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-primary)'
              }} />
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '42px' }}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '48px', fontSize: '1rem', letterSpacing: '0.5px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={{ 
          marginTop: '26px', 
          padding: '14px', 
          borderRadius: '12px', 
          background: 'var(--card-subtle-bg)', 
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.5',
          textAlign: 'left'
        }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Cuentas de Acceso:</p>
          <p>👤 <strong>Cliente:</strong> <span style={{ color: 'var(--text-gold)' }}>ricky</span> / 12345</p>
          <p>👔 <strong>Empleado:</strong> <span style={{ color: 'var(--text-gold)' }}>juan</span> (o cualquier personal creado) / 123</p>
          <p>🛡️ <strong>Administrador:</strong> <span style={{ color: 'var(--text-gold)' }}>alex</span> / 12345</p>
        </div>
      </div>
    </div>
  );
};
