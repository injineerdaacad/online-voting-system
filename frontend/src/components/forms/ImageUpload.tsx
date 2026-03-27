import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { Upload, X, ZoomIn, ZoomOut, RotateCw, Check, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import getCroppedImg from './getCroppedImg';

interface ImageUploadProps {
  label?: string;
  error?: string;
  helpText?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  className?: string;
  maxSize?: number;
  aspectRatio?: number;
  cropShape?: 'rect' | 'round';
  showGrid?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  error,
  helpText,
  value: _value,
  onChange,
  className,
  maxSize = 5,
  aspectRatio = 1,
  cropShape = 'rect',
  showGrid = true,
  minZoom = 1,
  maxZoom = 3,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
        setZoom(1);
        setRotation(0);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  }, [maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    disabled: isCropping,
  });

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const previewUrl = URL.createObjectURL(croppedFile);
      setPreview(previewUrl);
      
      onChange?.(croppedFile);
      setIsCropping(false);
      setImageSrc(null);
    } catch (error) {
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
    setZoom(1);
    setRotation(0);
    setCrop({ x: 0, y: 0 });
  };

  const handleRemove = () => {
    onChange?.(null);
    setPreview(null);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, minZoom));
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crop Image
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Adjust the crop area, zoom, and rotation to your liking
              </p>
            </div>

            <div className="relative h-96 bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                cropShape={cropShape}
                showGrid={showGrid}
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={minZoom}
                      max={maxZoom}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Rotate 90°"
                  >
                    <RotateCw className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCropCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Apply Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCropping && (
        <div className="space-y-4">
          {preview ? (
            <div className="relative group">
              <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <img
                  src={preview}
                  alt="Preview"
                  className={clsx(
                    'w-full h-64 object-contain transition-transform duration-300 group-hover:scale-105',
                    cropShape === 'round' && 'rounded-full'
                  )}
                />
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                Click the remove button to upload a different image
              </p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={clsx(
                'relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300',
                isDragActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 scale-[1.02]'
                  : error
                  ? 'border-red-500 hover:border-red-600 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50',
                'hover:shadow-lg'
              )}
            >
              <input {...getInputProps()} />

              <div className={clsx(
                'mb-4 p-4 rounded-full transition-all duration-300',
                isDragActive
                  ? 'bg-brand-100 dark:bg-brand-800/30 scale-110'
                  : 'bg-gray-100 dark:bg-gray-700'
              )}>
                {isDragActive ? (
                  <Upload className="h-10 w-10 text-brand-500 animate-bounce" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                )}
              </div>

              <div className="text-center px-4">
                <p className="text-base font-medium text-gray-700 dark:text-gray-200 mb-1">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop your image here'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  or click to browse
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  PNG, JPG, GIF, WEBP up to {maxSize}MB
                </p>
              </div>

              {isDragActive && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 border-2 border-brand-500 rounded-xl animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && !isCropping && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {helpText && !error && !isCropping && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-700 dark:text-blue-400">{helpText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;