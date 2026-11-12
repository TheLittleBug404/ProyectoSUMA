import React, { useEffect, useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive,
  Users,
  Shirt,
  Tags,
  Receipt,
  Landmark,
  ArrowDownCircle,
  FileSpreadsheet,
  UserCheck,
  RotateCcw as ReturnIcon
} from 'lucide-react';
import { db } from '../../db/dexie';
import { 
  downloadBackupFile, 
  importDatabaseBackup, 
  exportSalesToCSV, 
  exportInventoryToCSV, 
  exportCustomersToCSV 
} from '../../db/backup';
import { seedInitialDataIfNeeded } from '../../db/seed';

export const BackupPage: React.FC = () => {
  const [stats, setStats] = useState({
    sucursales: 0,
    usuarios: 0,
    categorias: 0,
    productos: 0,
    ventas: 0,
    cajas: 0,
    egresos: 0,
    clientes: 0,
    devoluciones: 0
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatabaseCounts = async () => {
    try {
      const [sucursales, usuarios, categorias, productos, ventas, cajas, egresos, clientes, devoluciones] = await Promise.all([
        db.sucursales.count(),
        db.usuarios.count(),
        db.categorias.count(),
        db.productos.count(),
        db.ventas.count(),
        db.cajas.count(),
        db.egresos.count(),
        db.clientes.count(),
        db.devoluciones.count()
      ]);
      setStats({ sucursales, usuarios, categorias, productos, ventas, cajas, egresos, clientes, devoluciones });
    } catch (err) {
      console.error('Error cargando conteos de BD:', err);
    }
  };

  useEffect(() => {
    loadDatabaseCounts();
  }, []);

  const handleExport = async () => {
    try {
      setLoading(true);
      await downloadBackupFile();
      setStatusMessage({ text: 'Respaldo JSON descargado correctamente en tu equipo.' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error al exportar respaldo', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (type: 'ventas' | 'inventario' | 'clientes') => {
    try {
      setLoading(true);
      if (type === 'ventas') await exportSalesToCSV();
      if (type === 'inventario') await exportInventoryToCSV();
      if (type === 'clientes') await exportCustomersToCSV();
      setStatusMessage({ text: `Reporte de ${type} en formato CSV (Excel) generado exitosamente.` });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error al exportar CSV', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('⚠️ ADVERTENCIA: Importar un respaldo sobrescribirá los datos actuales de la tienda en este navegador. ¿Deseas continuar?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(null);
      const text = await file.text();
      const res = await importDatabaseBackup(text);

      if (res.success) {
        setStatusMessage({ text: '¡Base de datos restaurada exitosamente!' });
        await loadDatabaseCounts();
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Error al procesar el archivo', isError: true });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetToFactorySeed = async () => {
    if (window.confirm('⚠️ ¿Estás seguro de restablecer la base de datos a los valores de fábrica (Seed inicial)? Se perderán las ventas actuales no respaldadas.')) {
      try {
        setLoading(true);
        localStorage.removeItem('samu_prod_clean_v1');
        await seedInitialDataIfNeeded();
        await loadDatabaseCounts();
        setStatusMessage({ text: 'Base de datos restaurada al estado inicial de producción.' });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Error al restablecer', isError: true });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121216] border border-[#d4af37]/20 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Database className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold font-serif text-white tracking-wide">
                Respaldo, Restauración y Exportación Excel
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Copia de seguridad local para proteger tu base de datos y exportación a hojas de cálculo
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            statusMessage.isError
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}>
            {statusMessage.isError ? (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Database Inventory Counters */}
        <div className="bg-[#121216] border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Registros Almacenados en el Navegador (IndexedDB)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <Shirt className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.productos}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Prendas</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.ventas}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Ventas</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.clientes}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Clientes</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <ReturnIcon className="w-4 h-4 text-pink-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.devoluciones}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Devoluciones</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <Landmark className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.cajas}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Cierres</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.egresos}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Egresos</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <Tags className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.categorias}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Categorías</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-base font-black text-white font-mono">{stats.usuarios}</p>
                <p className="text-[9px] text-zinc-400 uppercase">Personal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Export to Excel / CSV */}
        <div className="bg-[#121216] border border-emerald-500/20 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Exportar Reportes para Excel (Formato CSV)
              </h2>
              <p className="text-xs text-zinc-400">
                Descarga tablas limpias compatibles con Microsoft Excel, Google Sheets y LibreOffice Calc
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleExportCSV('ventas')}
              disabled={loading}
              className="p-4 rounded-xl bg-[#181820] border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs font-bold text-white">Ventas y Facturación</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Tickets, cajeros, clientes, métodos de pago y totales</p>
            </button>

            <button
              onClick={() => handleExportCSV('inventario')}
              disabled={loading}
              className="p-4 rounded-xl bg-[#181820] border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <Shirt className="w-5 h-5 text-amber-400" />
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs font-bold text-white">Inventario de Ropa</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Códigos QR, precios, stock, tallas y categorías</p>
            </button>

            <button
              onClick={() => handleExportCSV('clientes')}
              disabled={loading}
              className="p-4 rounded-xl bg-[#181820] border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <Download className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-xs font-bold text-white">Directorio Clientes</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Contactos, teléfonos WhatsApp, compras y puntos</p>
            </button>
          </div>
        </div>

        {/* Section: Backup and Restore JSON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Export JSON */}
          <div className="bg-[#121216] border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Descargar Copia de Seguridad Completa (.json)
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Empaqueta todas las tablas: catálogo con fotos, ventas, cierres, clientes y devoluciones. Útil para migrar a otra computadora o guardar en memoria USB.
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo JSON de Seguridad</span>
            </button>
          </div>

          {/* Card Import JSON */}
          <div className="bg-[#121216] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Restaurar Copia de Seguridad
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Carga un archivo de respaldo <span className="text-blue-300 font-mono">.json</span>. Reconstruirá el catálogo, clientes y el histórico de transacciones en este navegador.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="import-backup-input"
              />
              <label
                htmlFor="import-backup-input"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Seleccionar y Restaurar Archivo JSON</span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone: Factory Reset */}
        <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" /> Zona de Reinicialización
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1">
              Restaura la base de datos a los valores base de producción.
            </p>
          </div>

          <button
            onClick={handleResetToFactorySeed}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            Reiniciar a Valores de Fábrica
          </button>
        </div>
      </div>
    </div>
  );
};
