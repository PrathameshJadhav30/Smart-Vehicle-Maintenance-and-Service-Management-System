import React from 'react';
import Button from './Button';

const ErrorDisplay = ({ title = "Error loading data", message = "Something went wrong. Please try again.", onRetry, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50">
        <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="mt-4 text-xl font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;