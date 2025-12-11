import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  // Toast variant styles
  const toastVariants = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  // Auto remove toast after duration
  useEffect(() => {
    const timers = toasts.map(toast => {
      if (toast.duration > 0) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
      return null;
    });

    // Cleanup timers
    return () => {
      timers.forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center justify-between
            p-4 rounded-md shadow-lg
            transform transition-all duration-300
            ${toastVariants[toast.type] || toastVariants.info}
          `}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;