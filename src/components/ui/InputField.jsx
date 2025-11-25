import React, { useState } from 'react';

export const InputField = ({ label, labelClassName, icon, rightIcon, className, containerClassName, error, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`w-full group ${containerClassName || 'mb-5'}`}>
      {label && (
        <label className={`block mb-2 transition-colors duration-300
          ${labelClassName 
            ? labelClassName 
            : `text-xs font-semibold uppercase tracking-wider ${error ? 'text-red-500' : 'text-slate-500 dark:text-slate-400 group-focus-within:text-zillion-400'}`
          }
        `}>
          {label}
        </label>
      )}
      <div className={`
        relative flex items-center transition-all duration-300 rounded-lg overflow-hidden
        border 
        ${error 
          ? 'border-red-500 bg-red-50/10' 
          : isFocused 
            ? 'border-zillion-400 ring-2 ring-zillion-400/20 bg-white/10 dark:bg-slate-900/40' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 hover:border-slate-400 dark:hover:border-slate-600'
        }
      `}>
        {icon && (
          <div className={`pl-3 pr-2 transition-colors duration-300 ${isFocused ? 'text-zillion-400' : 'text-slate-400'}`}>
            {icon}
          </div>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            if (props.onFocus) props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (props.onBlur) props.onBlur(e);
          }}
          className={`
            w-full py-3 text-sm bg-transparent outline-none transition-colors
            text-slate-800 dark:text-slate-100 placeholder-slate-400
            ${!icon && 'pl-4'}
            ${!rightIcon && 'pr-4'}
            ${className || ''}
          `}
        />
        {rightIcon && (
          <div className={`pr-3 pl-2 transition-colors duration-300 ${isFocused ? 'text-zillion-400' : 'text-slate-400'}`}>
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 animate-pulse">{error}</p>}
    </div>
  );
};