import React from 'react';
import { Upload, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FileInputProps {
  label?: string;
  error?: string;
  helpText?: string;
  accept?: string;
  multiple?: boolean;
  value?: File | File[] | null;
  onChange?: (files: File | File[] | null) => void;
  className?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  error,
  helpText,
  accept = 'image/*',
  multiple = false,
  value,
  onChange,
  className,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      onChange?.(multiple ? fileArray : fileArray[0] || null);
    }
  };

  const handleRemoveFile = () => {
    onChange?.(null);
  };

  const getFileName = () => {
    if (Array.isArray(value)) {
      return value.length > 0 ? `${value.length} files selected` : '';
    }
    return value ? value.name : '';
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="sr-only"
          id="file-input"
        />
        
        <label
          htmlFor="file-input"
          className={clsx(
            'flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            error
              ? 'border-red-500 hover:border-red-600'
              : 'border-gray-300 dark:border-gray-600 hover:border-university-gold-500',
            'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600',
            className
          )}
        >
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              {accept === 'image/*' ? 'PNG, JPG, GIF up to 10MB' : 'Any file type'}
            </p>
          </div>
        </label>
      </div>
      
      {value && (
        <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {getFileName()}
          </span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default FileInput;