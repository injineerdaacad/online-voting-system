import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}) => {
  let openModal: (() => void) | undefined;
  let closeModal: (() => void) | undefined;
  
  try {
    const modalContext = useModal();
    openModal = modalContext.openModal;
    closeModal = modalContext.closeModal;
  } catch {
  }

  useEffect(() => {
    if (isOpen && openModal) {
      openModal();
    } else if (!isOpen && closeModal) {
      closeModal();
    }
  }, [isOpen, openModal, closeModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md w-[95%]',
    md: 'max-w-lg w-[95%]',
    lg: 'max-w-3xl w-[95%] md:w-[90%]',
    xl: 'max-w-5xl w-[95%] md:w-[90%] lg:w-[85%]',
    full: 'max-w-[95vw] w-[95%]',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={handleOverlayClick}
      />

      <div
        className={clsx(
          'relative w-full transform transition-all duration-300',
          'bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl',
          'rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50',
          'flex flex-col',
          'my-auto',
          sizeClasses[size],
          'max-h-[95vh] sm:max-h-[90vh]',
          'overflow-hidden',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className
        )}
      >
        
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
            {title && (
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-amber-600 dark:from-white dark:via-blue-100 dark:to-amber-400 bg-clip-text text-transparent">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className={clsx(
          'p-4 sm:p-6',
          'flex-1',
          'overflow-y-auto',
          'min-h-0'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;