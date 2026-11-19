import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ModalState {
  confirmState: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: 'danger' | 'warning' | 'info';
    resolve?: (val: boolean) => void;
  };
  alertState: {
    isOpen: boolean;
    title: string;
    message: string;
    buttonText: string;
    type: 'error' | 'warning' | 'info' | 'success';
    resolve?: () => void;
  };
  toasts: ToastMessage[];

  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showAlert: (options: AlertOptions) => Promise<void>;
  closeConfirm: (result: boolean) => void;
  closeAlert: () => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  confirmState: {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'warning',
    resolve: undefined
  },
  alertState: {
    isOpen: false,
    title: '',
    message: '',
    buttonText: 'Entendido',
    type: 'info',
    resolve: undefined
  },
  toasts: [],

  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmState: {
          isOpen: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          variant: options.variant || 'warning',
          resolve
        }
      });
    });
  },

  closeConfirm: (result: boolean) => {
    const { resolve } = get().confirmState;
    if (resolve) resolve(result);
    set((state) => ({
      confirmState: {
        ...state.confirmState,
        isOpen: false,
        resolve: undefined
      }
    }));
  },

  showAlert: (options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      set({
        alertState: {
          isOpen: true,
          title: options.title,
          message: options.message,
          buttonText: options.buttonText || 'Entendido',
          type: options.type || 'info',
          resolve
        }
      });
    });
  },

  closeAlert: () => {
    const { resolve } = get().alertState;
    if (resolve) resolve();
    set((state) => ({
      alertState: {
        ...state.alertState,
        isOpen: false,
        resolve: undefined
      }
    }));
  },

  showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  }
}));
