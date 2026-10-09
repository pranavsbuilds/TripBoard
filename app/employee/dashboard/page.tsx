import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { EmployeeTripCard } from '@/components/trips/EmployeeTripCard';
import { redirect } from 'next/navigation';
import { FileText, Plane } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'My Dashboard | TripBoard',
};

export default async function EmployeeDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: employeeData } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single();

  const currentEmployeeId = employeeData?.id;

  // Fetch assigned trips
  let trips: any[] = [];
  if (currentEmployeeId) {
    const { data: tripData } = await supabase
      .from('trip_assignments')
      .select(`
        trip_id,
        is_coordinator,
        trips (
          id, title, destination, start_date, end_date, purpose,
          status, budget_inr, group_budget_inr, individual_budget_inr, coordinator_id
        )
      `)
      .eq('employee_id', currentEmployeeId);
      
    if (tripData) {
      trips = tripData
        .filter((ta) => ta.trips)
        .map((ta) => {
          const t = ta.trips as any;
          return {
            ...t,
            isCoordinator: ta.is_coordinator || t.coordinator_id === currentEmployeeId,
            travelers: [
              {
                id: currentEmployeeId,
                name: employeeData?.full_name || profile?.full_name || 'Traveler',
                department: profile?.department || undefined,
                isCoordinator: ta.is_coordinator || t.coordinator_id === currentEmployeeId,
              },
            ],
            bookings: [],
            invoices: [],
          };
        });
    }
  }

  // Fetch document verification status
  let docsCount = { total: 0, verified: 0 };
  if (currentEmployeeId) {
    const { data: docs } = await supabase
      .from('documents')
      .select('status')
      .eq('employee_id', currentEmployeeId);
      
    if (docs) {
      docsCount.total = docs.length;
      docsCount.verified = docs.filter(d => d.status === 'verified').length;
    }
  }

  const upcomingTrips = trips.filter(t => new Date(t.start_date) >= new Date() || t.status === 'upcoming');
  const pastTrips = trips.filter(t => new Date(t.start_date) < new Date() && t.status !== 'upcoming');

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-primary-dark mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Traveler'} 👋
          </h2>
          <p className="text-slate-500">Here's a summary of your upcoming business travel.</p>
        </div>
        <div className="flex gap-6 md:gap-4 w-full md:w-auto">
          <div className="text-center px-4 md:px-6 border-r border-slate-200 flex-1 md:flex-none">
            <p className="text-2xl font-bold text-primary-dark">{upcomingTrips.length}</p>
            <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Upcoming Trips</p>
          </div>
          <div className="text-center px-4 md:px-6 flex-1 md:flex-none">
            <p className={`text-2xl font-bold ${docsCount.verified < docsCount.total ? 'text-status-orange' : 'text-status-green'}`}>
              {docsCount.verified}/{docsCount.total}
            </p>
            <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Docs Verified</p>
          </div>
        </div>
      </div>

      {/* Action Required Banner for Documents (if applicable) */}
      {docsCount.total > 0 && docsCount.verified < docsCount.total && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-orange-900">Action Required: Travel Documents</p>
              <p className="text-sm text-orange-800">You have {docsCount.total - docsCount.verified} pending documents that require attention.</p>
            </div>
          </div>
          <Link href="/employee/documents" className="px-4 py-2 bg-white text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors shadow-sm border border-orange-200">
            Manage Documents
          </Link>
        </div>
      )}

      {/* Upcoming Trips */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-xl font-bold text-primary-dark">My Upcoming Trips</h3>
            <p className="text-sm text-slate-500">Your assigned business trips requiring attention.</p>
          </div>
        </div>

        {upcomingTrips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-bold text-primary-dark mb-1">No upcoming trips</h4>
            <p className="text-slate-500">You don't have any assigned upcoming trips at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {upcomingTrips.map(trip => (
              <EmployeeTripCard 
                key={trip.id} 
                trip={trip as any} 
                currentEmployeeId={currentEmployeeId}
                isCoordinator={trip.isCoordinator}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Past Trips (Optional) */}
      {pastTrips.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Past Trips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastTrips.map(trip => (
              <div key={trip.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm opacity-75">
                <h4 className="font-bold text-slate-800">{trip.title}</h4>
                <p className="text-sm text-slate-500">{trip.destination}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
