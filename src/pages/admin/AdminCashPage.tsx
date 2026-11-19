import React, { useEffect, useState } from 'react';
import { 
  Landmark, 
  Lock, 
  ArrowDownCircle, 
  Receipt, 
  RefreshCw, 
  QrCode, 
  Banknote,
  Trash2,
  FileText,
  Ban
} from 'lucide-react';
import type { CashRegister, CashExpense, Sale } from '../../types/domain';
import { cashRepository } from '../../repositories/dexie/DexieCashRepository';
import { saleRepository } from '../../repositories/dexie/DexieSaleRepository';
import type { LiveCashStats, CashPeriodSummary } from '../../repositories/interfaces/ICashRepository';
import { useAuthStore } from '../../stores/useAuthStore';
import { OpenCashModal } from '../../components/admin/OpenCashModal';
import { ExpenseModal } from '../../components/admin/ExpenseModal';
import { CloseCashModal } from '../../components/admin/CloseCashModal';
import { CashCloseReceiptModal } from '../../components/admin/CashCloseReceiptModal';
import { useModalStore } from '../../stores/useModalStore';

export const AdminCashPage: React.FC = () => {
  const { confirm, showToast } = useModalStore();
  const { user } = useAuthStore();

  // Active shift state
  const [activeShift, setActiveShift] = useState<CashRegister | null>(null);
  const [liveStats, setLiveStats] = useState<LiveCashStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for period
  const [period, setPeriod] = useState<'dia' | 'semana' | 'mes' | 'rango'>('dia');
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customTo, setCustomTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Historical data
  const [periodSummary, setPeriodSummary] = useState<CashPeriodSummary | null>(null);
  const [historicalShifts, setHistoricalShifts] = useState<CashRegister[]>([]);
  const [historicalExpenses, setHistoricalExpenses] = useState<CashExpense[]>([]);
  const [voidedSales, setVoidedSales] = useState<Sale[]>([]);

  // Active view tab in bottom section
  const [activeTab, setActiveTab] = useState<'cierres' | 'egresos' | 'anulaciones'>('cierres');

  // Modals state
  const [isOpenCashModalOpen, setIsOpenCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseCashModalOpen, setIsCloseCashModalOpen] = useState(false);
  const [selectedReceiptShift, setSelectedReceiptShift] = useState<CashRegister | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Check active shift
      const current = await cashRepository.getActiveCashRegister();
      if (current) {
        setActiveShift(current);
        const stats = await cashRepository.getLiveStats(current.id);
        setLiveStats(stats);
      } else {
        setActiveShift(null);
        setLiveStats(null);
      }

      // 2. Load period summary
      const fromParam = period === 'rango' && customFrom ? new Date(customFrom + 'T00:00:00').toISOString() : undefined;
      const toParam = period === 'rango' && customTo ? new Date(customTo + 'T23:59:59').toISOString() : undefined;

      const [summary, shifts, expenses, voided] = await Promise.all([
        cashRepository.getPeriodSummary({
          periodo: period,
          from: fromParam,
          to: toParam
        }),
        cashRepository.getCashRegisters({
          from: fromParam,
          to: toParam
        }),
        cashRepository.getExpenses({
          from: fromParam,
          to: toParam
        }),
        saleRepository.getSales({
          from: fromParam,
          to: toParam,
          estado: 'ANULADA'
        })
      ]);

      setPeriodSummary(summary);
      setHistoricalShifts(shifts);
      setHistoricalExpenses(expenses);
      setVoidedSales(voided);
    } catch (err) {
      console.error('Error cargando módulo de caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, customFrom, customTo]);

  // Handlers
  const handleOpenCash = async (montoApertura: number, notas?: string) => {
    if (!user) return;
    await cashRepository.openCashRegister({
      sucursalId: user.sucursalId || 'sucursal-principal-01',
      empleadoId: user.id,
      empleadoNombre: user.nombre,
      montoApertura,
      notas
    });
    await loadData();
  };

  const handleRegisterExpense = async (data: {
    categoria: any;
    descripcion: string;
    monto: number;
    comprobante?: string;
  }) => {
    if (!user) return;
    await cashRepository.registerExpense({
      cajaId: activeShift?.id,
      sucursalId: user.sucursalId || 'sucursal-principal-01',
      empleadoId: user.id,
      empleadoNombre: user.nombre,
      ...data
    });
    await loadData();
  };

  const handleCloseCash = async (montoRealEfectivo: number, notas?: string) => {
    if (!user || !activeShift) return;
    const closed = await cashRepository.closeCashRegister({
      id: activeShift.id,
      cerradoPorId: user.id,
      cerradoPorNombre: user.nombre,
      montoRealEfectivo,
      notas
    });
    await loadData();
    setSelectedReceiptShift(closed);
  };

  const handleDeleteExpense = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar Egreso',
      message: '¿Estás seguro de que deseas eliminar este registro de egreso de caja?',
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });

    if (ok) {
      await cashRepository.deleteExpense(id);
      showToast('Registro de egreso eliminado');
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                  Caja Chica & Cierres de Turno
                </h1>
                {activeShift ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Turno Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    <Lock className="w-2.5 h-2.5" />
                    Caja Cerrada
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Apertura con fondo base, registro de gastos a proveedores, arqueo físico y comprobante de corte
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              title="Refrescar"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Expense button */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-all cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>+ Registrar Egreso / Gasto</span>
            </button>

            {/* Open / Close Buttons */}
            {activeShift ? (
              <button
                onClick={() => setIsCloseCashModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Arqueo & Cierre de Caja</span>
              </button>
            ) : (
              <button
                onClick={() => setIsOpenCashModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
              >
                <Landmark className="w-4 h-4" />
                <span>Apertura de Caja</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Active Shift Box (if open) */}
        {activeShift && liveStats && (
          <div className="bg-[#121216] border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Turno Activo en Curso — Abierto por {activeShift.empleadoNombre || 'Personal'}
                </h2>
                <span className="text-xs text-zinc-400">
                  ({new Date(activeShift.fechaApertura).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                ID Turno: #{activeShift.id.slice(0, 8)}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Fondo Inicial */}
              <div className="bg-[#181820] p-3.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Fondo Apertura</span>
                <p className="text-lg font-bold font-mono text-zinc-100 mt-1">
                  Bs. {activeShift.montoApertura.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">Base en gaveta</span>
              </div>

              {/* Card 2: Ventas Efectivo */}
              <div className="bg-[#181820] p-3.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">(+) Ventas Efectivo</span>
                <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  Bs. {liveStats.totalVentasEfectivo.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">{liveStats.ventasCount} tickets emitidos</span>
              </div>

              {/* Card 3: Ventas Bancarias (QR/Tarjeta) */}
              <div className="bg-[#181820] p-3.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-amber-300 uppercase font-semibold block">Ventas QR / Tarjeta</span>
                <p className="text-lg font-bold font-mono text-amber-300 mt-1">
                  Bs. {(liveStats.totalVentasQR + liveStats.totalVentasTarjeta).toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">Acreditación bancaria</span>
              </div>

              {/* Card 4: Egresos Registrados */}
              <div className="bg-[#181820] p-3.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-red-400 uppercase font-semibold block">(-) Salidas / Egresos</span>
                <p className="text-lg font-bold font-mono text-red-400 mt-1">
                  - Bs. {liveStats.totalEgresos.toFixed(2)}
                </p>
                <span className="text-[10px] text-zinc-500">{liveStats.egresosCount} salidas</span>
              </div>

              {/* Card 5: Efectivo Esperado */}
              <div className="col-span-2 sm:col-span-1 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300 uppercase font-bold block">(=) Efectivo Esperado</span>
                <p className="text-xl font-black font-mono text-white mt-1">
                  Bs. {liveStats.montoEsperadoEfectivo.toFixed(2)}
                </p>
                <span className="text-[10px] text-amber-400/80 font-semibold">Monto a cuadrar en arqueo</span>
              </div>
            </div>
          </div>
        )}

        {/* Section: Historical Analysis & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#121216] border border-zinc-800 p-4 rounded-2xl">
            {/* Period tabs */}
            <div className="flex items-center gap-1 bg-[#181820] p-1 rounded-xl border border-zinc-800">
              {(['dia', 'semana', 'mes', 'rango'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPeriod(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    period === tab
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'dia' ? 'Hoy / Día' : tab === 'semana' ? 'Esta Semana' : tab === 'mes' ? 'Este Mes' : 'Rango Fechas'}
                </button>
              ))}
            </div>

            {/* Custom range datepickers */}
            {period === 'rango' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Desde:</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-[#181820] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-400"
                />
                <span className="text-zinc-400">Hasta:</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-[#181820] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* 4 Period Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121216] border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Ventas en Efectivo</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                Bs. {periodSummary ? periodSummary.totalVentasEfectivo.toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" /> Ingreso físico en caja
              </p>
            </div>

            <div className="bg-[#121216] border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Ventas QR & Tarjeta</span>
              <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                Bs. {periodSummary ? (periodSummary.totalVentasQR + periodSummary.totalVentasTarjeta).toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" /> Ingreso en cuenta bancaria
              </p>
            </div>

            <div className="bg-[#121216] border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Egresos & Proveedores</span>
              <p className="text-2xl font-bold font-mono text-red-400 mt-1">
                - Bs. {periodSummary ? periodSummary.totalEgresos.toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <ArrowDownCircle className="w-3.5 h-3.5" /> Salidas autorizadas
              </p>
            </div>

            <div className="bg-[#121216] border border-[#d4af37]/30 p-4 rounded-2xl shadow-lg bg-gradient-to-br from-[#121216] to-amber-950/10">
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Balance Neto del Período</span>
              <p className={`text-2xl font-black font-mono mt-1 ${
                (periodSummary?.balanceNeto ?? 0) >= 0 ? 'text-amber-400' : 'text-red-400'
              }`}>
                Bs. {periodSummary ? periodSummary.balanceNeto.toFixed(2) : '0.00'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                (Total Ingresos - Total Egresos)
              </p>
            </div>
          </div>

          {/* Sub-Tabs: Cierres de caja vs Egresos */}
          <div className="bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center gap-4 px-5 py-3 bg-[#181820] border-b border-zinc-800 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('cierres')}
                className={`flex items-center gap-2 pb-1 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'cierres'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Historial de Cierres de Caja ({historicalShifts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('egresos')}
                className={`flex items-center gap-2 pb-1 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'egresos'
                    ? 'text-amber-400 border-b-2 border-amber-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>Registro de Egresos & Gastos ({historicalExpenses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('anulaciones')}
                className={`flex items-center gap-2 pb-1 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'anulaciones'
                    ? 'text-red-400 border-b-2 border-red-400'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Ban className="w-4 h-4" />
                <span>Auditoría de Ventas Anuladas ({voidedSales.length})</span>
              </button>
            </div>

            {/* TAB 1: Cierres de Caja */}
            {activeTab === 'cierres' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#14141a] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Turno #</th>
                      <th className="py-3 px-4">Apertura</th>
                      <th className="py-3 px-4">Cierre</th>
                      <th className="py-3 px-4">Responsable</th>
                      <th className="py-3 px-4 text-right">Fondo Base</th>
                      <th className="py-3 px-4 text-right">Ventas Efec.</th>
                      <th className="py-3 px-4 text-right">Egresos</th>
                      <th className="py-3 px-4 text-right">Esperado</th>
                      <th className="py-3 px-4 text-right">Contado (Arqueo)</th>
                      <th className="py-3 px-4 text-right">Diferencia</th>
                      <th className="py-3 px-4 text-center">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {historicalShifts.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-zinc-500">
                          No hay turnos ni cierres registrados en este período.
                        </td>
                      </tr>
                    ) : (
                      historicalShifts.map((s) => {
                        const dif = s.diferencia ?? 0;
                        const isSquare = Math.abs(dif) < 0.01;
                        const isSurp = dif > 0.01;

                        return (
                          <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-amber-300">
                              #{s.id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-4 text-zinc-300">
                              {new Date(s.fechaApertura).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="py-3 px-4 text-zinc-300">
                              {s.fechaCierre ? (
                                new Date(s.fechaCierre).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  En Curso
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-zinc-200 font-medium">
                              {s.empleadoNombre || 'Personal'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-zinc-300">
                              Bs. {s.montoApertura.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-400">
                              Bs. {s.totalVentasEfectivo.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-red-400">
                              - Bs. {s.totalEgresos.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-zinc-100 font-bold">
                              Bs. {s.montoEsperadoEfectivo.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-amber-300 font-bold">
                              {s.montoRealEfectivo !== undefined ? `Bs. ${s.montoRealEfectivo.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              {s.estado === 'ABIERTA' ? (
                                <span className="text-zinc-500">—</span>
                              ) : isSquare ? (
                                <span className="text-emerald-400">Bs. 0.00</span>
                              ) : isSurp ? (
                                <span className="text-amber-300">+ Bs. {dif.toFixed(2)}</span>
                              ) : (
                                <span className="text-red-400">- Bs. {Math.abs(dif).toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {s.estado === 'CERRADA' ? (
                                <button
                                  onClick={() => setSelectedReceiptShift(s)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
                                  title="Ver comprobante de corte"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setIsCloseCashModalOpen(true)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-zinc-950 hover:bg-amber-300 cursor-pointer"
                                >
                                  Cerrar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Auditoría de Ventas Anuladas */}
            {activeTab === 'anulaciones' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#14141a] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Nº Ticket</th>
                      <th className="py-3 px-4">Fecha Venta</th>
                      <th className="py-3 px-4">Fecha Anulación</th>
                      <th className="py-3 px-4">Anulado Por</th>
                      <th className="py-3 px-4">Motivo de Anulación</th>
                      <th className="py-3 px-4">Prendas Reingresadas</th>
                      <th className="py-3 px-4 text-right">Monto Devuelto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {voidedSales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          No se registraron ventas anuladas en este período.
                        </td>
                      </tr>
                    ) : (
                      voidedSales.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-red-400">
                            {v.numeroTicket}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {new Date(v.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 text-[11px]">
                            {v.fechaAnulacion 
                              ? new Date(v.fechaAnulacion).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white font-semibold">{v.anuladoPorNombre || 'Personal'}</span>
                            <span className="ml-1 text-[10px] text-zinc-400">({v.anuladoPorRol || 'Cajero'})</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300 max-w-xs truncate" title={v.motivoAnulacion}>
                            {v.motivoAnulacion || 'Sin motivo'}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {v.items.map(i => `${i.cantidad}x ${i.nombreProducto}${i.talla ? ` [${i.talla}]` : ''}`).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-red-400">
                            - Bs. {v.total.toFixed(2)}
                            <span className="block text-[9px] text-zinc-500 font-sans font-normal">{v.metodoPago}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Registro de Egresos */}
            {activeTab === 'egresos' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#14141a] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Concepto / Detalle</th>
                      <th className="py-3 px-4">Comprobante</th>
                      <th className="py-3 px-4">Registrado por</th>
                      <th className="py-3 px-4 text-right">Monto (Bs.)</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {historicalExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          No hay egresos ni pagos registrados en este período.
                        </td>
                      </tr>
                    ) : (
                      historicalExpenses.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 text-zinc-300">
                            {new Date(e.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
                              {e.categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-medium">
                            {e.descripcion}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                            {e.comprobante || '—'}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {e.empleadoNombre || 'Personal'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-red-400">
                            - Bs. {e.monto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              title="Eliminar egreso"
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Auditoría de Ventas Anuladas */}
            {activeTab === 'anulaciones' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#14141a] border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Nº Ticket</th>
                      <th className="py-3 px-4">Fecha Venta</th>
                      <th className="py-3 px-4">Fecha Anulación</th>
                      <th className="py-3 px-4">Anulado Por</th>
                      <th className="py-3 px-4">Motivo de Anulación</th>
                      <th className="py-3 px-4">Prendas Reingresadas</th>
                      <th className="py-3 px-4 text-right">Monto Devuelto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {voidedSales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          No se registraron ventas anuladas en este período.
                        </td>
                      </tr>
                    ) : (
                      voidedSales.map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-red-400">
                            {v.numeroTicket}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {new Date(v.fecha).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 px-4 text-zinc-300 text-[11px]">
                            {v.fechaAnulacion 
                              ? new Date(v.fechaAnulacion).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
                              : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white font-semibold">{v.anuladoPorNombre || 'Personal'}</span>
                            <span className="ml-1 text-[10px] text-zinc-400">({v.anuladoPorRol || 'Cajero'})</span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300 max-w-xs truncate" title={v.motivoAnulacion}>
                            {v.motivoAnulacion || 'Sin motivo'}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {v.items.map(i => `${i.cantidad}x ${i.nombreProducto}${i.talla ? ` [${i.talla}]` : ''}`).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-red-400">
                            - Bs. {v.total.toFixed(2)}
                            <span className="block text-[9px] text-zinc-500 font-sans font-normal">{v.metodoPago}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OpenCashModal
        isOpen={isOpenCashModalOpen}
        onClose={() => setIsOpenCashModalOpen(false)}
        onConfirm={handleOpenCash}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onConfirm={handleRegisterExpense}
      />

      <CloseCashModal
        isOpen={isCloseCashModalOpen}
        liveStats={liveStats}
        onClose={() => setIsCloseCashModalOpen(false)}
        onConfirm={handleCloseCash}
      />

      <CashCloseReceiptModal
        isOpen={!!selectedReceiptShift}
        caja={selectedReceiptShift}
        onClose={() => setSelectedReceiptShift(null)}
      />
    </div>
  );
};
