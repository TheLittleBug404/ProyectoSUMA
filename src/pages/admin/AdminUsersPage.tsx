import React, { useEffect, useState } from 'react';
import { Plus, Users, Edit2, ShieldCheck, UserCheck, RefreshCw, Power } from 'lucide-react';
import type { User } from '../../types/domain';
import { userRepository } from '../../repositories/dexie/DexieUserRepository';
import { UserFormModal } from '../../components/admin/UserFormModal';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await userRepository.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveUser = async (data: Omit<User, 'id' | 'createdAt'>) => {
    if (userToEdit) {
      await userRepository.update(userToEdit.id, data);
    } else {
      await userRepository.create(data);
    }
    await loadData();
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.activo;
    const actionText = newStatus ? 'activar' : 'desactivar';

    if (window.confirm(`¿Deseas ${actionText} la cuenta de "${user.nombre}"?`)) {
      await userRepository.update(user.id, { activo: newStatus });
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Personal & Gestión de Acceso
              </h1>
              <p className="text-xs text-zinc-400">
                Administradores, cajeros, contraseñas y asignación de sucursal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refrescar"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setUserToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#181820] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3.5 px-4">Nombre / Email</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Sucursal</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      Cargando personal...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{u.nombre}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">{u.email}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.rol === 'ADMINISTRADOR' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3" /> Administrador
                          </span>
                        ) : u.rol === 'EMPLEADO' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <UserCheck className="w-3 h-3" /> Empleado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            Cliente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        Principal
                      </td>

                      <td className="py-3.5 px-4">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                            <span className="w-2 h-2 rounded-full bg-red-400" /> Inactivo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setIsModalOpen(true);
                            }}
                            title="Editar Usuario"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              u.activo
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        userToEdit={userToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
};
