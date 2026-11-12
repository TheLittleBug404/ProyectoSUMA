import { create } from 'zustand';
import type { Product, SaleItem, Customer } from '../types/domain';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  talla?: string;
}

interface CartState {
  items: CartItem[];
  paymentMethod: 'EFECTIVO' | 'QR' | 'TARJETA';
  cliente: Customer | null;
  descuentoPorcentaje: number;

  addItem: (product: Product, quantity?: number, talla?: string) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number, talla?: string) => { success: boolean; message?: string };
  removeItem: (productId: string, talla?: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: 'EFECTIVO' | 'QR' | 'TARJETA') => void;
  setCliente: (cliente: Customer | null) => void;
  setDescuentoPorcentaje: (pct: number) => void;

  getSubtotal: () => number;
  getDescuentoMonto: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  toSaleItems: () => SaleItem[];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: 'EFECTIVO',
  cliente: null,
  descuentoPorcentaje: 0,

  addItem: (product: Product, quantity = 1, talla?: string) => {
    const { items } = get();
    const effectiveTalla = talla || product.talla || (product.tallas && product.tallas[0]) || 'ÚNICA';
    const existingIndex = items.findIndex(
      i => i.product.id === product.id && i.talla === effectiveTalla
    );

    if (existingIndex > -1) {
      const existing = items[existingIndex];
      const newQuantity = existing.quantity + quantity;

      if (newQuantity > product.stock) {
        return {
          success: false,
          message: `Stock máximo alcanzado para "${product.nombre}" (${product.stock} disponibles)`
        };
      }

      const updatedItems = [...items];
      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        subtotal: newQuantity * product.precio
      };

      set({ items: updatedItems });
      return { success: true };
    } else {
      if (quantity > product.stock) {
        return {
          success: false,
          message: `Stock insuficiente para "${product.nombre}" (${product.stock} disponibles)`
        };
      }

      const newItem: CartItem = {
        product,
        quantity,
        subtotal: quantity * product.precio,
        talla: effectiveTalla
      };

      set({ items: [...items, newItem] });
      return { success: true };
    }
  },

  updateQuantity: (productId: string, quantity: number, talla?: string) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId, talla);
      return { success: true };
    }

    const item = items.find(i => i.product.id === productId && (!talla || i.talla === talla));
    if (!item) return { success: false, message: 'Producto no encontrado en carrito' };

    if (quantity > item.product.stock) {
      return {
        success: false,
        message: `Stock máximo de "${item.product.nombre}" es ${item.product.stock}`
      };
    }

    set({
      items: items.map(i =>
        i.product.id === productId && (!talla || i.talla === talla)
          ? { ...i, quantity, subtotal: quantity * i.product.precio }
          : i
      )
    });
    return { success: true };
  },

  removeItem: (productId: string, talla?: string) => {
    set({
      items: get().items.filter(i => !(i.product.id === productId && (!talla || i.talla === talla)))
    });
  },

  clearCart: () => {
    set({ items: [], paymentMethod: 'EFECTIVO', cliente: null, descuentoPorcentaje: 0 });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setCliente: (cliente) => {
    set({
      cliente,
      descuentoPorcentaje: cliente?.descuentoFrecuente || 0
    });
  },

  setDescuentoPorcentaje: (pct) => {
    set({ descuentoPorcentaje: Math.max(0, Math.min(100, pct)) });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getDescuentoMonto: () => {
    const sub = get().getSubtotal();
    const pct = get().descuentoPorcentaje;
    return (sub * pct) / 100;
  },

  getTotal: () => {
    const sub = get().getSubtotal();
    const desc = get().getDescuentoMonto();
    return Math.max(0, sub - desc);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  toSaleItems: () => {
    return get().items.map(i => ({
      productoId: i.product.id,
      nombreProducto: i.product.nombre,
      cantidad: i.quantity,
      precioUnitario: i.product.precio,
      subtotal: i.subtotal,
      talla: i.talla,
      color: i.product.color
    }));
  }
}));
