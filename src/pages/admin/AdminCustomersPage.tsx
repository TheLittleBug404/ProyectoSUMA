import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Percent, 
  Award, 
  MessageCircle, 
  AlertCircle 
} from 'lucide-react';
import { customerRepository } from '../../repositories/dexie/DexieCustomerRepository';
import { CustomerFormModal } from '../../components/admin/CustomerFormModal';
import type { Customer } from '../../types/domain';
import type { CustomerFormData } from '../../schemas/customerSchema';
import { useModalStore } from '../../stores/useModalStore';

export const AdminCustomersPage: React.FC = () => {
  const { confirm, showToast } = useModalStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const list = await customerRepository.getAll({ search: searchTerm });
      setCustomers(list);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCreateOrUpdate = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await customerRepository.update(editingCustomer.id, data);
        setFeedback({ text: `Cliente "${data.nombre}" actualizado correctamente.` });
      } else {
        await customerRepository.create(data);
        setFeedback({ text: `Cliente "${data.nombre}" registrado exitosamente.` });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      await loadCustomers();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al guardar cliente', isError: true });
    }
  };

  const handleDelete = async (customer: Customer) => {
    const ok = await confirm({
      title: 'Eliminar Cliente',
      message: `¿Estás seguro de que deseas eliminar al cliente "${customer.nombre}"?`,
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });

    if (!ok) return;

    try {
      await customerRepository.delete(customer.id);
      showToast(`Cliente "${customer.nombre}" eliminado`);
      await loadCustomers();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error al eliminar cliente', isError: true });
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`¡Hola ${name}! Te saludamos de SAMU Samara Muriel Moda. Muchas gracias por tu preferencia.`);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/20 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <UserCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Directorio de Clientes & Fidelización
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Registro de clientes, puntos acumulados, descuentos frecuentes y contacto WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.isError
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none flex items-center">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CI/NIT o teléfono..."
            className="w-full bg-[#181820] border border-zinc-700 rounded-xl pl-11 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Customers Table / Grid */}
        <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820] border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">CI / Documento</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-center">Descuento</th>
                  <th className="py-3 px-4 text-right">Puntos</th>
                  <th className="py-3 px-4 text-right">Total Compras</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      No se encontraron clientes registrados.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p>{c.nombre}</p>
                            {c.email && <p className="text-[10px] text-zinc-400 font-normal">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-mono">
                        {c.documento || <span className="text-zinc-600">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {c.telefono ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{c.telefono}</span>
                            <button
                              onClick={() => openWhatsApp(c.telefono!, c.nombre)}
                              title="Enviar WhatsApp"
                              className="p-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.descuentoFrecuente && c.descuentoFrecuente > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Percent className="w-2.5 h-2.5" /> {c.descuentoFrecuente}% OFF
                          </span>
                        ) : (
                          <span className="text-zinc-600">0%</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Award className="w-2.5 h-2.5" /> {c.puntos || 0} pts
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        Bs. {(c.totalCompras || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsModalOpen(true);
                            }}
                            title="Editar Cliente"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            title="Eliminar Cliente"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Modal */}
        <CustomerFormModal
          isOpen={isModalOpen}
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleCreateOrUpdate}
        />
      </div>
    </div>
  );
};
