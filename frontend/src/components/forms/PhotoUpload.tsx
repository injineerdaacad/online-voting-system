import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface PhotoUploadProps {
  label?: string;
  error?: string;
  helpText?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  className?: string;
  maxSize?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  label,
  error,
  helpText,
  value: _value,
  onChange,
  className,
  maxSize = 5,
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }
      
      onChange?.(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    setPreview(null);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="space-y-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={clsx(
              'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
              error
                ? 'border-red-500 hover:border-red-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-university-gold-500',
              'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600',
              className
            )}
          >
            <div className="flex flex-col items-center space-y-2">
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click to upload photo
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF up to {maxSize}MB
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
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

export default PhotoUpload;