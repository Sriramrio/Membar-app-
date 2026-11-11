import { stableClientId } from '@/utils/stableId';
export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title?: string;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

class ToastManager {
  private toasts: ToastItem[] = [];
  private listeners: Set<ToastListener> = new Set();

  subscribe(listener: ToastListener) {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(message: string, tone: ToastTone = 'info', title?: string, duration: number = 4000): string {
    const id = stableClientId('toast');
    const item: ToastItem = { id, tone, title, message, duration };
    this.toasts = [item, ...this.toasts].slice(0, 5); // Keep max 5 toasts
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  success(message: string, title: string = 'Success') {
    return this.show(message, 'success', title);
  }

  error(message: string, title: string = 'Action Failed') {
    return this.show(message, 'error', title);
  }

  warning(message: string, title: string = 'Notice') {
    return this.show(message, 'warning', title);
  }

  info(message: string, title: string = 'Information') {
    return this.show(message, 'info', title);
  }
}

export const toast = new ToastManager();
