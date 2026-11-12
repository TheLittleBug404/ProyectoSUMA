import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Power, RefreshCw, MapPin, Phone, Users, Shirt } from 'lucide-react';
import type { Branch } from '../../types/domain';
import { branchRepository } from '../../repositories/dexie/DexieBranchRepository';
import { userRepository } from '../../repositories/dexie/DexieUserRepository';
import { productRepository } from '../../repositories/dexie/DexieProductRepository';
import { BranchFormModal } from '../../components/admin/BranchFormModal';
import type { BranchFormData } from '../../schemas/branchSchema';

export const AdminBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allBranches, allUsers, allProducts] = await Promise.all([
        branchRepository.getAll(),
        userRepository.getAll(),
        productRepository.getAll({ soloActivos: false })
      ]);

      setBranches(allBranches);

      // Calcular usuarios por sucursal
      const uMap: Record<string, number> = {};
      for (const u of allUsers) {
        uMap[u.sucursalId] = (uMap[u.sucursalId] || 0) + 1;
      }
      setUserCounts(uMap);

      // Calcular prendas por sucursal
      const pMap: Record<string, number> = {};
      for (const p of allProducts) {
        if (p.sucursalesIds?.includes('TODAS')) {
          allBranches.forEach(b => {
            pMap[b.id] = (pMap[b.id] || 0) + 1;
          });
        } else if (p.sucursalesIds && p.sucursalesIds.length > 0) {
          p.sucursalesIds.forEach(bId => {
            pMap[bId] = (pMap[bId] || 0) + 1;
          });
        } else {
          pMap[p.sucursalId] = (pMap[p.sucursalId] || 0) + 1;
        }
      }
      setProductCounts(pMap);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBranch = async (data: BranchFormData) => {
    if (branchToEdit) {
      await branchRepository.update(branchToEdit.id, data);
    } else {
      await branchRepository.create(data);
    }
    await loadData();
  };

  const handleToggleStatus = async (branch: Branch) => {
    const newStatus = !branch.activa;
    const actionText = newStatus ? 'activar' : 'desactivar';

    if (window.confirm(`¿Deseas ${actionText} la sucursal "${branch.nombre}"?`)) {
      await branchRepository.update(branch.id, { activa: newStatus });
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Sucursales de Tienda SAMU
              </h1>
              <p className="text-xs text-zinc-400">
                Gestión de sedes, asignación de vendedores y distribución de prendas
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
                setBranchToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Sucursal</span>
            </button>
          </div>
        </div>

        {/* Branches Grid / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-400 text-xs">
              Cargando sucursales...
            </div>
          ) : branches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500 text-xs">
              No hay sucursales registradas.
            </div>
          ) : (
            branches.map((branch) => (
              <div 
                key={branch.id} 
                className={`bg-[#121216] border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  branch.activa 
                    ? 'border-zinc-800 hover:border-amber-500/40' 
                    : 'border-red-950/40 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{branch.nombre}</h3>
                        <span className="text-[10px] font-mono text-zinc-500">ID: #{branch.id.slice(0, 10)}</span>
                      </div>
                    </div>

                    {branch.activa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        Inactiva
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    <div className="flex items-start gap-2 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400/80" />
                      <span className="line-clamp-2">{branch.direccion || 'Sin dirección registrada'}</span>
                    </div>
                    {branch.telefono && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-amber-400/80" />
                        <span className="font-mono text-[11px]">{branch.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Counters */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
                    <div className="p-2 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-white font-mono">{userCounts[branch.id] || 0}</p>
                        <p className="text-[9px] text-zinc-400 uppercase">Personal</p>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2">
                      <Shirt className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-white font-mono">{productCounts[branch.id] || 0}</p>
                        <p className="text-[9px] text-zinc-400 uppercase">Prendas</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-zinc-800/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setBranchToEdit(branch);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Editar datos de sucursal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(branch)}
                    title={branch.activa ? 'Desactivar sucursal' : 'Activar sucursal'}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      branch.activa
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BranchFormModal
        isOpen={isModalOpen}
        branchToEdit={branchToEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBranch}
      />
    </div>
  );
};

