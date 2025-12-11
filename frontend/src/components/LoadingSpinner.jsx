import React from 'react';

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${spinnerSize} animate-spin rounded-full border-b-2 border-blue-600`}></div>
    </div>
  );
};

export default LoadingSpinner;