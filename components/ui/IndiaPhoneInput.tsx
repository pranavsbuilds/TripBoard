'use client';

import React, { useState, useEffect } from 'react';

export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  sampleLength: number;
}

export const COUNTRIES: CountryCode[] = [
  { name: 'India', code: '+91', flag: '🇮🇳', sampleLength: 10 },
  { name: 'United States', code: '+1', flag: '🇺🇸', sampleLength: 10 },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', sampleLength: 10 },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', sampleLength: 9 },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', sampleLength: 8 },
  { name: 'Australia', code: '+61', flag: '🇦🇺', sampleLength: 9 },
  { name: 'Canada', code: '+1', flag: '🇨🇦', sampleLength: 10 },
  { name: 'Germany', code: '+49', flag: '🇩🇪', sampleLength: 10 },
  { name: 'France', code: '+33', flag: '🇫🇷', sampleLength: 9 },
  { name: 'Japan', code: '+81', flag: '🇯🇵', sampleLength: 10 },
  { name: 'China', code: '+86', flag: '🇨🇳', sampleLength: 11 },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', sampleLength: 9 },
  { name: 'Qatar', code: '+974', flag: '🇶🇦', sampleLength: 8 },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', sampleLength: 9 },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', sampleLength: 9 },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', sampleLength: 9 },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿', sampleLength: 9 },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', sampleLength: 9 },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', sampleLength: 11 },
  { name: 'Ireland', code: '+353', flag: '🇮🇪', sampleLength: 9 },
  { name: 'Italy', code: '+39', flag: '🇮🇹', sampleLength: 10 },
  { name: 'Spain', code: '+34', flag: '🇪🇸', sampleLength: 9 },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', sampleLength: 9 },
  { name: 'Norway', code: '+47', flag: '🇳🇴', sampleLength: 8 },
  { name: 'Denmark', code: '+45', flag: '🇩🇰', sampleLength: 8 },
  { name: 'Finland', code: '+358', flag: '🇫🇮', sampleLength: 9 },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰', sampleLength: 8 },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', sampleLength: 10 },
  { name: 'Thailand', code: '+66', flag: '🇹🇭', sampleLength: 9 },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', sampleLength: 10 },
  { name: 'Philippines', code: '+63', flag: '🇵🇭', sampleLength: 10 },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳', sampleLength: 9 },
  { name: 'Mexico', code: '+52', flag: '🇲🇽', sampleLength: 10 },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', sampleLength: 10 },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', sampleLength: 10 },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', sampleLength: 10 },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', sampleLength: 9 },
  { name: 'Turkey', code: '+90', flag: '🇹🇷', sampleLength: 10 },
  { name: 'Israel', code: '+972', flag: '🇮🇱', sampleLength: 9 },
  { name: 'Poland', code: '+48', flag: '🇵🇱', sampleLength: 9 },
  { name: 'Austria', code: '+43', flag: '🇦🇹', sampleLength: 10 },
  { name: 'Belgium', code: '+32', flag: '🇧🇪', sampleLength: 9 },
  { name: 'Portugal', code: '+351', flag: '🇵🇹', sampleLength: 9 },
  { name: 'Greece', code: '+30', flag: '🇬🇷', sampleLength: 10 },
  { name: 'Czech Republic', code: '+420', flag: '🇨🇿', sampleLength: 9 },
  { name: 'Hungary', code: '+36', flag: '🇭🇺', sampleLength: 9 },
  { name: 'Romania', code: '+40', flag: '🇷🇴', sampleLength: 10 },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼', sampleLength: 8 },
  { name: 'Bahrain', code: '+973', flag: '🇧🇭', sampleLength: 8 },
  { name: 'Oman', code: '+968', flag: '🇴🇲', sampleLength: 8 },
];

interface IndiaPhoneInputProps {
  label?: string;
  name?: string;
  value?: string; // e.g. "+91 9876543210" or "9876543210"
  onChange?: (fullPhoneNumber: string, countryCode: string, localNumber: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function IndiaPhoneInput({
  label,
  name,
  value = '',
  onChange,
  required = false,
  disabled = false,
  error,
  className = '',
}: IndiaPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]); // default to India (+91)
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    
    // Check if value starts with a known country code
    const matchingCountry = COUNTRIES.find((c) => value.startsWith(c.code));
    if (matchingCountry) {
      setSelectedCountry(matchingCountry);
      const remainder = value.slice(matchingCountry.code.length).replace(/[^0-9]/g, '');
      setPhoneNumber(remainder);
    } else {
      const digitsOnly = value.replace(/[^0-9]/g, '');
      setPhoneNumber(digitsOnly);
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const found = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    setSelectedCountry(found);
    const full = `${found.code} ${phoneNumber}`.trim();
    onChange?.(full, found.code, phoneNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(digits);
    const full = `${selectedCountry.code} ${digits}`.trim();
    onChange?.(full, selectedCountry.code, digits);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:border-brand-blue bg-white transition-all duration-200">
        {/* Country Code Selector */}
        <div className="relative border-r border-slate-200 bg-slate-50 flex items-center">
          <select
            value={selectedCountry.code}
            onChange={handleCountryChange}
            disabled={disabled}
            className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-semibold text-primary-dark cursor-pointer outline-none"
          >
            {COUNTRIES.map((c, i) => (
              <option key={`${c.code}-${i}`} value={c.code}>
                {c.flag} {c.code} ({c.name})
              </option>
            ))}
          </select>
          <span className="absolute right-2 text-slate-400 pointer-events-none text-xs">▼</span>
        </div>

        {/* Local Number Input */}
        <input
          type="tel"
          name={name}
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={selectedCountry.code === '+91' ? '98765 43210' : 'Phone number'}
          maxLength={15}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2.5 text-sm text-primary-dark outline-none bg-transparent placeholder-slate-400 disabled:opacity-50 disabled:bg-slate-50"
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400">
        <span>Default: +91 (India) · All country codes included</span>
        {error && <span className="text-red-500 font-medium">{error}</span>}
      </div>
    </div>
  );
}

export default IndiaPhoneInput;
