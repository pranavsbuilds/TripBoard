import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'My Documents | TripBoard',
};

export default async function EmployeeDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: employeeData } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!employeeData) redirect('/login');
  const currentEmployeeId = employeeData.id;

  // Fetch upcoming trips for context
  const { data: tripData } = await supabase
    .from('trip_assignments')
    .select(`
      trip_id,
      trips (id, title, start_date, end_date)
    `)
    .eq('employee_id', currentEmployeeId);

  const upcomingTrips = (tripData || [])
    .map((ta) => ta.trips as any)
    .filter((t) => t && t.start_date && new Date(t.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const selectedTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  // Fetch documents for current employee
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('employee_id', currentEmployeeId);

  const docsList = documents || [];
  const requiredDocTypes = [
    { type: 'passport', label: 'Passport Copy', desc: 'Front and back pages.' },
    { type: 'visa', label: 'Travel Visa', desc: 'Valid visa for destination.' },
    { type: 'ticket', label: 'Flight Ticket', desc: 'Round-trip flight confirmation.' },
    { type: 'hotel', label: 'Hotel Booking', desc: 'Hotel reservation confirmation.' },
    { type: 'insurance', label: 'Travel Insurance', desc: 'Medical and travel coverage.' }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <Link href="/employee/dashboard" className="text-brand-blue text-sm font-medium hover:underline mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold text-primary-dark">My Travel Documents</h2>
          <p className="text-slate-500 mt-1">Upload and manage required documents for your upcoming trips.</p>
        </div>
      </div>

      {selectedTrip && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-brand-blue shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Selected Trip</p>
              <p className="font-bold text-primary-dark">{selectedTrip.title}</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-orange/10 text-status-orange text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-status-orange"></span>
              {docsList.filter(d => d.status === 'verified').length}/{requiredDocTypes.length} Verified
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {requiredDocTypes.map(docReq => {
          const uploadedDoc = docsList.find(d => d.document_type === docReq.type);
          const isVerified = uploadedDoc?.status === 'verified';
          const isPending = uploadedDoc?.status === 'pending';
          const isMissing = !uploadedDoc;

          return (
            <div key={docReq.type} className={`border rounded-xl p-5 shadow-sm transition-all ${
              isMissing ? 'bg-orange-50/50 border-orange-200 border-2' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                    isMissing ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-dark">{docReq.label}</h4>
                    <p className="text-sm text-slate-500">{docReq.desc}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 self-start md:self-center ml-16 md:ml-0">
                  {isVerified && (
                    <>
                      <span className="flex items-center gap-1.5 text-status-green font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </span>
                      <button className="text-brand-blue text-sm font-medium hover:underline">View File</button>
                    </>
                  )}
                  {isPending && (
                    <>
                      <span className="flex items-center gap-1.5 text-status-orange font-medium text-sm">
                        <AlertCircle className="w-4 h-4" /> Pending Review
                      </span>
                      <button className="text-brand-blue text-sm font-medium hover:underline">View File</button>
                    </>
                  )}
                  {isMissing && (
                    <span className="flex items-center gap-1.5 text-status-orange font-medium text-sm">
                      <AlertCircle className="w-4 h-4" /> Pending Upload
                    </span>
                  )}
                </div>
              </div>

              {isMissing && (
                <div className="mt-4 md:ml-16 border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:bg-orange-50 transition-colors">
                  <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-primary-dark mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 mb-3">PDF, JPG, or PNG (max. 10MB)</p>
                  <button className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-colors">
                    Select File
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
