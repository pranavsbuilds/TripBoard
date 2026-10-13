'use client';

import React, { useState } from 'react';
import { X, Receipt } from 'lucide-react';
import { IndiaDatePicker } from '@/components/ui/IndiaDatePicker';
import { RupeeInput } from '@/components/ui/RupeeInput';

export interface GroupExpense {
  id: string;
  date: string;
  category: string;
  vendor: string;
  amount: number;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<GroupExpense, 'id'>) => void;
}

export function ExpenseModal({ isOpen, onClose, onAddExpense }: ExpenseModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Accommodation');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor.trim()) {
      setError('Please enter a description or vendor name.');
      return;
    }
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, ''));
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    onAddExpense({
      date,
      category,
      vendor: vendor.trim(),
      amount: numAmount,
    });

    setVendor('');
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-accent-gold">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-primary-dark">Log Group Expense</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition"
            >
              <option value="Accommodation">Accommodation</option>
              <option value="Dining">Dining</option>
              <option value="Transport">Transport</option>
              <option value="Conference / Events">Conference / Events</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <IndiaDatePicker
              label="Expense Date"
              value={date}
              onChange={(newIso) => setDate(newIso)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Description / Vendor
            </label>
            <input
              type="text"
              placeholder="e.g. Hotel Deposit (4 Rooms), Team Dinner"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition"
              required
            />
          </div>

          <div>
            <RupeeInput
              label="Amount in Rupees"
              value={amount}
              onChange={(val) => setAmount(val)}
              placeholder="0"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-primary-dark rounded-xl hover:bg-primary-blue transition-colors shadow-sm"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
