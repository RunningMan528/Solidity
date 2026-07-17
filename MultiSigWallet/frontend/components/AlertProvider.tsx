'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AlertDialog from './AlertDialog';
import { parseError } from '@/lib/errorHandler';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

interface AlertContextType {
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (error: any, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    message: '',
  });

  const showAlert = useCallback((
    type: AlertType,
    message: string,
    title?: string,
    duration?: number
  ) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      duration,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert('success', message, title || '成功', duration);
    },
    [showAlert]
  );

  const showError = useCallback(
    (error: any, title?: string, duration?: number) => {
      // 如果 error 是字符串，直接使用
      if (typeof error === 'string') {
        showAlert('error', error, title || '错误', duration);
        return;
      }
      
      // 否则使用错误处理函数解析错误
      const { title: errorTitle, message: errorMessage } = parseError(error);
      showAlert('error', errorMessage, title || errorTitle, duration);
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert('warning', message, title || '警告', duration);
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      showAlert('info', message, title || '提示', duration);
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
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

