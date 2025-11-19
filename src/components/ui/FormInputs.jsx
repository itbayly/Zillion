import React, { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';

// 1. Standard Text/Number Input for Wizard
export function WizardTextInput({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  step = null,
  onBlur,
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          {...(type === 'number' ? { step: step || '0.01', min: '0' } : {})}
        />
      </div>
    </div>
  );
}

// 2. Input for Assignment Modal (prevents focus loss issues)
export function AssignmentInput({ value, onChange, onBlur }) {
  const handleFocus = (e) => e.target.select();

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="number"
        className="block w-full rounded-md border-gray-300 pl-10 text-right focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="0.00"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={onBlur}
      />
    </div>
  );
}

// 3. Smart Budget Input (implements "Delete the 0" fix)
export function BudgetInput({ value, onChange, disabled = false }) {
  // Safe initialization logic
  const initializeValue = (val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return '';
    return num.toFixed(2);
  };

  const [internalValue, setInternalValue] = useState(() =>
    initializeValue(value)
  );
  const inputRef = useRef(null);

  useEffect(() => {
    const numericValue = parseFloat(value) || 0;
    // Sync with external value, but only if the input isn't focused
    if (document.activeElement !== inputRef.current) {
      setInternalValue(numericValue === 0 ? '' : numericValue.toFixed(2));
    }
    // Also update internal state if the 'disabled' prop changes (e.g., linking a debt)
    if (disabled) {
      setInternalValue(numericValue === 0 ? '' : numericValue.toFixed(2));
    }
  }, [value, disabled]);

  const handleFocus = (e) => {
    // When focusing, set to the raw number for easy editing
    const numericValue = parseFloat(value) || 0;
    setInternalValue(numericValue === 0 ? '' : numericValue);
    e.target.select();
  };

  const handleChange = (e) => {
    setInternalValue(e.target.value);
  };

  const handleBlur = (e) => {
    const numericValue = parseFloat(internalValue) || 0;
    // On blur, format to 2 decimal places
    setInternalValue(numericValue === 0 ? '' : numericValue.toFixed(2));
    onChange(numericValue); // Propagate the numeric change
  };

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="number"
        step="0.01" // Ensure number arrows step correctly
        className="block w-full rounded-md border-gray-300 pl-10 text-right focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        placeholder="0.00"
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      />
    </div>
  );
}