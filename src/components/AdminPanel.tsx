import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { PlusCircle, Save, Trash2, Edit2, RotateCcw, Shirt, Users, MapPin, TrendingUp, Tag, LayoutDashboard } from 'lucide-react';
import type { Product, Worker } from '../types';
import samuLogo from '../assets/samu-logo.jpg';

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  // V3 Workers CRUD integration
  workers: Worker[];
  onAddWorker: (worker: Worker) => void;
  onEditWorker: (worker: Worker) => void;
  onDeleteWorker: (id: string) => void;
}

const PRESETS_COLORS = [
  { name: 'Negro', hex: '#1C1C1C' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Plomo Melange', hex: '#B2B2B2' },
  { name: 'Azul Marino', hex: '#101D38' },
  { name: 'Beige Khaki', hex: '#C2B280' },
  { name: 'Verde Militar', hex: '#3B443B' },
  { name: 'Marrón Tierra', hex: '#5C4033' },
  { name: 'Café', hex: '#8B4513' }
];

const PRESETS_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34'];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600'
];

// Branch definitions including Coordinates for Leaflet
const BRANCHES_GEOGRAPHIC = [
  { id: 'b1', name: 'La Paz - El Prado', address: 'Av. 16 de Julio (El Prado), Edif. Alameda Nº 1420', coordinates: [-16.4990, -68.1350] as [number, number], color: '#3b82f6' },
  { id: 'b2', name: 'Santa Cruz - Equipetrol', address: 'Av. San Martín, Centro Comercial Las Brisas, Local 15', coordinates: [-17.7760, -63.1760] as [number, number], color: '#10b981' },
  { id: 'b3', name: 'Cochabamba - Plaza Colón', address: 'Av. Ballivián (El Prado), esq. Plaza Colón', coordinates: [-17.3840, -66.1550] as [number, number], color: '#f59e0b' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  workers,
  onAddWorker,
  onEditWorker,
  onDeleteWorker,
}) => {
  // Tabs: 'catalog' | 'stats'
  const [adminTab, setAdminTab] = useState<'catalog' | 'stats'>('catalog');
  
  // Stats Sub-Tabs: 'map' | 'workers'
  const [statsSubTab, setStatsSubTab] = useState<'map' | 'workers'>('map');

  // Map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Garment Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('Polos');
  const [description, setDescription] = useState('');
  const [priceRetail, setPriceRetail] = useState<string>('');
  const [priceWholesale, setPriceWholesale] = useState<string>('');
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(6);
  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string; imageUrl?: string }[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  // Worker Form State
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerPassword, setWorkerPassword] = useState('123');
  const [workerRole, setWorkerRole] = useState('');
  const [workerBranch, setWorkerBranch] = useState('La Paz - El Prado');
  const [workerSales, setWorkerSales] = useState<string>('');
  const [workerTransactions, setWorkerTransactions] = useState<string>('');
  const [workerStatus, setWorkerStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  // Auto seed default image if empty
  useEffect(() => {
    if (!imageUrl) {
      setImageUrl(PRESET_IMAGES[0]);
    }
  }, [imageUrl]);

  // Leaflet Map Initialization
  useEffect(() => {
    // Check if map container is rendered in active tab
    if (adminTab !== 'stats' || statsSubTab !== 'map' || !mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    // Clean up prior map instance if existing
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered map in Bolivia covering La Paz, Cochabamba, and Santa Cruz
    const map = L.map(mapContainerRef.current).setView([-16.8, -65.2], 5.8);
    mapInstanceRef.current = map;

    // Add standard OpenStreetMap tiles (free alternative to Google Maps)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom marker icon design (divIcon is clean, vector-like, has no asset-loading bugs)
    const customMarkerIcon = (color: string) => L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="
        background-color: ${color};
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 3px solid #fff;
        box-shadow: 0 0 12px ${color};
        transform: translate(-3px, -3px);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Populate branch markers
    BRANCHES_GEOGRAPHIC.forEach((branch) => {
      // Find live active workers for this specific branch
      const activeBranchWorkers = workers.filter(
        (w) => w.branch === branch.name && w.status === 'Activo'
      );

      const workersListHtml = activeBranchWorkers.length > 0
        ? `<ul style="margin: 6px 0 0 12px; padding: 0; list-style-type: disc; color: var(--text-primary);">
            ${activeBranchWorkers.map(w => `
              <li style="margin-bottom: 4px;">
                <strong>${w.name}</strong><br/>
                <span style="color: #64748b; font-size: 0.75rem;">${w.role}</span>
              </li>
            `).join('')}
           </ul>`
        : `<p style="margin: 6px 0 0 0; color: #64748b; font-style: italic; font-size: 0.8rem;">Sin trabajadores asignados</p>`;

      const popupContent = `
        <div style="min-width: 200px; color: var(--text-primary);">
          <h4 style="margin: 0; font-size: 0.95rem; font-weight: bold; color: ${branch.color}; display: flex; align-items: center; gap: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${branch.color};"></span>
            ${branch.name}
          </h4>
          <p style="margin: 4px 0 8px 0; font-size: 0.78rem; color: #64748b; line-height: 1.3;">
            ${branch.address}
          </p>
          <div style="border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 8px;">
            <span style="font-size: 0.8rem; font-weight: 600;">Personal Activo (${activeBranchWorkers.length}):</span>
            ${workersListHtml}
          </div>
        </div>
      `;

      L.marker(branch.coordinates, { icon: customMarkerIcon(branch.color) })
        .addTo(map)
        .bindPopup(popupContent);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [adminTab, statsSubTab, workers]);

  // Colors operations for garments
  const handleColorToggle = (color: { name: string; hex: string }) => {
    const existing = selectedColors.find(c => c.name === color.name);
    if (existing) {
      setSelectedColors(selectedColors.filter(c => c.name !== color.name));
    } else {
      setSelectedColors([...selectedColors, { ...color, imageUrl: imageUrl || PRESET_IMAGES[0] }]);
    }
  };

  const handleColorImageChange = (colorName: string, url: string) => {
    setSelectedColors(selectedColors.map(c => 
      c.name === colorName ? { ...c, imageUrl: url } : c
    ));
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter(s => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const selectRandomImage = () => {
    const randomImg = PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)];
    setImageUrl(randomImg);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setModel('');
    setCategory('Polos');
    setDescription('');
    setPriceRetail('');
    setPriceWholesale('');
    setMinWholesaleQty(6);
    setSelectedColors([]);
    setSelectedSizes([]);
    setImageUrl(PRESET_IMAGES[0]);
  };

  const loadProductForEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setModel(p.model);
    setCategory(p.category);
    setDescription(p.description);
    setPriceRetail(p.priceRetail.toString());
    setPriceWholesale(p.priceWholesale.toString());
    setMinWholesaleQty(p.minWholesaleQty);
    setSelectedColors(p.colors);
    setSelectedSizes(p.sizes);
    setImageUrl(p.imageUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedColors.length === 0) {
      alert('Por favor seleccione al menos un color.');
      return;
    }
    if (selectedSizes.length === 0) {
      alert('Por favor seleccione al menos una talla.');
      return;
    }

    const pr = parseFloat(priceRetail);
    const pw = parseFloat(priceWholesale);

    if (isNaN(pr) || pr <= 0) {
      alert('Ingrese un precio por menor válido.');
      return;
    }
    if (isNaN(pw) || pw <= 0) {
      alert('Ingrese un precio por mayor válido.');
      return;
    }

    const productData: Product = {
      id: editingId || 'p_' + Date.now(),
      name,
      model,
      category,
      description,
      priceRetail: pr,
      priceWholesale: pw,
      minWholesaleQty,
      colors: selectedColors,
      sizes: selectedSizes,
      imageUrl,
      inStock: true
    };

    if (editingId) {
      onEditProduct(productData);
    } else {
      onAddProduct(productData);
    }

    resetForm();
  };

  // Workers CRUD operations
  const resetWorkerForm = () => {
    setEditingWorkerId(null);
    setWorkerName('');
    setWorkerUsername('');
    setWorkerPassword('123');
    setWorkerRole('');
    setWorkerBranch('La Paz - El Prado');
    setWorkerSales('');
    setWorkerTransactions('');
    setWorkerStatus('Activo');
  };

  const loadWorkerForEdit = (w: Worker) => {
    setEditingWorkerId(w.id);
    setWorkerName(w.name);
    setWorkerUsername(w.username || '');
    setWorkerPassword(w.password || '123');
    setWorkerRole(w.role);
    setWorkerBranch(w.branch);
    setWorkerSales(w.salesThisMonth.toString());
    setWorkerTransactions(w.transactions.toString());
    setWorkerStatus(w.status);
  };

  const handleWorkerSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workerName.trim()) {
      alert('Ingrese el nombre del trabajador.');
      return;
    }
    if (!workerRole.trim()) {
      alert('Ingrese el cargo o rol del trabajador.');
      return;
    }

    const sales = parseFloat(workerSales) || 0;
    const trans = parseInt(workerTransactions) || 0;
    const finalUsername = workerUsername.trim().toLowerCase() || workerName.trim().toLowerCase().split(' ')[0];

    const workerData: Worker = {
      id: editingWorkerId || 'w_' + Date.now(),
      name: workerName.trim(),
      username: finalUsername,
      password: workerPassword || '123',
      role: workerRole.trim(),
      branch: workerBranch,
      salesThisMonth: sales,
      transactions: trans,
      status: workerStatus
    };

    if (editingWorkerId) {
      onEditWorker(workerData);
    } else {
      onAddWorker(workerData);
    }

    resetWorkerForm();
  };

  // Stats KPI summaries
  const totalSalesVolume = workers.reduce((sum, w) => sum + w.salesThisMonth, 0);
  const totalTransactions = workers.reduce((sum, w) => sum + w.transactions, 0);

  return (
    <div style={{ padding: '0 5%', marginBottom: '60px' }} className="animate-fade-in">
      {/* Upper Navigation Row */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '20px',
        marginBottom: '32px' 
      }}>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            padding: '2px',
            background: 'var(--accent-gradient)',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            <img src={samuLogo} alt="SAMU Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>
              SAMU <span className="text-gradient">ADMIN</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '3px' }}>
              Gestión de inventario de confecciones Samara Muriel, sucursales y trabajadores.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.15)',
          padding: '4px',
          borderRadius: '12px',
          marginTop: '15px'
        }}>
          <button
            onClick={() => setAdminTab('catalog')}
            className="btn btn-toggle"
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '10px',
              background: adminTab === 'catalog' ? 'var(--accent-gradient)' : 'transparent',
              color: adminTab === 'catalog' ? '#0b0b0c' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Shirt size={14} style={{ marginRight: '6px' }} />
            Inventario de Ropa
          </button>
          <button
            onClick={() => setAdminTab('stats')}
            className="btn btn-toggle"
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '10px',
              background: adminTab === 'stats' ? 'var(--accent-gradient)' : 'transparent',
              color: adminTab === 'stats' ? '#0b0b0c' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <LayoutDashboard size={14} style={{ marginRight: '6px' }} />
            Estadísticas y Sucursales
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY MANAGEMENT */}
      {adminTab === 'catalog' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }} className="animate-fade-in">
          {/* Form */}
          <div className="glass-card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="var(--accent-primary)" />
                {editingId ? 'Editar Prenda' : 'Añadir Nueva Prenda'}
              </h3>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre de Prenda</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Camisa Lino Tropical"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Modelo / Fit</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Slim Fit"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', height: '47px' }}
                  >
                    <option value="Polos">Polos / Remeras</option>
                    <option value="Casacas">Casacas / Camperas</option>
                    <option value="Pantalones">Pantalones</option>
                    <option value="Camisas">Camisas</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control"
                  placeholder="Detalla las características de la prenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ height: '75px', resize: 'none' }}
                  required
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px'
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--accent-secondary)' }}>Precio por Menor (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ej: 150.00"
                    value={priceRetail}
                    onChange={(e) => setPriceRetail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--accent-primary)' }}>Precio por Mayor (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="Ej: 100.00"
                    value={priceWholesale}
                    onChange={(e) => setPriceWholesale(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0, marginTop: '10px' }}>
                  <label className="form-label">Mínimo para Compra al por Mayor (Prendas)</label>
                  <input
                    type="number"
                    min="2"
                    className="form-control"
                    value={minWholesaleQty}
                    onChange={(e) => setMinWholesaleQty(parseInt(e.target.value) || 6)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Colores y Fotos por Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {PRESETS_COLORS.map((color) => {
                    const isChecked = selectedColors.some(c => c.name === color.name);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleColorToggle(color)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isChecked ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: color.hex,
                          display: 'inline-block',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }} />
                        {color.name}
                      </button>
                    );
                  })}
                </div>

                {selectedColors.length > 0 && (
                  <div style={{
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    padding: '14px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Enlace de foto por color:
                    </span>
                    {selectedColors.map((color) => (
                      <div key={color.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', minWidth: '85px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color.hex }} />
                          {color.name}:
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enlace de la foto"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          value={color.imageUrl || ''}
                          onChange={(e) => handleColorImageChange(color.name, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Tallas</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESETS_SIZES.map((size) => {
                    const isChecked = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        style={{
                          minWidth: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          border: isChecked ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: isChecked ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                          color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Imagen Principal de Portada</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pegue la URL de la foto"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={selectRandomImage}
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Variar Foto
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '48px', justifyContent: 'center' }}
              >
                <Save size={18} />
                {editingId ? 'Actualizar Prenda' : 'Guardar Prenda'}
              </button>
            </form>
          </div>

          {/* List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Shirt size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Inventario de Prendas ({products.length})</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {products.map((p) => (
                <div 
                  key={p.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={p.imageUrl} 
                    alt={p.name} 
                    style={{
                      width: '70px',
                      height: '85px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />

                  <div style={{ flexGrow: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{p.name}</h4>
                      <span className="badge badge-retail" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                        {p.model}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                      Categoría: {p.category}
                    </p>

                    <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.85rem' }}>
                        Menor: <strong style={{ color: 'var(--text-primary)' }}>Bs. {p.priceRetail.toFixed(2)}</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        Mayor: <strong style={{ color: 'var(--accent-secondary)' }}>Bs. {p.priceWholesale.toFixed(2)}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({p.minWholesaleQty}u)</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={() => loadProductForEdit(p)}
                      className="btn btn-secondary"
                      style={{ padding: '8px', borderRadius: '8px' }}
                      title="Editar prenda"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la prenda "${p.name}"?`)) {
                          onDeleteProduct(p.id);
                          if (editingId === p.id) resetForm();
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '8px', borderRadius: '8px' }}
                      title="Eliminar prenda"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: METRICS & LEAFLET MAPS / CRUD EMPLEADOS */}
      {adminTab === 'stats' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* KPI Dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            <div className="glass-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', padding: '16px', borderRadius: '12px' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ventas del Mes</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2px 0 0 0' }}>Bs. {totalSalesVolume.toFixed(2)}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '16px', borderRadius: '12px' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Empleados</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2px 0 0 0' }}>{workers.length} Activos</h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '16px', borderRadius: '12px' }}>
                <MapPin size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sucursales</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2px 0 0 0' }}>{BRANCHES_GEOGRAPHIC.length} Tiendas</h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '16px', borderRadius: '12px' }}>
                <Tag size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Transacciones</span>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '2px 0 0 0' }}>{totalTransactions} u.</h3>
              </div>
            </div>
          </div>

          {/* Sub Tab triggers for stats subpanels */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '10px',
            gap: '15px'
          }}>
            <button
              type="button"
              onClick={() => setStatsSubTab('map')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 14px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: statsSubTab === 'map' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: statsSubTab === 'map' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              Mapa de Sucursales (Leaflet)
            </button>
            <button
              type="button"
              onClick={() => setStatsSubTab('workers')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '10px 14px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: statsSubTab === 'workers' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: statsSubTab === 'workers' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              Gestión de Personal
            </button>
          </div>

          {/* SUBTAB 2A: MAP OF BRANCHES (LEAFLET ENG) */}
          {statsSubTab === 'map' && (
            <div className="animate-fade-in" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '30px',
              alignItems: 'start'
            }}>
              {/* Map block container */}
              <div className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--accent-primary)" />
                  Geolocalización en Bolivia (OpenStreetMap)
                </h3>
                
                {/* Leaflet div mount reference */}
                <div 
                  ref={mapContainerRef} 
                  style={{
                    height: '400px',
                    width: '100%',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>

              {/* Stores list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textAlign: 'left' }}>Detalles de Sucursales</h3>
                {BRANCHES_GEOGRAPHIC.map((b) => {
                  const assignedCount = workers.filter(w => w.branch === b.name && w.status === 'Activo').length;
                  return (
                    <div 
                      key={b.id} 
                      className="glass-card" 
                      style={{
                        padding: '18px',
                        textAlign: 'left',
                        borderLeft: `5px solid ${b.color}`,
                        borderRadius: '12px'
                      }}
                    >
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{b.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                        {b.address}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span>Personal activo asignado: <strong>{assignedCount}</strong></span>
                        <span style={{ 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          color: '#10b981', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          Abierta
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBTAB 2B: WORKERS CRUD MANAGER */}
          {statsSubTab === 'workers' && (
            <div className="animate-fade-in" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '40px',
              alignItems: 'start'
            }}>
              {/* Workers Creator / Editor Form */}
              <div className="glass-card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={20} color="var(--accent-primary)" />
                    {editingWorkerId ? 'Editar Trabajador' : 'Agregar Trabajador'}
                  </h3>
                  {editingWorkerId && (
                    <button 
                      type="button" 
                      onClick={resetWorkerForm}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcw size={12} /> Cancelar
                    </button>
                  )}
                </div>

                <form onSubmit={handleWorkerSave}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Roberto Gómez Miranda"
                      value={workerName}
                      onChange={(e) => setWorkerName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ color: 'var(--text-gold)' }}>Usuario de Acceso (Login)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: roberto"
                        value={workerUsername}
                        onChange={(e) => setWorkerUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contraseña</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: 123"
                        value={workerPassword}
                        onChange={(e) => setWorkerPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Cargo / Rol</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: Vendedor de Piso"
                        value={workerRole}
                        onChange={(e) => setWorkerRole(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sucursal Destinada</label>
                      <select
                        className="form-control"
                        value={workerBranch}
                        onChange={(e) => setWorkerBranch(e.target.value)}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', height: '47px' }}
                      >
                        {BRANCHES_GEOGRAPHIC.map((b) => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Ventas del Mes (Bs.)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Ej: 5400.00"
                        value={workerSales}
                        onChange={(e) => setWorkerSales(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Transacciones (u.)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej: 24"
                        value={workerTransactions}
                        onChange={(e) => setWorkerTransactions(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '28px' }}>
                    <label className="form-label">Estado de Contratación</label>
                    <select
                      className="form-control"
                      value={workerStatus}
                      onChange={(e) => setWorkerStatus(e.target.value as 'Activo' | 'Inactivo')}
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', height: '47px' }}
                    >
                      <option value="Activo">Activo / En Tienda</option>
                      <option value="Inactivo">Inactivo / Licencia</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', height: '48px', justifyContent: 'center' }}
                  >
                    <Save size={18} />
                    {editingWorkerId ? 'Actualizar Ficha' : 'Registrar Trabajador'}
                  </button>
                </form>
              </div>

              {/* Workers table list */}
              <div className="glass-card" style={{ padding: '30px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-primary)" />
                  Listado General de Personal ({workers.length})
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 4px' }}>Nombre</th>
                        <th style={{ padding: '10px 4px' }}>Sucursal</th>
                        <th style={{ padding: '10px 4px', textAlign: 'right' }}>Ventas</th>
                        <th style={{ padding: '10px 4px', textAlign: 'center' }}>Estado</th>
                        <th style={{ padding: '10px 4px', textAlign: 'center' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.map((w) => (
                        <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 4px' }}>
                            <div style={{ fontWeight: 600 }}>{w.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {w.role} &bull; <span style={{ color: 'var(--text-gold)' }}>@{w.username || w.name.toLowerCase().split(' ')[0]}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 4px' }}>
                            <span style={{ fontSize: '0.72rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '4px' }}>
                              {w.branch.split(' - ')[0]}
                            </span>
                          </td>
                          <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            Bs. {w.salesThisMonth.toFixed(0)}
                          </td>
                          <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                            <span style={{
                              color: w.status === 'Activo' ? '#10b981' : 'var(--text-muted)',
                              fontWeight: 600,
                              fontSize: '0.78rem'
                            }}>
                              {w.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 4px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => loadWorkerForEdit(w)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                title="Editar trabajador"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Quitar al empleado "${w.name}" de la nómina?`)) {
                                    onDeleteWorker(w.id);
                                    if (editingWorkerId === w.id) resetWorkerForm();
                                  }
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                title="Dar de baja"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};
