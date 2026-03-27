import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200',
    error: 'bg-university-red-100 text-university-red-800 dark:bg-university-red-900 dark:text-university-red-200',
    info: 'bg-university-blue-100 text-university-blue-800 dark:bg-university-blue-900 dark:text-university-blue-200',
    primary: 'bg-university-gold-100 text-university-gold-800 dark:bg-university-gold-900 dark:text-university-gold-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const classes = clsx(baseClasses, variantClasses[variant], sizeClasses[size], className);

  return <span className={classes}>{children}</span>;
};

export default Badge;