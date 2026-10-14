import { create } from 'zustand';
import type { Product, SaleItem } from '../types/domain';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  paymentMethod: 'EFECTIVO' | 'QR' | 'TARJETA';
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setPaymentMethod: (method: 'EFECTIVO' | 'QR' | 'TARJETA') => void;
  getTotal: () => number;
  getItemCount: () => number;
  toSaleItems: () => SaleItem[];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  paymentMethod: 'EFECTIVO',

  addItem: (product: Product, quantity = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex(i => i.product.id === product.id);

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
        subtotal: quantity * product.precio
      };

      set({ items: [...items, newItem] });
      return { success: true };
    }
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return { success: true };
    }

    const item = items.find(i => i.product.id === productId);
    if (!item) return { success: false, message: 'Producto no encontrado en carrito' };

    if (quantity > item.product.stock) {
      return {
        success: false,
        message: `Stock máximo de "${item.product.nombre}" es ${item.product.stock}`
      };
    }

    set({
      items: items.map(i =>
        i.product.id === productId
          ? { ...i, quantity, subtotal: quantity * i.product.precio }
          : i
      )
    });
    return { success: true };
  },

  removeItem: (productId: string) => {
    set({ items: get().items.filter(i => i.product.id !== productId) });
  },

  clearCart: () => {
    set({ items: [], paymentMethod: 'EFECTIVO' });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
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
      subtotal: i.subtotal
    }));
  }
}));
