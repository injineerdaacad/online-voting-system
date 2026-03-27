import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ type, title, message, onClose, className = '' }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100',
          message: 'text-green-800 dark:text-green-200',
          closeBtn: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
          IconComponent: CheckCircle,
        };
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          message: 'text-red-800 dark:text-red-200',
          closeBtn: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
          IconComponent: AlertCircle,
        };
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100',
          message: 'text-yellow-800 dark:text-yellow-200',
          closeBtn: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
          IconComponent: AlertTriangle,
        };
      case 'info':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          message: 'text-blue-800 dark:text-blue-200',
          closeBtn: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
          IconComponent: Info,
        };
    }
  };

  const styles = getAlertStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div
      className={`
        ${styles.container}
        border rounded-xl p-4 mb-6
        shadow-sm
        backdrop-blur-sm
        animate-in fade-in slide-in-from-top-2 duration-300
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`${styles.title} text-sm font-semibold mb-1`}>
              {title}
            </h4>
          )}
          <p className={`${styles.message} text-sm leading-relaxed`}>
            {message}
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`
              ${styles.closeBtn}
              flex-shrink-0
              p-1 rounded-lg
              transition-all duration-200
              hover:bg-white/50 dark:hover:bg-black/20
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
            `}
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;