'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    const success = useCallback((message: string) => toast(message, 'success'), [toast]);
    const error = useCallback((message: string) => toast(message, 'error'), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
              pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] transform transition-all duration-300 ease-in-out
              ${t.type === 'success' ? 'bg-green-600' : ''}
              ${t.type === 'error' ? 'bg-red-600' : ''}
              ${t.type === 'warning' ? 'bg-yellow-600' : ''}
              ${t.type === 'info' ? 'bg-blue-600' : ''}
            `}
                    >
                        {t.type === 'success' && <CheckCircle size={20} />}
                        {t.type === 'error' && <AlertCircle size={20} />}
                        {(t.type === 'info' || t.type === 'warning') && <Info size={20} />}
                        <p className="flex-1 text-sm font-medium">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-white/80 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
