'use client';

import { useState } from 'react';

export default function SearchField({
  placeholder = 'Search...',
  value = '',
  onChange = null,
  onSearch = null,
  scope = null,
  size = 'md',
  className = '',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(value);

  const sizeStyles = {
    sm: 'px-sm py-xs text-secondary h-[36px]',
    md: 'px-md py-sm text-body h-[44px]',
    lg: 'px-lg py-md text-body h-[56px]',
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleClear = () => {
    setInternalValue('');
    if (onChange) onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center gap-sm ${sizeStyles[size]} px-md border border-border rounded-button bg-white`}>
        <svg
          className="w-5 h-5 text-text-muted flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          className="flex-1 border-none outline-none bg-transparent text-text-primary placeholder-text-muted"
          {...props}
        />

        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-text-muted hover:text-text-primary flex-shrink-0"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {scope && (
          <span className="text-xs text-text-muted ml-sm border-l border-border pl-sm">
            {scope}
          </span>
        )}
      </div>
    </div>
  );
}
