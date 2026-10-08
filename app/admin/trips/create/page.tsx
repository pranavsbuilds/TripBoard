'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { IndiaDatePicker, toISODate } from '@/components/ui/IndiaDatePicker';
import { RupeeInput, formatToINR } from '@/components/ui/RupeeInput';
import { ArrowLeft, Users, Star, Plus } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  department: string | null;
  designation: string | null;
}

export default function CreateTripPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useAuth();

  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('Business Conference');
  const [startDate, setStartDate] = useState('20/10/2026');
  const [endDate, setEndDate] = useState('27/10/2026');

  // Budget states
  const [groupBudget, setGroupBudget] = useState<number>(100000);
  const [individualBudget, setIndividualBudget] = useState<number>(25000);

  // Employees & Assignment states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedTravelerIds, setSelectedTravelerIds] = useState<string[]>([]);
  const [coordinatorId, setCoordinatorId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [error, setError] = useState('');

  // Fetch company employees
  useEffect(() => {
    async function fetchEmployees() {
      const { data, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, employee_code, department, designation')
        .order('full_name', { ascending: true });

      if (!empErr && data) {
        setEmployees(data);
        // Pre-select first employee if available
        if (data.length > 0) {
          setSelectedTravelerIds([data[0].id]);
          setCoordinatorId(data[0].id);
        }
      }
      setFetchingEmployees(false);
    }
    fetchEmployees();
  }, [supabase]);

  // Handle traveler toggle
  const toggleTraveler = (empId: string) => {
    if (selectedTravelerIds.includes(empId)) {
      const remaining = selectedTravelerIds.filter((id) => id !== empId);
      setSelectedTravelerIds(remaining);
      // If removed traveler was coordinator, reassign to first remaining
      if (coordinatorId === empId) {
        setCoordinatorId(remaining[0] || null);
      }
    } else {
      const next = [...selectedTravelerIds, empId];
      setSelectedTravelerIds(next);
      // If no coordinator, assign this one
      if (!coordinatorId) {
        setCoordinatorId(empId);
      }
    }
  };

  // Calculate Total Approved Budget
  const totalApprovedBudget = useMemo(() => {
    const travelerCount = selectedTravelerIds.length;
    return groupBudget + individualBudget * travelerCount;
  }, [groupBudget, individualBudget, selectedTravelerIds.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!destination.trim()) {
      setError('Please specify a destination.');
      return;
    }

    if (selectedTravelerIds.length === 0) {
      setError('Please assign at least one traveler to this trip.');
      return;
    }

    if (!coordinatorId) {
      setError('Please designate a Trip Coordinator.');
      return;
    }

    setLoading(true);

    try {
      let companyId = profile?.company_id;

      if (!companyId && user) {
        const { data: comp } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (comp) {
          companyId = comp.id;
        } else {
          const { data: newComp } = await supabase
            .from('companies')
            .insert({ name: 'My Enterprise', domain: 'company.com' })
            .select('id')
            .single();
          companyId = newComp?.id;
        }
      }

      if (!companyId || !user) {
        setError('Missing company association for this admin profile.');
        setLoading(false);
        return;
      }

      const isoStart = toISODate(startDate);
      const isoEnd = toISODate(endDate);

      // 1. Insert into public.trips with separate group and individual budgets
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .insert({
          company_id: companyId,
          title: `${destination.split(',')[0]} ${purpose}`,
          destination: destination.trim(),
          country: destination.includes(',') ? destination.split(',').pop()?.trim() || 'India' : 'India',
          purpose: purpose.trim(),
          start_date: isoStart,
          end_date: isoEnd,
          budget_inr: totalApprovedBudget,
          group_budget_inr: groupBudget,
          individual_budget_inr: individualBudget,
          status: 'upcoming',
          coordinator_id: coordinatorId,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (tripErr) throw tripErr;

      // 2. Insert assignments for all selected travelers
      const assignments = selectedTravelerIds.map((empId) => ({
        company_id: companyId,
        trip_id: trip.id,
        employee_id: empId,
        role: empId === coordinatorId ? 'coordinator' : 'traveler',
        status: 'confirmed',
      }));

      const { error: assignErr } = await supabase.from('trip_assignments').insert(assignments);
      if (assignErr) throw assignErr;

      router.push('/admin/trips');
    } catch (err) {
      console.error('[CreateTrip]', err instanceof Error ? err.message : String(err));
      setError('Failed to create trip. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
            CREATE NEW TRIP
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Specify destination, schedule, assign team travelers, and allocate group &amp; individual budgets.
          </p>
        </div>
        <Link
          href="/admin/trips"
          className="text-sm font-bold text-[#1659A5] hover:text-gold-btn transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 md:p-10 shadow-card border border-slate-100 space-y-8"
      >
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* 1. Trip Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            1. Trip Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                Destination <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Dubai, UAE or Chicago, IL"
                className="w-full px-4 py-2.5 bg-[#F8FCFF] border border-[#D5E5F2] rounded-xl text-sm outline-none focus:border-brand-blue font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                Purpose of Trip <span className="text-red-500">*</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FCFF] border border-[#D5E5F2] rounded-xl text-sm outline-none focus:border-brand-blue font-medium cursor-pointer"
              >
                <option value="Business Conference">Business Conference</option>
                <option value="Client Renewal Meeting">Client Renewal Meeting</option>
                <option value="Tech Summit & Expo">Tech Summit & Expo</option>
                <option value="Executive Strategy">Executive Strategy</option>
                <option value="Onsite Training">Onsite Training</option>
                <option value="Sales Pitch">Sales Pitch</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* DATES ROW (India Standard DD/MM/YYYY) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <IndiaDatePicker
              label="Start Date"
              value={startDate}
              onChange={(formatted) => setStartDate(formatted)}
              required
            />
            <IndiaDatePicker
              label="End Date"
              value={endDate}
              onChange={(formatted) => setEndDate(formatted)}
              required
            />
          </div>
        </div>

        {/* 2. Travelers Selection & Coordinator Assignment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Assign Travelers &amp; Trip Coordinator
            </h3>
            <span className="text-xs bg-sky-100 text-brand-blue font-bold px-2.5 py-0.5 rounded-full">
              {selectedTravelerIds.length} Selected
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Select team members traveling together. Designate one traveler as the{' '}
            <strong>Trip Coordinator</strong> who manages shared itinerary bookings and the Group Budget.
          </p>

          {fetchingEmployees ? (
            <div className="text-center py-6 text-slate-400 text-xs">Loading employee roster...</div>
          ) : employees.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              No employees in directory.{' '}
              <Link href="/admin/employees/add" className="text-brand-blue font-bold underline">
                Add employees first
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = selectedTravelerIds.includes(emp.id);
                const isCoord = coordinatorId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? isCoord
                          ? 'border-2 border-brand-blue bg-sky-50/50'
                          : 'border-slate-300 bg-white'
                        : 'border-slate-200 bg-slate-50/50 opacity-80'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTraveler(emp.id)}
                        className="w-4 h-4 text-brand-blue rounded border-slate-300"
                      />
                      <div>
                        <div className="text-sm font-bold text-primary-dark">{emp.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {emp.employee_code} · {emp.designation || 'Staff'} · {emp.department || 'General'}
                        </div>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isCoord ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Coordinator
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCoordinatorId(emp.id)}
                            className="text-xs font-bold text-brand-blue hover:text-primary-dark transition"
                          >
                            Set as Coordinator
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. DUAL BUDGET ALLOCATION SECTION (Group vs Individual) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            3. Dual Budget Allocation (INR ₹)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Group Budget (Coordinator Managed) */}
            <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-amber-900">
                  Group Budget (Coordinator Managed)
                </span>
                <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  Coordinator-Scoped
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Shared capital for flights, hotels, group cabs, and conference passes.
              </p>
              <RupeeInput
                value={groupBudget}
                onChange={(raw) => setGroupBudget(raw)}
                placeholder="1,00,000"
              />
            </div>

            {/* Individual Budget (Per Traveler Allowance) */}
            <div className="p-5 rounded-xl border border-sky-200 bg-sky-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-brand-blue">
                  Individual Budget (Per Traveler)
                </span>
                <span className="text-[11px] bg-sky-100 text-brand-blue font-bold px-2 py-0.5 rounded">
                  Per-Diem Allowance
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Personal daily allowance for employee meals, local commute, and incidental expenses.
              </p>
              <RupeeInput
                value={individualBudget}
                onChange={(raw) => setIndividualBudget(raw)}
                placeholder="25,000"
              />
            </div>
          </div>

          {/* Total Budget Summary Box */}
          <div className="p-5 rounded-xl bg-primary-dark text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Total Approved Trip Budget
              </span>
              <div className="text-2xl font-black text-gold-light font-mono mt-0.5">
                ₹ {formatToINR(totalApprovedBudget)}
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1 sm:text-right">
              <div>
                Group Shared: <span className="font-mono font-bold text-white">₹ {formatToINR(groupBudget)}</span>
              </div>
              <div>
                Personal Allowances ({selectedTravelerIds.length}×):{' '}
                <span className="font-mono font-bold text-white">
                  ₹ {formatToINR(individualBudget * selectedTravelerIds.length)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
          <Link
            href="/admin/trips"
            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold text-sm rounded-xl shadow-btn-gold transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'CREATING TRIP...' : 'CREATE TRIP & ASSIGN ROLES'}
          </button>
        </div>
      </form>
    </div>
  );
}
