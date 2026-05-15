import * as React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastCtx = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <Toaster>');
  return ctx;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastMessage[]>([]);

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, variant: 'default', duration: 4000, ...msg }]);
  }, []);

  const api = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error', duration: 6000 }),
      warning: (title, description) => toast({ title, description, variant: 'warning' }),
    }),
    [toast],
  );

  return (
    <ToastCtx.Provider value={api}>
      <ToastProvider swipeDirection="right">
        {children}
        {items.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) remove(t.id);
            }}
          >
            <div className="flex-1 pr-6">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description ? <ToastDescription>{t.description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastCtx.Provider>
  );
}
