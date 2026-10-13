import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmployeeDocumentsClient } from '@/components/documents/EmployeeDocumentsClient';

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
    <EmployeeDocumentsClient
      currentEmployeeId={currentEmployeeId}
      selectedTrip={selectedTrip}
      initialDocuments={docsList}
      requiredDocTypes={requiredDocTypes}
    />
  );
}
