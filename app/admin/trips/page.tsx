import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { toDDMMYYYY } from '@/components/ui/IndiaDatePicker';
import { formatToINR } from '@/components/ui/RupeeInput';
import { Plus, Plane, MapPin, Calendar, Users, Star } from 'lucide-react';

export default async function AdminTripsPage() {
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      destination,
      purpose,
      start_date,
      end_date,
      budget_inr,
      group_budget_inr,
      individual_budget_inr,
      status,
      coordinator_id,
      coordinator:employees!trips_coordinator_id_fkey(full_name, employee_code),
      assignments:trip_assignments(
        id,
        role,
        employee:employees(full_name, employee_code, department)
      )
    `)
    .order('start_date', { ascending: false });

  const allTrips = trips || [];
  const activeCount = allTrips.filter((t) => t.status === 'in_progress').length;
  const upcomingCount = allTrips.filter((t) => t.status === 'upcoming').length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
            TRIP MANAGEMENT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Oversee corporate travel itineraries, team rosters, and Group vs. Individual budget allocations.
          </p>
        </div>
        <Link
          href="/admin/trips/create"
          className="px-5 py-3 bg-gold-btn hover:bg-gold-btn-hover text-white font-bold text-sm rounded-xl shadow-btn-gold transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Trip
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 text-brand-blue rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-primary-dark">{allTrips.length}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Trips</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-status-green rounded-xl flex items-center justify-center">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-primary-dark">{activeCount}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase">Active Trips</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-status-orange rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-primary-dark">{upcomingCount}</h3>
            <p className="text-xs text-slate-500 font-semibold uppercase">Upcoming Trips</p>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      {allTrips.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-card border border-slate-100 text-center space-y-3">
          <div className="text-3xl">✈</div>
          <h3 className="text-base font-bold text-primary-dark">No trips scheduled yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Plan your company&apos;s first business trip with dedicated team budgets.
          </p>
          <Link
            href="/admin/trips/create"
            className="inline-block mt-2 px-5 py-2.5 bg-gold-btn text-white text-xs font-bold rounded-lg shadow-btn-gold"
          >
            + Create First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allTrips.map((trip) => {
            const coordinatorData = Array.isArray(trip.coordinator)
              ? trip.coordinator[0]
              : trip.coordinator;
            const assignments = trip.assignments || [];

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl p-6 shadow-card border border-slate-100 space-y-4 hover:border-brand-blue/30 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        trip.status === 'in_progress'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trip.status === 'upcoming'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {trip.status === 'in_progress'
                        ? 'IN TRANSIT'
                        : trip.status.toUpperCase()}
                    </span>
                    <span className="font-mono font-bold text-primary-dark text-base">
                      ₹ {formatToINR(trip.budget_inr)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-primary-dark">{trip.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>

                  {/* Dual Budget Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Group Budget (Coord)
                      </span>
                      <span className="font-mono font-bold text-primary-dark">
                        ₹ {formatToINR(trip.group_budget_inr || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Per-Traveler Allowance
                      </span>
                      <span className="font-mono font-bold text-brand-blue">
                        ₹ {formatToINR(trip.individual_budget_inr || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Schedule & Coordinator */}
                  <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {toDDMMYYYY(trip.start_date)} → {toDDMMYYYY(trip.end_date)}
                      </span>
                    </div>

                    {coordinatorData && (
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>
                          Coordinator: {coordinatorData.full_name} ({coordinatorData.employee_code})
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{assignments.length} Travelers Assigned</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-blue bg-sky-50 px-2.5 py-1 rounded-md">
                    {trip.purpose}
                  </span>
                  <Link
                    href={`/admin/trips/${trip.id}`}
                    className="text-xs font-bold text-primary-dark hover:text-gold-btn transition"
                  >
                    Manage Roster &amp; Docs →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
