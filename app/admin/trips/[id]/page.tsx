import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { toDDMMYYYY } from '@/components/ui/IndiaDatePicker';
import { formatToINR } from '@/components/ui/RupeeInput';
import { ArrowLeft, MapPin, Calendar, Users, Star, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default async function AdminTripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch trip details
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      destination,
      country,
      purpose,
      start_date,
      end_date,
      budget_inr,
      group_budget_inr,
      individual_budget_inr,
      status,
      coordinator_id,
      coordinator:employees!trips_coordinator_id_fkey(id, full_name, employee_code, email, phone),
      assignments:trip_assignments(
        id,
        role,
        status,
        employee:employees(id, full_name, employee_code, department, designation, email, phone)
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (!trip) {
    notFound();
  }

  // Fetch uploaded documents for this trip
  const { data: documents } = await supabase
    .from('documents')
    .select(`
      id,
      document_type,
      file_name,
      file_url,
      status,
      rejection_reason,
      created_at,
      employee:employees(full_name, employee_code)
    `)
    .eq('trip_id', id)
    .order('created_at', { ascending: false });

  const coordinatorData = Array.isArray(trip.coordinator)
    ? trip.coordinator[0]
    : trip.coordinator;
  const assignments = trip.assignments || [];
  const docsList = documents || [];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/trips"
          className="text-sm font-bold text-[#1659A5] hover:text-gold-btn transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trips
        </Link>
        <span
          className={`px-3 py-1 text-xs font-bold rounded-full ${
            trip.status === 'in_progress'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {trip.status.toUpperCase()}
        </span>
      </div>

      {/* Trip Hero Card */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary-dark tracking-wide">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-blue" />
                {trip.destination}, {trip.country}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono text-xs text-brand-blue bg-sky-50 px-2.5 py-0.5 rounded">
                <Calendar className="w-3.5 h-3.5" />
                {toDDMMYYYY(trip.start_date)} → {toDDMMYYYY(trip.end_date)}
              </span>
              <span>•</span>
              <span className="text-slate-600 font-semibold">{trip.purpose}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-2xl font-black text-primary-dark font-mono">
              ₹ {formatToINR(trip.budget_inr)}
            </div>
            <div className="text-xs text-slate-400 font-medium">Total Approved Budget</div>
          </div>
        </div>

        {/* Dual Budget Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
            <span className="text-xs font-bold uppercase text-amber-900 block">
              Group Shared Budget (Handled by Coordinator)
            </span>
            <div className="text-xl font-bold font-mono text-primary-dark mt-1">
              ₹ {formatToINR(trip.group_budget_inr || 0)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Allocated for flights, hotel rooms, and team transport.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30">
            <span className="text-xs font-bold uppercase text-brand-blue block">
              Individual Per-Diem Allowance
            </span>
            <div className="text-xl font-bold font-mono text-primary-dark mt-1">
              ₹ {formatToINR(trip.individual_budget_inr || 0)}{' '}
              <span className="text-xs text-slate-500 font-normal">/ traveler</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              For meals, daily local commute, and incidental expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Travelers Roster */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-dark flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-blue" />
              Travelers Roster ({assignments.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned team members and coordinator role.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assign) => {
            const emp = Array.isArray(assign.employee)
              ? assign.employee[0]
              : assign.employee;
            if (!emp) return null;
            const isCoord = assign.role === 'coordinator' || trip.coordinator_id === emp.id;

            return (
              <div
                key={assign.id}
                className={`p-4 rounded-xl border transition flex items-center justify-between ${
                  isCoord
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-primary-dark">{emp.full_name}</h3>
                    {isCoord && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Coordinator
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {emp.employee_code} · {emp.designation || 'Staff'} · {emp.department || 'General'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ✉ {emp.email} · 📞 {emp.phone || '+91'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Verification & Compliance */}
      <div className="bg-white rounded-2xl p-8 shadow-card border border-slate-100 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-btn" />
            Travel Document Compliance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify uploaded employee documents (Passports, Visas, Tickets) before departure.
          </p>
        </div>

        {docsList.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No travel documents uploaded for this trip yet. Assigned employees upload documents through their Employee Portal.
          </div>
        ) : (
          <div className="space-y-3">
            {docsList.map((doc) => {
              const emp = Array.isArray(doc.employee) ? doc.employee[0] : doc.employee;

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-primary-dark px-2 py-0.5 rounded">
                        {doc.document_type}
                      </span>
                      <span className="text-sm font-semibold text-primary-dark">{doc.file_name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Traveler: <strong>{emp?.full_name}</strong> ({emp?.employee_code})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        doc.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status.toUpperCase()}
                    </span>
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
