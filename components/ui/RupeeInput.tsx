'use client';

import React, { useState, useEffect } from 'react';

interface RupeeInputProps {
  label?: string;
  name?: string;
  value?: number | string;
  onChange?: (rawValue: number, formattedValue: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  error?: string;
  className?: string;
}

// Indian numbering format: 150000 -> 1,50,000
export function formatToINR(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const numStr = value.toString().replace(/[^0-9.]/g, '');
  if (!numStr) return '';

  const [integerPart, decimalPart] = numStr.split('.');
  
  // Format integer in Indian numbering system
  let lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart.slice(0, 2)}` : formattedInteger;
}

export function RupeeInput({
  label,
  name,
  value = '',
  onChange,
  placeholder = '0.00',
  required = false,
  disabled = false,
  min = 0,
  max,
  error,
  className = '',
}: RupeeInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatToINR(value) : ''
  );

  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      setDisplayValue(formatToINR(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/[^0-9.]/g, '');
    const num = parseFloat(rawDigits) || 0;

    const formatted = formatToINR(rawDigits);
    setDisplayValue(formatted);
    onChange?.(num, `₹ ${formatted}`);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-primary-dark font-bold text-base pointer-events-none select-none">
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          name={name}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-white border ${
            error ? 'border-red-500' : 'border-slate-300 focus:border-brand-blue'
          } text-primary-dark font-semibold rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder-slate-400 disabled:opacity-50 disabled:bg-slate-50`}
        />
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <span>Currency: Indian Rupees (INR)</span>
        {error && <span className="text-red-500 font-medium">{error}</span>}
      </div>
    </div>
  );
}

export default RupeeInput;
