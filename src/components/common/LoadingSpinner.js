import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-gray-600',
    success: 'border-success-600',
    warning: 'border-warning-600',
    danger: 'border-danger-600',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
      />
    </div>
  );
};

export default LoadingSpinner; 