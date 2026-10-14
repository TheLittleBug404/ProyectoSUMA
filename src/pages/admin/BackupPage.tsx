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
  Receipt
} from 'lucide-react';
import { db } from '../../db/dexie';
import { downloadBackupFile, importDatabaseBackup } from '../../db/backup';
import { seedInitialDataIfNeeded } from '../../db/seed';

export const BackupPage: React.FC = () => {
  const [stats, setStats] = useState({
    sucursales: 0,
    usuarios: 0,
    categorias: 0,
    productos: 0,
    ventas: 0
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDatabaseCounts = async () => {
    try {
      const [sucursales, usuarios, categorias, productos, ventas] = await Promise.all([
        db.sucursales.count(),
        db.usuarios.count(),
        db.categorias.count(),
        db.productos.count(),
        db.ventas.count()
      ]);
      setStats({ sucursales, usuarios, categorias, productos, ventas });
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
        await db.transaction('rw', [db.sucursales, db.usuarios, db.categorias, db.productos, db.ventas], async () => {
          await db.sucursales.clear();
          await db.usuarios.clear();
          await db.categorias.clear();
          await db.productos.clear();
          await db.ventas.clear();
        });

        await seedInitialDataIfNeeded();
        await loadDatabaseCounts();
        setStatusMessage({ text: 'Base de datos reinicializada con datos semilla de fábrica.' });
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'Error al reiniciar base de datos', isError: true });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#121216] border border-[#d4af37]/25 p-5 rounded-2xl shadow-lg">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-white tracking-wide">
              Respaldo & Contingencia de Datos
            </h1>
            <p className="text-xs text-zinc-400">
              Exportación e importación completa de IndexedDB local en formato JSON
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in ${
            statusMessage.isError
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}>
            {statusMessage.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-3">
              <Shirt className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-lg font-black text-white font-mono">{stats.productos}</p>
                <p className="text-[10px] text-zinc-400 uppercase">Prendas</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-3">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-lg font-black text-white font-mono">{stats.ventas}</p>
                <p className="text-[10px] text-zinc-400 uppercase">Ventas / Tickets</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-3">
              <Tags className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-lg font-black text-white font-mono">{stats.categorias}</p>
                <p className="text-[10px] text-zinc-400 uppercase">Categorías</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#181820] border border-zinc-800 flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-lg font-black text-white font-mono">{stats.usuarios}</p>
                <p className="text-[10px] text-zinc-400 uppercase">Usuarios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Export and Import Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Export */}
          <div className="bg-[#121216] border border-[#d4af37]/30 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Exportar Respaldo
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Descarga un archivo <span className="text-amber-300 font-mono">.json</span> con todo el inventario, ventas, usuarios y fotos de prendas serializadas. Guárdalo en una memoria USB o disco externo.
              </p>
            </div>

            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-[0_0_15px_rgba(212,175,55,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo de Respaldo (.json)</span>
            </button>
          </div>

          {/* Card Import */}
          <div className="bg-[#121216] border border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Restaurar Respaldo
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Restaura el sistema seleccionando un archivo <span className="text-blue-300 font-mono">.json</span> previamente generado. Reconstruye el catálogo y todas las ventas.
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
              Restaura la base de datos a los 5 productos y usuarios de fábrica.
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
