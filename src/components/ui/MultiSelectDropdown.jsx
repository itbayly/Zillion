import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

export default function MultiSelectDropdown({
  options,
  selectedIds,
  onChange,
  placeholder,
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

  // Close dropdown when clicking outside
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
      >
        <span className="block truncate">{getButtonText()}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronsUpDown className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="sticky top-0 w-full border-b border-gray-200 px-3 py-2 focus:outline-none"
          />
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No options found.</div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleToggle(option.id)}
                className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 hover:bg-indigo-100"
              >
                <span
                  className={`block truncate ${
                    selectedIds.includes(option.id)
                      ? 'font-medium'
                      : 'font-normal'
                  }`}
                >
                  {option.name}
                </span>
                {selectedIds.includes(option.id) && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
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