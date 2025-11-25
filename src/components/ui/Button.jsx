import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  icon,
  rightIcon,
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "relative flex items-center justify-center py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]";
  
  const variants = {
    primary: "bg-zillion-400 hover:bg-zillion-500 text-white shadow-lg shadow-zillion-400/30 dark:shadow-zillion-400/20 border border-transparent",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
    outline: "bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500",
    ghost: "bg-transparent text-zillion-400 hover:text-zillion-500 hover:bg-zillion-50/10 dark:hover:bg-zillion-400/10"
  };

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant] || variants.primary} 
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2 flex items-center">{icon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
    </button>
  );
};