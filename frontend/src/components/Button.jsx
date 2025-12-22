import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent cursor-pointer',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer',
    outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer',
    ghost: 'bg-transparent text-blue-600 hover:bg-gray-100 cursor-pointer',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent cursor-pointer',
    success: 'bg-green-600 hover:bg-green-700 text-white border-transparent cursor-pointer',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent cursor-pointer',
    info: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent cursor-pointer',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Disabled styles
  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  // Loading spinner
  const renderSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        cursor-pointer
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && renderSpinner()}
      {children}
    </button>
  );
};

export default Button;