import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
  className?: string;
  helpText?: string;
}

export interface FormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  submitText?: string;
  loading?: boolean;
  className?: string;
  gridCols?: 1 | 2 | 3 | 4;
  showSubmitButton?: boolean;
  resetOnSubmit?: boolean;
}

const Form: React.FC<FormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  submitText = 'Submit',
  loading = false,
  className,
  gridCols = 1,
  showSubmitButton = true,
  resetOnSubmit = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: FormField, value: any): string | null => {
    const { validation } = field;
    if (!validation) return null;

    if (validation.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    if (value && validation.minLength && value.toString().length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }

    if (value && validation.maxLength && value.toString().length > validation.maxLength) {
      return `${field.label} must be no more than ${validation.maxLength} characters`;
    }

    if (value && validation.pattern && !validation.pattern.test(value.toString())) {
      return `${field.label} format is invalid`;
    }

    if (value && validation.custom) {
      return validation.custom(value);
    }

    return null;
  }, []);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((field: FormField) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));
    
    const error = validateField(field, values[field.name]);
    setErrors(prev => ({ ...prev, [field.name]: error || '' }));
  }, [values, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach(field => {
      const error = validateField(field, values[field.name]);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));

    if (hasErrors) return;

    try {
      await onSubmit(values);
      if (resetOnSubmit) {
        setValues(initialValues);
        setErrors({});
        setTouched({});
      }
    } catch (error) {
    }
  }, [fields, values, validateField, onSubmit, initialValues, resetOnSubmit]);

  const renderField = useCallback((field: FormField) => {
    const hasError = touched[field.name] && errors[field.name];
    const fieldId = `field-${field.name}`;

    const baseInputClasses = clsx(
      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      hasError
        ? 'border-university-red-500 focus:ring-university-red-500'
        : 'border-gray-300 dark:border-gray-600 focus:ring-university-gold-500',
      field.disabled && 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed',
      field.className
    );

    const renderInput = () => {
      switch (field.type) {
        case 'textarea':
          return (
            <textarea
              id={fieldId}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={field.disabled}
              className={baseInputClasses}
              rows={4}
            />
          );

        case 'select':
          return (
            <select
              id={fieldId}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field)}
              required={field.required}
              disabled={field.disabled}
              className={baseInputClasses}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <div className="flex items-center">
              <input
                id={fieldId}
                type="checkbox"
                checked={values[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                onBlur={() => handleBlur(field)}
                disabled={field.disabled}
                className="h-4 w-4 text-university-gold-500 focus:ring-university-gold-500 border-gray-300 rounded"
              />
              <label htmlFor={fieldId} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {field.label}
              </label>
            </div>
          );

        case 'file':
          return (
            <input
              id={fieldId}
              type="file"
              onChange={(e) => handleChange(field.name, e.target.files?.[0] || null)}
              onBlur={() => handleBlur(field)}
              required={field.required}
              disabled={field.disabled}
              className={baseInputClasses}
              accept="image/*"
            />
          );

        default:
          return (
            <input
              id={fieldId}
              type={field.type}
              value={values[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={field.placeholder}
              required={field.required}
              disabled={field.disabled}
              className={baseInputClasses}
            />
          );
      }
    };

    return (
      <div key={field.name} className="space-y-1">
        {field.type !== 'checkbox' && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && <span className="text-university-red-500 ml-1">*</span>}
          </label>
        )}
        {renderInput()}
        {hasError && (
          <p className="text-sm text-university-red-500">{errors[field.name]}</p>
        )}
        {field.helpText && !hasError && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
        )}
      </div>
    );
  }, [values, errors, touched, handleChange, handleBlur]);

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('space-y-6', className)}>
      <div className={clsx('grid gap-6', gridClasses[gridCols])}>
        {fields.map(renderField)}
      </div>
      
      {showSubmitButton && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-university-gold-500 text-white font-medium rounded-lg hover:bg-university-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-university-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {submitText}
          </button>
        </div>
      )}
    </form>
  );
};

export default Form;