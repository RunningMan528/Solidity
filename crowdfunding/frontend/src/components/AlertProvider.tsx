'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AlertDialog, { AlertType } from './AlertDialog';

interface AlertOptions {
  type?: AlertType;
  title?: string;
  duration?: number;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => void;
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: AlertType;
    title?: string;
    message: string;
    duration?: number;
  }>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const showAlert = useCallback((message: string, options: AlertOptions = {}) => {
    setAlert({
      isOpen: true,
      type: options.type || 'info',
      title: options.title,
      message,
      duration: options.duration,
    });
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert(message, { type: 'success', title, duration });
    },
    [showAlert]
  );

  const showError = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert(message, { type: 'error', title, duration });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert(message, { type: 'warning', title, duration });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert(message, { type: 'info', title, duration });
    },
    [showAlert]
  );

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <AlertDialog
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        duration={alert.duration}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

