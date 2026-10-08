'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toDDMMYYYY } from '@/components/ui/IndiaDatePicker';
import { formatToINR } from '@/components/ui/RupeeInput';
import {
  Users,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Plane,
  Building2,
  Receipt,
  Star,
  Plus,
} from 'lucide-react';

export interface TripBooking {
  id: string;
  type: 'flight' | 'hotel' | 'road';
  vendor: string;
  cost: number;
  date?: string;
}

export interface TripInvoice {
  id: string;
  category: string;
  vendor?: string;
  amount: number;
  date?: string;
}

export interface EmployeeTrip {
  id: string;
  title: string;
  destination: string;
  purpose: string;
  start_date: string;
  end_date: string;
  budget_inr: number;
  group_budget_inr?: number;
  individual_budget_inr?: number;
  status: string;
  coordinator_id?: string;
  coordinator_name?: string;
  travelers: {
    id: string;
    name: string;
    department?: string;
    isCoordinator?: boolean;
  }[];
  bookings?: TripBooking[];
  invoices?: TripInvoice[];
}

interface EmployeeTripCardProps {
  trip: EmployeeTrip;
  currentEmployeeId?: string;
  isCoordinator?: boolean;
}

export function EmployeeTripCard({
  trip,
  currentEmployeeId,
  isCoordinator = false,
}: EmployeeTripCardProps) {
  const [expanded, setExpanded] = useState(false);

  const groupBudget = trip.group_budget_inr || 0;
  const individualBudget = trip.individual_budget_inr || 0;

  // Compute spent amounts
  const groupSpent = (trip.bookings || []).reduce((sum, b) => sum + (Number(b.cost) || 0), 0);
  const myExpensesSpent = (trip.invoices || []).reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0
  );

  const groupPct = groupBudget > 0 ? Math.min(100, Math.round((groupSpent / groupBudget) * 100)) : 0;
  const indivPct = individualBudget > 0 ? Math.min(100, Math.round((myExpensesSpent / individualBudget) * 100)) : 0;

  const travelerNames = trip.travelers.map((t) => t.name).join(', ') || 'Unnamed Travelers';
  const departments = [...new Set(trip.travelers.map((t) => t.department).filter(Boolean))].join(', ');

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden relative transition hover:border-slate-300">
      {/* Left Perforation Indicator (Assets/tripboard.claude.jsx line 371) */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-blue" />

      {/* Card Header (Click to toggle expansion) */}
      <div
        className="p-6 md:p-7 pl-8 cursor-pointer border-b border-slate-100 select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 font-extrabold text-lg md:text-xl text-primary-dark">
              <Users className="w-5 h-5 text-slate-400" />
              <span>{travelerNames}</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              {trip.travelers.length} travelers{departments ? ` · ${departments}` : ''}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-primary-dark">
                <MapPin className="w-4 h-4 text-brand-blue" />
                {trip.destination}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-brand-blue bg-sky-50 px-2 py-0.5 rounded">
                <Calendar className="w-3.5 h-3.5" />
                {toDDMMYYYY(trip.start_date)} → {toDDMMYYYY(trip.end_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-bold font-mono rounded ${
                trip.status === 'in_progress'
                  ? 'bg-emerald-500 text-white'
                  : trip.status === 'upcoming'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {trip.status === 'in_progress' ? 'IN TRANSIT' : trip.status.toUpperCase()}
            </span>
            <div className="text-slate-400">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Dual Budget Progress Trackers (User directive: separate Group vs Individual) */}
        <div className="mt-6 space-y-4 pt-4 border-t border-slate-100">
          {/* 1. Group Budget Progress (Handled by Coordinator) */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-brand-blue" /> Group Bookings Budget{' '}
                {trip.coordinator_name && (
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                    Coord: {trip.coordinator_name}
                  </span>
                )}
              </span>
              <span className="font-mono text-slate-700">
                ₹ {formatToINR(groupSpent)} spent / ₹ {formatToINR(groupBudget)} budget ({groupPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  groupSpent > groupBudget && groupBudget > 0 ? 'bg-red-500' : 'bg-status-green'
                }`}
                style={{ width: `${groupPct}%` }}
              />
            </div>
          </div>

          {/* 2. My Individual Budget Progress (Per-Diem Allowance) */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-600 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-gold-btn" /> My Personal Per-Diem Allowance
              </span>
              <span className="font-mono text-slate-700">
                ₹ {formatToINR(myExpensesSpent)} spent / ₹ {formatToINR(individualBudget)} budget ({indivPct}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  myExpensesSpent > individualBudget && individualBudget > 0
                    ? 'bg-red-500'
                    : 'bg-brand-blue'
                }`}
                style={{ width: `${indivPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Drawer (Assets/tripboard.claude.jsx lines 405-520) */}
      {expanded && (
        <div className="bg-slate-50/70 p-6 md:p-8 pl-8 space-y-6 border-t border-slate-100">
          {/* Purpose & Roles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Trip Purpose</span>
              <p className="text-sm font-semibold text-primary-dark">{trip.purpose}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Trip Coordinator</span>
              <p className="text-sm font-bold text-amber-800 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {trip.coordinator_name || 'Designated Lead'}
              </p>
            </div>
            {isCoordinator && (
              <Link
                href={`/employee/trips/${trip.id}/coordinator`}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm self-start sm:self-auto"
              >
                Open Coordinator Hub →
              </Link>
            )}
          </div>

          {/* Group Bookings (Handled by Coordinator) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Group Bookings (Flights / Accommodations)
              </h4>
              <span className="text-xs font-mono text-slate-500">
                {(trip.bookings || []).length} logged
              </span>
            </div>

            {(trip.bookings || []).length === 0 ? (
              <div className="p-3 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No bookings recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {trip.bookings?.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      {b.type === 'flight' ? (
                        <Plane className="w-4 h-4 text-brand-blue" />
                      ) : (
                        <Building2 className="w-4 h-4 text-slate-600" />
                      )}
                      <div>
                        <span className="font-bold text-primary-dark">{b.vendor}</span>
                        {b.date && (
                          <span className="text-xs text-slate-400 block font-mono">{b.date}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-primary-dark text-sm">
                      ₹ {formatToINR(b.cost)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Expenses Logged */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                My Invoices &amp; Per-Diem Receipts
              </h4>
              <Link
                href="/employee/documents"
                className="text-xs font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Document
              </Link>
            </div>

            {(trip.invoices || []).length === 0 ? (
              <div className="p-3 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                No personal receipts logged yet.
              </div>
            ) : (
              <div className="space-y-2">
                {trip.invoices?.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <Receipt className="w-4 h-4 text-gold-btn" />
                      <div>
                        <span className="font-bold text-primary-dark capitalize">
                          {inv.category} {inv.vendor ? `· ${inv.vendor}` : ''}
                        </span>
                        {inv.date && (
                          <span className="text-xs text-slate-400 block font-mono">{inv.date}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-primary-dark text-sm">
                      ₹ {formatToINR(inv.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeTripCard;
