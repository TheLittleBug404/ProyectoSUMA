export interface Product {
  id: string;
  name: string;
  model: string; // e.g., "Oversize Fit", "Slim Fit", "Classic", "Cargo"
  description: string;
  priceRetail: number; // Precio por menor
  priceWholesale: number; // Precio por mayor
  minWholesaleQty: number; // Mínimo de prendas para aplicar precio por mayor (ej: 6)
  colors: { name: string; hex: string; imageUrl?: string }[]; // Colores con nombre, valor hex y foto opcional
  sizes: string[]; // Tallas, ej: ["S", "M", "L", "XL"]
  imageUrl: string;
  category: string; // ej: "Polos", "Pantalones", "Casacas", "Accesorios"
  inStock: boolean;
  stockQty?: number; // Cantidad total en stock
}

export interface CartItem {
  id: string; // Unique id for cart item (product.id + color + size)
  product: Product;
  selectedColor: { name: string; hex: string; imageUrl?: string };
  selectedSize: string;
  quantity: number;
}

export interface User {
  username: string;
  role: 'admin' | 'customer' | 'employee';
  name?: string;
  workerId?: string;
  branch?: string;
}

export interface Worker {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  branch: string; // Assigned store branch name
  salesThisMonth: number;
  transactions: number;
  status: 'Activo' | 'Inactivo';
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  color: string;
}
