import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../schemas/authSchema';
import { useAuthStore } from '../stores/useAuthStore';
import samuLogo from '../assets/samu-logo.jpg';

export const LoginPage: React.FC = () => {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    setLoading(true);

    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      const user = useAuthStore.getState().user;
      const redirectPath = (location.state as any)?.from?.pathname;

      if (redirectPath && redirectPath !== '/login') {
        navigate(redirectPath, { replace: true });
        return;
      }

      if (user?.rol === 'ADMINISTRADOR') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user?.rol === 'EMPLEADO') {
        navigate('/pos', { replace: true });
      } else {
        navigate('/catalogo', { replace: true });
      }
    } else {
      setServerError(result.error || 'Credenciales incorrectas');
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d4af37]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Return to catalog button */}
      <div className="w-full max-w-md mb-4 flex justify-start z-10">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-300 transition-colors py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-amber-400/40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Catálogo</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-[#121216]/90 border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)]">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full p-1 bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#997524] shadow-[0_0_25px_rgba(212,175,55,0.35)] flex items-center justify-center overflow-hidden">
              <img src={samuLogo} alt="SAMU Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-widest bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              SAMU • SAMARA MURIEL
            </h1>
            <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-widest font-medium">
              Sistema de Gestión & Punto de Venta
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User / Email Field */}
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                Usuario / Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-amber-400/70 pointer-events-none flex items-center">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="admin"
                  {...register('email')}
                  className="w-full bg-[#18181f] border border-[#d4af37]/30 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-400 mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1.5">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-amber-400/70 pointer-events-none flex items-center">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-[#18181f] border border-[#d4af37]/30 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-400 mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Shortcut */}
          <div className="mt-6 pt-5 border-t border-[#d4af37]/15">
            <p className="text-[11px] text-zinc-400 mb-2.5 text-center font-medium">
              Acceso rápido con credenciales de administrador:
            </p>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'Abc.12345')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Autocompletar: admin / Abc.12345</span>
            </button>
          </div>
        </div>

        {/* Local Storage Indicator */}
        <p className="text-center text-[11px] text-zinc-500 mt-4">
          Base de datos local IndexedDB activa • Operación 100% en navegador
        </p>
      </div>
    </div>
  );
};
