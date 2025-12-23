import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true
}) => {
  // Don't render if modal is not open
  if (!isOpen) return null;

  // Log for debugging
  console.log('Modal is open, rendering with props:', { isOpen, title, size });

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4'
  };

  // Custom styles for responsive sizing
  const modalStyles = {
    base: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 101,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1rem'
    },
    content: {
      zIndex: 102,
      position: 'relative',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      textAlign: 'left',
      overflow: 'hidden',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      transform: 'translate(0, 0)',
      transition: 'all 0.15s ease-in-out',
      display: 'inline-block',
      verticalAlign: 'middle',
      width: '100%',
      maxHeight: 'calc(100vh - 2rem)',
      overflowY: 'auto'
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto" 
      style={{ 
        zIndex: 100,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 transition-opacity"
        onClick={onClose}
        style={{ 
          zIndex: 100,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      ></div>

      {/* Modal container */}
      <div 
        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        style={modalStyles.base}
      >
        {/* This element is to trick the browser into centering the modal contents. */}
        <span 
          className="hidden sm:inline-block sm:align-middle sm:h-screen" 
          aria-hidden="true"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            height: '100vh'
          }}
        >
          &#8203;
        </span>

        {/* Modal content */}
        <div 
          className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]} modal-content`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
          style={modalStyles.content}
        >
          {/* Modal header */}
          <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-4">
            <div className="flex justify-between items-center">
              {title && (
                <h3 
                  className="text-lg leading-6 font-medium text-gray-900" 
                  id="modal-headline"
                >
                  {title}
                </h3>
              )}
              
              {showCloseButton && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none cursor-pointer"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Modal body */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;