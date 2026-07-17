'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number; // 自动关闭时间（毫秒），0 表示不自动关闭
}

export default function AlertDialog({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 5000,
}: AlertDialogProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-800 dark:text-green-200',
      message: 'text-green-700 dark:text-green-300',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-800 dark:text-red-200',
      message: 'text-red-700 dark:text-red-300',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-800 dark:text-yellow-200',
      message: 'text-yellow-700 dark:text-yellow-300',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-800 dark:text-blue-200',
      message: 'text-blue-700 dark:text-blue-300',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const Icon = icons[type];
  const colorScheme = colors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div
        className={`relative w-full max-w-md ${colorScheme.bg} ${colorScheme.border} border-2 rounded-xl shadow-2xl p-6 animate-scale-in`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:opacity-70 transition-opacity text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 图标和内容 */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${colorScheme.icon}`}>
            <Icon className="w-8 h-8" />
          </div>
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={`text-lg font-semibold mb-2 ${colorScheme.title}`}>
                {title}
              </h3>
            )}
            <div className={`text-sm leading-relaxed ${colorScheme.message} break-words whitespace-pre-line`}>
              {message}
            </div>
          </div>
        </div>

        {/* 确认按钮 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${colorScheme.button}`}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

