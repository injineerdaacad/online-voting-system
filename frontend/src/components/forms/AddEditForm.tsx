import React, { ReactNode } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  icon?: ReactNode;
  className?: string;
  rows?: number;
  accept?: string;
}

interface AddEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  title: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  submitLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const AddEditForm: React.FC<AddEditFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData = {},
  submitLabel = 'Save',
  loading = false,
  size = 'lg',
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const prevIsOpenRef = React.useRef<boolean>(isOpen);

  React.useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setFormData(initialData || {});
      setErrors({});
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key])) {
          newErrors[field.key] = 'Please enter a valid email address';
        }
      }
    });
    
    if (formData.password && formData.confirm_password) {
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    await onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    const hasError = !!errors[field.key];
    const fieldValue = formData[field.key] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.key}
            rows={field.rows || 4}
            placeholder={field.placeholder}
            className={`w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 ${
              hasError
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
            } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none`}
            value={fieldValue}
            onChange={(e) => handleChange(field.key, e.target.value)}
            required={field.required}
          />
        );

      case 'select':
        return (
          <div className="relative">
            {field.icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-gray-400 dark:text-gray-500">
                {field.icon}
              </div>
            )}
            <select
              id={field.key}
              className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 ${
                hasError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
              } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer ${
                field.icon ? 'pl-10 pr-10' : 'px-4'
              }`}
              value={fieldValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="relative">
            <input
              type="file"
              id={field.key}
              accept={field.accept}
              className={`w-full h-12 px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 ${
                hasError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
              } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-university-blue-50 file:text-university-blue-700 hover:file:bg-university-blue-100 dark:file:bg-university-blue-900/30 dark:file:text-university-blue-400`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                handleChange(field.key, file);
              }}
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <div className="relative">
            {field.icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 dark:text-gray-500">
                {field.icon}
              </div>
            )}
            <input
              type={field.type}
              id={field.key}
              placeholder={field.placeholder}
              className={`w-full h-12 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-2 ${
                hasError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200/60 dark:border-slate-600/60 focus:border-university-blue-500 dark:focus:border-university-blue-400'
              } focus:ring-2 focus:ring-university-blue-500/20 dark:focus:ring-university-blue-400/20 transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                field.icon ? 'pl-10 pr-4' : 'px-4'
              }`}
              value={fieldValue}
              onChange={(e) => handleChange(field.key, e.target.value)}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {fields.map((field) => (
            <div
              key={field.key}
              className={field.className || (field.type === 'textarea' ? 'md:col-span-2' : '')}
            >
              <label
                htmlFor={field.key}
                className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5"
              >
                {field.label}
                {field.required && (
                  <span className="text-red-500">*</span>
                )}
                {field.icon && (
                  <span className="text-university-blue-500 dark:text-university-blue-400">
                    {field.icon}
                  </span>
                )}
              </label>
              {renderField(field)}
              {errors[field.key] && (
                <p className="mt-1.5 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span>⚠</span>
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-gray-200/70 dark:border-slate-700/70 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 dark:from-blue-600 dark:via-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:via-blue-700 dark:hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-blue-700 dark:border-blue-600 order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditForm;