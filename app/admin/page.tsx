import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { toDDMMYYYY } from '@/components/ui/IndiaDatePicker';
import { formatToINR } from '@/components/ui/RupeeInput';
import { Users, Plane, Calendar, IndianRupee, Plus, ArrowRight } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Fetch employees count
  const { count: employeeCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true });

  // Fetch trips
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
      assignments:trip_assignments(employee_id)
    `)
    .order('start_date', { ascending: true });

  const allTrips = trips || [];
  const activeTripsCount = allTrips.filter((t) => t.status === 'in_progress').length;
  const upcomingTripsCount = allTrips.filter((t) => t.status === 'upcoming').length;
  const totalBudgetAllocated = allTrips.reduce((sum, t) => sum + (Number(t.budget_inr) || 0), 0);
  const upcomingTripsList = allTrips.filter((t) => t.status === 'upcoming' || t.status === 'in_progress').slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
          WELCOME, ADMIN
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your company&apos;s business travel, employees, and budgets from one centralized suite.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-sky-50 text-brand-blue rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-primary-dark">{employeeCount || 0}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Total Employees
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-status-green rounded-2xl flex items-center justify-center">
            <Plane className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-primary-dark">{activeTripsCount}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Active Trips
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-status-orange rounded-2xl flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-primary-dark">{upcomingTripsCount}</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Upcoming Trips
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-brand-blue rounded-2xl flex items-center justify-center">
            <IndianRupee className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-primary-dark font-mono">
              ₹ {formatToINR(totalBudgetAllocated) || '0'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Allocated Budget
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-primary-dark tracking-wide">QUICK ACTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/employees/add"
            className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:border-brand-blue text-left transition flex items-center gap-5 group no-underline"
          >
            <span className="w-12 h-12 rounded-xl bg-sky-50 text-brand-blue font-bold text-2xl flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition">
              <Plus className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-primary-dark">Add New Employee</h3>
              <p className="text-xs text-slate-500 mt-1">Register a team member to the corporate directory.</p>
            </div>
          </Link>

          <Link
            href="/admin/trips/create"
            className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 hover:border-gold-btn text-left transition flex items-center gap-5 group no-underline"
          >
            <span className="w-12 h-12 rounded-xl bg-amber-50 text-gold-btn font-bold text-2xl flex items-center justify-center group-hover:bg-gold-btn group-hover:text-white transition">
              <Plane className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-base font-bold text-primary-dark">Create New Trip</h3>
              <p className="text-xs text-slate-500 mt-1">
                Plan itinerary, allocate Group & Individual ₹ budgets, and assign coordinator.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming Trips List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-dark tracking-wide">
            UPCOMING BUSINESS TRIPS
          </h2>
          <Link
            href="/admin/trips"
            className="text-sm font-bold text-[#1659A5] hover:text-gold-btn transition flex items-center gap-1"
          >
            View All Trips <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingTripsList.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-100 text-center text-slate-500 text-sm">
            No upcoming trips planned yet.{' '}
            <Link href="/admin/trips/create" className="text-brand-blue font-bold underline">
              Create the first trip
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTripsList.map((trip) => {
              const coordinatorData = Array.isArray(trip.coordinator)
                ? trip.coordinator[0]
                : trip.coordinator;
              return (
                <div
                  key={trip.id}
                  className="bg-white p-6 rounded-2xl shadow-card border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-50 text-brand-blue rounded-xl flex items-center justify-center text-xl">
                      ✈
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary-dark">{trip.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {trip.destination} · 📅 {toDDMMYYYY(trip.start_date)} –{' '}
                        {toDDMMYYYY(trip.end_date)}
                      </p>
                      {coordinatorData && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                          ⭐ Coordinator: {coordinatorData.full_name} ({coordinatorData.employee_code})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary-dark font-mono">
                        ₹ {formatToINR(trip.budget_inr)}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Budget</div>
                    </div>
                    <span className="px-3 py-1 bg-sky-100 text-brand-blue font-bold text-xs rounded-full">
                      {trip.purpose}
                    </span>
                    <Link
                      href={`/admin/trips/${trip.id}`}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-primary-dark text-xs font-bold rounded-lg transition"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
