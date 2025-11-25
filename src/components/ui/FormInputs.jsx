import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

// --- Helper: Format string with commas only (while typing) ---
const formatNumberString = (val) => {
  if (!val) return '';
  const str = val.toString().replace(/,/g, ''); // Strip existing commas
  if (isNaN(str)) return '';
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// --- Helper: Force 2 decimal places (on blur or disabled) ---
const formatCurrencyOnBlur = (val) => {
  if (!val) return '';
  const raw = val.toString().replace(/,/g, '');
  const num = parseFloat(raw);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 1. Standard Text/Number Input
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

// 2. Wizard Currency Input
export function WizardCurrencyInput({ label, id, value, onChange, placeholder = '0.00' }) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setLocalValue(formatNumberString(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setLocalValue(formatNumberString(raw));
      onChange(raw); 
    }
  };

  const handleBlur = () => {
    if (localValue) {
      const formatted = formatCurrencyOnBlur(localValue);
      setLocalValue(formatted);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <DollarSign className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          inputMode="decimal"
          id={id}
          name={id}
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
        />
      </div>
    </div>
  );
}

// 3. Standard Currency Input
export function StandardCurrencyInput({ value, onChange, placeholder = '0.00', id, disabled = false, autoFocus = false }) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setLocalValue(formatNumberString(value));
    } else {
      setLocalValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setLocalValue(formatNumberString(raw));
      onChange(raw);
    }
  };

  const handleBlur = () => {
    if (localValue) {
      const formatted = formatCurrencyOnBlur(localValue);
      setLocalValue(formatted);
    }
  };

  return (
    <div className="relative mt-1 rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <DollarSign className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        inputMode="decimal"
        id={id}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        autoFocus={autoFocus}
        className="block w-full rounded-md border-gray-300 pl-7 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
        placeholder={placeholder}
      />
    </div>
  );
}

// 4. Assignment Input
export function AssignmentInput({ value, onChange, onBlur }) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setLocalValue(formatNumberString(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setLocalValue(formatNumberString(raw));
      onChange(raw);
    }
  };

  const handleFocus = (e) => e.target.select();

  const handleInternalBlur = (e) => {
    if (localValue) {
      const formatted = formatCurrencyOnBlur(localValue);
      setLocalValue(formatted);
    }
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        inputMode="decimal"
        className="block w-full rounded-md border-gray-300 pl-10 text-right focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="0.00"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleInternalBlur}
      />
    </div>
  );
}

// 5. Budget Input
export function BudgetInput({ value, onChange, disabled = false }) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    const num = parseFloat(value);
    if (!value || num === 0) {
      setLocalValue('');
    } else {
      if (disabled) {
        setLocalValue(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      } else {
        setLocalValue(formatNumberString(value));
      }
    }
  }, [value, disabled]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setLocalValue(formatNumberString(raw));
      onChange(raw === '' ? 0 : parseFloat(raw)); 
    }
  };

  const handleFocus = (e) => e.target.select();

  const handleBlur = () => {
    const raw = localValue.replace(/,/g, '');
    const num = parseFloat(raw);
    if (num && !isNaN(num)) {
       const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
       setLocalValue(formatted);
    }
  };

  return (
    <div className="relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        inputMode="decimal"
        className="block w-full rounded-md border-gray-300 pl-10 text-right focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        placeholder="0.00"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
      />
    </div>
  );
}

// 6. Glass Currency Input (New Design System)
export function GlassCurrencyInput({ value, onChange, placeholder = '0.00', id, disabled = false, autoFocus = false, theme = 'light', label }) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setLocalValue(formatNumberString(value));
    } else {
      setLocalValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setLocalValue(formatNumberString(raw));
      onChange(raw);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue) {
      const formatted = formatCurrencyOnBlur(localValue);
      setLocalValue(formatted);
    }
  };

  return (
    <div className="w-full mb-5">
      {label && (
        <label className={`block mb-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </label>
      )}
      <div className={`
        relative flex items-center transition-all duration-300 rounded-lg overflow-hidden border
        ${isFocused 
            ? 'border-zillion-400 ring-2 ring-zillion-400/20 bg-white/10 dark:bg-slate-900/40' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 hover:border-slate-400 dark:hover:border-slate-600'
        }
      `}>
        <div className={`pl-3 pr-2 transition-colors duration-300 ${isFocused ? 'text-zillion-400' : 'text-slate-400'}`}>
          <DollarSign className="h-4 w-4" />
        </div>
        <input
          type="text"
          inputMode="decimal"
          id={id}
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={`
            w-full py-3 text-sm bg-transparent outline-none transition-colors
            ${theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}
          `}
        />
      </div>
    </div>
  );
}