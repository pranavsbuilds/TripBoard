import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { toDDMMYYYY } from '@/lib/format';
import { EmployeeTripVaultClient } from '@/components/trips/EmployeeTripVaultClient';
import { ArrowLeft, MapPin, Calendar, Star } from 'lucide-react';

export const metadata = {
  title: 'Trip Travel Documents | TripBoard',
};

export default async function EmployeeTripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, company_id')
    .eq('user_id', user.id)
    .single();

  if (!employee) redirect('/login');

  // Verify trip exists and traveler is assigned
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .single();

  if (!trip) {
    redirect('/employee/dashboard');
  }

  const { data: assignment } = await supabase
    .from('trip_assignments')
    .select('is_coordinator')
    .eq('trip_id', trip.id)
    .eq('employee_id', employee.id)
    .maybeSingle();

  // If not assigned as traveler, redirect to dashboard
  if (!assignment) {
    redirect('/employee/dashboard');
  }

  // Fetch coordinator name
  let coordinatorName = 'Designated Lead';
  if (trip.coordinator_id) {
    const { data: coordEmp } = await supabase
      .from('employees')
      .select('full_name')
      .eq('id', trip.coordinator_id)
      .single();
    if (coordEmp?.full_name) {
      coordinatorName = coordEmp.full_name;
    }
  }

  // Fetch admin-configured document requirements for this specific trip
  const { data: requirementsData } = await supabase
    .from('trip_document_requirements')
    .select('id, document_type, title, is_mandatory')
    .eq('trip_id', trip.id)
    .order('created_at', { ascending: true });

  // Fetch employee's uploaded documents for this specific trip
  const { data: uploadedDocsData } = await supabase
    .from('documents')
    .select('id, document_type, file_name, file_size_bytes, storage_path, status, rejection_reason, uploaded_at')
    .eq('trip_id', trip.id)
    .eq('employee_id', employee.id);

  const requirements = (requirementsData || []) as any[];
  const uploadedDocs = (uploadedDocsData || []) as any[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-status-green bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Employee Portal
            </span>
            <span className="text-xs text-slate-400">· Trip Details</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
            {trip.destination}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage required travel compliance documents for this business journey.
          </p>
        </div>

        <Link
          href="/employee/dashboard"
          className="text-sm font-bold text-brand-blue hover:text-primary-dark transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Trip Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary-dark font-extrabold text-lg">
            <MapPin className="w-5 h-5 text-brand-blue" />
            <span>{trip.destination}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 font-mono text-brand-blue bg-sky-50 px-2.5 py-1 rounded">
              <Calendar className="w-3.5 h-3.5" />
              {toDDMMYYYY(trip.start_date)} → {toDDMMYYYY(trip.end_date)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              Purpose: <strong className="text-primary-dark">{trip.purpose}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">
              Trip Coordinator
            </span>
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {coordinatorName}
            </span>
          </div>

          {assignment.is_coordinator && (
            <Link
              href={`/employee/trips/${trip.id}/coordinator`}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap ml-2"
            >
              Coordinator Hub →
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Document Vault */}
      <EmployeeTripVaultClient
        tripId={trip.id}
        tripDestination={trip.destination}
        requirements={requirements}
        uploadedDocs={uploadedDocs}
        travelerName={employee.full_name}
      />
    </div>
  );
}
