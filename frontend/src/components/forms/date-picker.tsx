import React from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helpText?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  helpText,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="date"
          className={clsx(
            'w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-university-gold-500',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
            className
          )}
          {...props}
        />
        
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default DatePicker;