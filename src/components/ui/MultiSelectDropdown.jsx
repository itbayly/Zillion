import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

export default function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder,
  theme = 'light'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleToggle = (id) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id];
    onChange(newSelectedIds);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getButtonText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      return options.find((o) => o.id === selectedIds[0])?.name || placeholder;
    }
    return `${selectedIds.length} selected`;
  };

  // Theme Styles with Fast Transitions
  const baseClass = theme === 'dark' 
    ? 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800' 
    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
  
  const dropdownClass = theme === 'dark'
    ? 'bg-slate-800 border-slate-700 text-slate-200'
    : 'bg-white border-slate-200 text-gray-900';

  const inputClass = theme === 'dark'
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full cursor-pointer rounded-lg border py-3 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-zillion-400 focus:border-transparent sm:text-sm transition-colors duration-300 ${baseClass}`}
      >
        <span className="block truncate">{getButtonText()}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronsUpDown className={`h-5 w-5 transition-colors duration-300 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />
        </span>
      </button>

      {isOpen && (
        <div className={`absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 text-base shadow-lg focus:outline-none sm:text-sm ${dropdownClass}`}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className={`sticky top-0 w-full border-b px-3 py-2 focus:outline-none ${inputClass}`}
          />
          {filteredOptions.length === 0 ? (
            <div className={`px-3 py-2 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>No options found.</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleToggle(option.id)}
                className={`relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-zillion-50'}`}
              >
                <span
                  className={`block truncate transition-colors duration-300 ${
                    selectedIds.includes(option.id)
                      ? 'font-medium text-zillion-500'
                      : ''
                  }`}
                >
                  {option.name}
                </span>
                {selectedIds.includes(option.id) && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zillion-500">
                    <Check className="h-5 w-5" />
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
