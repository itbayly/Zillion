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
      <div className={`relative group/input`}>
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
            input-standard
            ${icon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error ? '!border-red-500 bg-red-50/10' : ''}
            ${className || ''}
          `}
        />
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-zillion-400' : 'text-slate-400'}`}>
            {icon}
          </div>
        )}
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