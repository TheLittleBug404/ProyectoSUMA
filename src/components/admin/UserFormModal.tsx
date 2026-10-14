import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Users, Sparkles } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { userSchema, type UserFormData } from '../../schemas/userSchema';
import type { User } from '../../types/domain';

interface UserFormModalProps {
  isOpen: boolean;
  userToEdit?: User | null;
  onClose: () => void;
  onSave: (data: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  userToEdit,
  onClose,
  onSave
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (userToEdit) {
        reset({
          nombre: userToEdit.nombre,
          email: userToEdit.email,
          password: '',
          rol: userToEdit.rol,
          sucursalId: userToEdit.sucursalId,
          activo: userToEdit.activo
        });
      } else {
        reset({
          nombre: '',
          email: '',
          password: '12345',
          rol: 'EMPLEADO',
          sucursalId: 'sucursal-principal-01',
          activo: true
        });
      }
    }
  }, [isOpen, userToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      let passwordHash = userToEdit?.passwordHash || '';
      if (data.password && data.password.trim()) {
        const salt = bcrypt.genSaltSync(10);
        passwordHash = bcrypt.hashSync(data.password.trim(), salt);
      } else if (!userToEdit) {
        // default password if creating new
        const salt = bcrypt.genSaltSync(10);
        passwordHash = bcrypt.hashSync('12345', salt);
      }

      await onSave({
        nombre: data.nombre,
        email: data.email,
        passwordHash,
        rol: data.rol,
        sucursalId: data.sucursalId,
        activo: data.activo
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error guardando usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-[#121216] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#181820] border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-300">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {userToEdit ? 'Editar Usuario / Personal' : 'Registrar Nuevo Empleado'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              placeholder="ej: Rodrigo Morales"
              {...register('nombre')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            {errors.nombre && <p className="text-[11px] text-red-400 mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Correo Electrónico (Login) *
            </label>
            <input
              type="email"
              placeholder="empleado@samu.com"
              {...register('email')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              {userToEdit ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña Inicial *'}
            </label>
            <input
              type="password"
              placeholder={userToEdit ? '••••••••' : '12345'}
              {...register('password')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Rol del Usuario *
            </label>
            <select
              {...register('rol')}
              className="w-full bg-[#18181f] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="EMPLEADO">EMPLEADO (Acceso a POS y Catálogo)</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR (Acceso Total)</option>
              <option value="CLIENTE">CLIENTE (Solo lectura Catálogo)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="user-activo"
              {...register('activo')}
              className="rounded border-zinc-700 text-amber-400 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="user-activo" className="text-xs text-zinc-300 font-semibold cursor-pointer">
              Cuenta Activa (Habilitada para iniciar sesión)
            </label>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : userToEdit ? 'Actualizar' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
