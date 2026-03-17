'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      const duration = options.duration ?? 5000;
      setToasts((prev) => [...prev, { ...options, id, duration }]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string) => toast({ type: 'success', title, message }),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string) => toast({ type: 'error', title, message }),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string) => toast({ type: 'warning', title, message }),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string) => toast({ type: 'info', title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, toast, success, error, warning, info, dismiss }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const toastConfig: Record<
  ToastType,
  { icon: React.ElementType; containerClass: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle,
    containerClass: 'border-green-200 bg-green-50',
    iconClass: 'text-green-500',
  },
  error: {
    icon: XCircle,
    containerClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-yellow-200 bg-yellow-50',
    iconClass: 'text-yellow-500',
  },
  info: {
    icon: Info,
    containerClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-500',
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full',
        'animate-in slide-in-from-right-5 fade-in duration-300',
        config.containerClass
      )}
      role="alert"
    >
      <Icon size={18} className={cn('shrink-0 mt-0.5', config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-gray-600">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
