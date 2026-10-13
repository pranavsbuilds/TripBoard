'use client';

import React, { useState } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { IndiaDatePicker } from '@/components/ui/IndiaDatePicker';

export interface ItineraryItem {
  id: string;
  time: string;
  date: string;
  title: string;
  desc: string;
  color: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<ItineraryItem, 'id'>) => void;
}

export function EventModal({ isOpen, onClose, onAddEvent }: EventModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('bg-brand-blue');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter an event title.');
      return;
    }

    // Format human readable date for card: e.g. "20 Sept"
    const parsedDate = new Date(date);
    const dateStr = !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : date;

    onAddEvent({
      time: time || '09:00',
      date: dateStr,
      title: title.trim(),
      desc: desc.trim() || 'No additional details.',
      color,
    });

    setTitle('');
    setDesc('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-primary-dark">Add Itinerary Event</h3>
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
            <IndiaDatePicker
              label="Event Date"
              value={date}
              onChange={(newIso) => setDate(newIso)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Category Color
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition"
              >
                <option value="bg-brand-blue">Blue (Travel / Flights)</option>
                <option value="bg-purple-500">Purple (Accommodation)</option>
                <option value="bg-emerald-500">Green (Meetings / Summit)</option>
                <option value="bg-amber-500">Orange (Dining / Leisure)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Event Title
            </label>
            <input
              type="text"
              placeholder="e.g. Flight EK501 Departure, Hotel Check-in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              placeholder="Location details, meeting points, baggage instructions..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-primary-dark outline-none focus:border-brand-blue focus:bg-white transition resize-none"
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
              Add to Itinerary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
