import type { Product } from '../types';

export const initialProducts: Product[] = [
  {
    id: 'p1',
    name: 'Polo Heavyweight Minimalist',
    model: 'Oversize Fit',
    description: 'Polo de algodón pesado de 240g de alta calidad. Tacto suave, corte premium y costuras reforzadas.',
    priceRetail: 90.00, // Bs. 90.00 por menor
    priceWholesale: 60.00, // Bs. 60.00 por mayor
    minWholesaleQty: 6,
    colors: [
      { 
        name: 'Blanco Crudo', 
        hex: '#F9F6F0',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'
      },
      { 
        name: 'Negro Mate', 
        hex: '#1C1C1C',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=600'
      },
      { 
        name: 'Verde Oliva', 
        hex: '#4A5D4E',
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
    category: 'Polos',
    inStock: true
  },
  {
    id: 'p2',
    name: 'Casaca Denim Sherpa',
    model: 'Relaxed Fit',
    description: 'Casaca de jean clásica con forro interno abrigador de chiporro. Ideal para temporadas frías.',
    priceRetail: 320.00,
    priceWholesale: 220.00,
    minWholesaleQty: 3,
    colors: [
      { 
        name: 'Azul Claro', 
        hex: '#7CA9D3',
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600'
      },
      { 
        name: 'Gris Oscuro', 
        hex: '#3E3E3E',
        imageUrl: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?auto=format&fit=crop&q=80&w=600'
      }
    ],
    sizes: ['M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600',
    category: 'Casacas',
    inStock: true
  },
  {
    id: 'p3',
    name: 'Pantalón Cargo Tactical',
    model: 'Regular Fit',
    description: 'Pantalón cargo con bolsillos laterales y cordón ajustable. Tela ripstop de alta resistencia para uso diario.',
    priceRetail: 190.00,
    priceWholesale: 130.00,
    minWholesaleQty: 4,
    colors: [
      { 
        name: 'Verde Militar', 
        hex: '#3B443B',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600'
      },
      { 
        name: 'Negro Carbono', 
        hex: '#262626',
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=600'
      }
    ],
    sizes: ['28', '30', '32', '34'],
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600',
    category: 'Pantalones',
    inStock: true
  },
  {
    id: 'p4',
    name: 'Hoodie Urban Essential',
    model: 'Oversize Fit',
    description: 'Polera con capucha de algodón perchado grueso con bolsillo canguro. Capucha forrada y cordones con puntas metálicas.',
    priceRetail: 220.00,
    priceWholesale: 150.00,
    minWholesaleQty: 6,
    colors: [
      { 
        name: 'Plomo Melange', 
        hex: '#B2B2B2',
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600'
      },
      { 
        name: 'Negro Noche', 
        hex: '#0B0B0B',
        imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=600'
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
    category: 'Polos',
    inStock: true
  },
  {
    id: 'p5',
    name: 'Casaca Cuero Biker Premium',
    model: 'Slim Fit',
    description: 'Casaca de cuero sintético premium de alta durabilidad con detalles de cierres cromados y forro de satén.',
    priceRetail: 440.00,
    priceWholesale: 320.00,
    minWholesaleQty: 3,
    colors: [
      { 
        name: 'Negro Absoluto', 
        hex: '#050505',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600'
      }
    ],
    sizes: ['S', 'M', 'L'],
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600',
    category: 'Casacas',
    inStock: true
  },
  {
    id: 'p6',
    name: 'Camisa Lino Premium',
    model: 'Regular Fit',
    description: 'Camisa confeccionada 100% en lino europeo de alta calidad. Fresca, elegante y con un caída inigualable para días cálidos.',
    priceRetail: 210.00,
    priceWholesale: 140.00,
    minWholesaleQty: 5,
    colors: [
      { 
        name: 'Blanco Crudo', 
        hex: '#F5F5DC',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600' 
      },
      { 
        name: 'Café', 
        hex: '#8B4513',
        imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=600' 
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
    category: 'Camisas',
    inStock: true
  },
  {
    id: 'p7',
    name: 'Jogger Tech Fleece',
    model: 'Slim Fit',
    description: 'Pantalón deportivo térmico con costuras ergonómicas y bolsillos impermeables con cierre. Comodidad y estilo urbano.',
    priceRetail: 180.00,
    priceWholesale: 120.00,
    minWholesaleQty: 4,
    colors: [
      { 
        name: 'Plomo Melange', 
        hex: '#9E9E9E',
        imageUrl: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600' 
      },
      { 
        name: 'Negro Noche', 
        hex: '#111111',
        imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=600' 
      }
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=600',
    category: 'Pantalones',
    inStock: true
  }
];
