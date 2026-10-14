import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  ShoppingBag, 
  User as UserIcon, 
  RefreshCw,
  Award,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { SaleStats, Sale, User } from '../../types/domain';
import { saleRepository } from '../../repositories/dexie/DexieSaleRepository';
import { userRepository } from '../../repositories/dexie/DexieUserRepository';

const CHART_COLORS = ['#d4af37', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<SaleStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Calcular fecha inicial según rango
      const now = new Date();
      let fromDate: string | undefined = undefined;

      if (timeRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        fromDate = today.toISOString();
      } else if (timeRange === 'week') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        fromDate = lastWeek.toISOString();
      } else if (timeRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        fromDate = startOfMonth.toISOString();
      } else if (timeRange === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        fromDate = startOfYear.toISOString();
      }

      const filters = {
        from: fromDate,
        empleadoId: selectedEmployee !== 'all' ? selectedEmployee : undefined
      };

      const [statsData, salesData, usersData] = await Promise.all([
        saleRepository.getStats(filters),
        saleRepository.getSales(filters),
        userRepository.getAll()
      ]);

      setStats(statsData);
      setRecentSales(salesData.slice(0, 8)); // Top 8 recientes
      setUsers(usersData);
    } catch (err) {
      console.error('Error cargando métricas de dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, selectedEmployee]);

  const userMap = useMemo(() => {
    return new Map(users.map(u => [u.id, u.nombre]));
  }, [users]);

  // Total de prendas vendidas en el período
  const totalGarmentsSold = useMemo(() => {
    if (!stats) return 0;
    return stats.productosMasVendidos.reduce((sum, p) => sum + p.cantidad, 0);
  }, [stats]);

  // Custom Dark Tooltip para gráficos Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#121216] border border-[#d4af37]/40 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <p className="text-zinc-300 font-bold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('total') || entry.name.toLowerCase().includes('recaudación')
                ? `Bs. ${entry.value.toFixed(2)}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Dashboard & Métricas Comerciales
              </h1>
              <p className="text-xs text-zinc-400">
                Control de ingresos, volumen de tickets y rendimiento por empleado
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time range selector */}
            <div className="flex items-center bg-[#181820] border border-zinc-800 rounded-xl p-1">
              {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: '7 Días' },
                { id: 'month', label: 'Este Mes' },
                { id: 'year', label: 'Año' },
                { id: 'all', label: 'Todo' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeRange(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === tab.id
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-1.5 bg-[#181820] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-amber-400/80" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#181820]">Todos los Cajeros</option>
                {users.filter(u => u.rol !== 'CLIENTE').map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#181820]">{u.nombre}</option>
                ))}
              </select>
            </div>

            <button
              onClick={loadDashboardData}
              title="Actualizar datos"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Recaudado */}
          <div className="bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-amber-400" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Ingresos Totales
              </span>
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Bs. {stats ? stats.montoTotal.toFixed(2) : '0.00'}
            </p>
            <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> Registrado en caja local
            </p>
          </div>

          {/* Card 2: Tickets Emitidos */}
          <div className="bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Tickets / Ventas
              </span>
              <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {stats ? stats.totalVentas : 0}
            </p>
            <p className="text-[10px] text-zinc-400 mt-2">
              Transacciones completadas con éxito
            </p>
          </div>

          {/* Card 3: Ticket Promedio */}
          <div className="bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Ticket Promedio
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              Bs. {stats ? stats.ticketPromedio.toFixed(2) : '0.00'}
            </p>
            <p className="text-[10px] text-zinc-400 mt-2">
              Promedio facturado por compra
            </p>
          </div>

          {/* Card 4: Prendas Vendidas */}
          <div className="bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                Prendas Despachadas
              </span>
              <span className="p-1.5 rounded-lg bg-pink-500/15 text-pink-400">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {totalGarmentsSold}
            </p>
            <p className="text-[10px] text-zinc-400 mt-2">
              Unidades físicas de stock entregadas
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart: Recaudación por Día (7 Cols) */}
          <div className="lg:col-span-7 bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Evolución de Recaudación Diaria
                </h3>
                <p className="text-[11px] text-zinc-400">Monto total vendido por fecha (Bs.)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                IndexedDB Feed
              </span>
            </div>

            <div className="h-64 w-full">
              {stats && stats.ventasPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.ventasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                    <XAxis dataKey="fecha" stroke="#666675" fontSize={10} tickLine={false} />
                    <YAxis stroke="#666675" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Recaudación"
                      stroke="#d4af37" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorGold)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  No hay ventas registradas en este período.
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart: Top 5 Prendas más vendidas (5 Cols) */}
          <div className="lg:col-span-5 bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Top Prendas Más Vendidas
                </h3>
                <p className="text-[11px] text-zinc-400">Prendas con mayor salida en unidades</p>
              </div>
              <Award className="w-4 h-4 text-amber-400" />
            </div>

            <div className="h-64 w-full">
              {stats && stats.productosMasVendidos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.productosMasVendidos.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                    <XAxis dataKey="nombre" stroke="#666675" fontSize={10} tickLine={false} tickFormatter={(val) => val.split(' ')[0]} />
                    <YAxis stroke="#666675" fontSize={10} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="cantidad" name="Unidades Vendidas" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {stats.productosMasVendidos.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  Sin ventas de productos aún.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Rendimiento por Empleado & Historial de Últimas Ventas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rendimiento por Empleado (5 Cols) */}
          <div className="lg:col-span-5 bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Ventas por Vendedor
              </h3>
              <UserIcon className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-3">
              {stats && stats.ventasPorEmpleado.length > 0 ? (
                stats.ventasPorEmpleado.map((emp, idx) => {
                  const percent = stats.montoTotal > 0 ? (emp.total / stats.montoTotal) * 100 : 0;

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-[#181820] border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-100">{emp.nombre}</span>
                        <span className="font-mono font-bold text-amber-400">Bs. {emp.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-amber-600 h-1.5 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>{emp.cantidad} tickets cobrados</span>
                        <span>{percent.toFixed(1)}% del total</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No hay registro de ventas por empleado en este rango.
                </div>
              )}
            </div>
          </div>

          {/* Últimos Tickets / Transacciones (7 Cols) */}
          <div className="lg:col-span-7 bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Últimas Transacciones Registradas
              </h3>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Cajero</th>
                    <th className="py-2.5 px-3">Método</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                        Aún no se han cobrado ventas.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {sale.numeroTicket}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                          {new Date(sale.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-200">
                          {userMap.get(sale.empleadoId) || 'Cajero'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sale.metodoPago === 'EFECTIVO'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : sale.metodoPago === 'QR'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}>
                            {sale.metodoPago}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          Bs. {sale.total.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
