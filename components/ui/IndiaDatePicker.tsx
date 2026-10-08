'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface IndiaDatePickerProps {
  label?: string;
  name?: string;
  value?: string; // Expects "DD/MM/YYYY" or "YYYY-MM-DD"
  onChange?: (dateFormatted: string, dateISO: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

// Converts YYYY-MM-DD -> DD/MM/YYYY
export function toDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return isoDate;
}

// Converts DD/MM/YYYY -> YYYY-MM-DD
export function toISODate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) return ddmmyyyy;
  const parts = ddmmyyyy.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return ddmmyyyy;
}

export function IndiaDatePicker({
  label,
  name,
  value = '',
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  error,
  placeholder = 'DD/MM/YYYY',
  className = '',
}: IndiaDatePickerProps) {
  const [displayValue, setDisplayValue] = useState<string>(toDDMMYYYY(value));
  const [isoValue, setIsoValue] = useState<string>(toISODate(value));

  useEffect(() => {
    setDisplayValue(toDDMMYYYY(value));
    setIsoValue(toISODate(value));
  }, [value]);

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    const formatted = toDDMMYYYY(newIso);
    setIsoValue(newIso);
    setDisplayValue(formatted);
    onChange?.(formatted, newIso);
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^0-9/]/g, '');
    
    // Auto insert slashes: DD/MM/YYYY
    if (input.length === 2 && !input.includes('/')) {
      input = `${input}/`;
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = `${input}/`;
    }
    if (input.length > 10) input = input.slice(0, 10);

    setDisplayValue(input);

    if (input.length === 10) {
      const iso = toISODate(input);
      setIsoValue(iso);
      onChange?.(input, iso);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={displayValue}
          onChange={handleManualInputChange}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
          required={required}
          className={`w-full bg-white border ${
            error ? 'border-red-500' : 'border-slate-300 focus:border-brand-blue'
          } text-primary-blue rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder-slate-400 disabled:opacity-50 disabled:bg-slate-50`}
        />

        {/* Hidden native date input triggered by calendar button */}
        <div className="absolute right-2 flex items-center">
          <label className="p-2 cursor-pointer text-slate-500 hover:text-brand-blue transition-colors">
            <CalendarIcon className="w-4 h-4" />
            <input
              type="date"
              name={name}
              value={isoValue}
              onChange={handleNativePickerChange}
              min={min ? toISODate(min) : undefined}
              max={max ? toISODate(max) : undefined}
              disabled={disabled}
              className="sr-only"
              tabIndex={-1}
            />
          </label>
        </div>
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <span>Format: DD/MM/YYYY</span>
        {error && <span className="text-red-500 font-medium">{error}</span>}
      </div>
    </div>
  );
}

export default IndiaDatePicker;
