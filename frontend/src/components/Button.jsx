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
  // Variant styles with enhanced colors and transitions
  const variantStyles = {
    primary: 'bg-primary hover:bg-blue-700 text-white border-transparent shadow-md hover:shadow-lg',
    secondary: 'bg-secondary hover:bg-teal-700 text-white border-transparent shadow-md hover:shadow-lg',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-primary hover:bg-blue-50',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent shadow-md hover:shadow-lg',
    success: 'bg-green-500 hover:bg-green-600 text-white border-transparent shadow-md hover:shadow-lg',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-md hover:shadow-lg',
    info: 'bg-indigo-500 hover:bg-indigo-600 text-white border-transparent shadow-md hover:shadow-lg',
  };

  // Enhanced size styles with better padding and responsive adjustments
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs md:px-3.5 md:py-1.5',
    md: 'px-4.5 py-2.5 text-sm md:px-5 md:py-3',
    lg: 'px-6 py-3.5 text-base md:px-7 md:py-4',
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
        font-medium rounded-lg
        transition-all duration-300 ease-in-out transform
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        active:scale-95
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