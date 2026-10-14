import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import type { User, UserRole } from '../types/domain';
import { userRepository } from '../repositories/dexie/DexieUserRepository';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const cleanEmail = email.trim().toLowerCase();
          const user = await userRepository.getByEmail(cleanEmail);

          if (!user) {
            return { success: false, error: 'Credenciales inválidas. Usuario no encontrado.' };
          }

          if (!user.activo) {
            return { success: false, error: 'Esta cuenta está desactivada. Contacte al administrador.' };
          }

          const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
          if (!passwordMatch) {
            return { success: false, error: 'Credenciales inválidas. Contraseña incorrecta.' };
          }

          set({ user, isAuthenticated: true });
          return { success: true };
        } catch (error: any) {
          console.error('Error durante el inicio de sesión:', error);
          return { success: false, error: error.message || 'Error al iniciar sesión' };
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      hasRole: (roles: UserRole | UserRole[]) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        const roleList = Array.isArray(roles) ? roles : [roles];
        return roleList.includes(currentUser.rol);
      }
    }),
    {
      name: 'samu-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
