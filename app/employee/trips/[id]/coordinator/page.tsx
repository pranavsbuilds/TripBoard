import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoordinatorHubClient } from '@/components/coordinator/CoordinatorHubClient';

export const metadata = {
  title: 'Coordinator Hub | TripBoard',
};

export default async function CoordinatorHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  // Check if coordinator and fetch trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('coordinator_id', currentEmployeeId)
    .single();

  if (!trip) {
    // User is not coordinator for this trip or trip doesn't exist
    redirect('/employee/dashboard');
  }

  // Fetch all travelers for this trip
  const { data: assignments } = await supabase
    .from('trip_assignments')
    .select(`
      employee_id,
      employees (id, full_name, user_id)
    `)
    .eq('trip_id', trip.id);

  const travelers = assignments?.map(a => a.employees as any).filter(Boolean) || [];

  // Fetch document statuses for these travelers (only for this trip)
  const { data: allDocs } = await supabase
    .from('documents')
    .select('employee_id, status')
    .eq('trip_id', trip.id);

  // Group docs by employee
  const travelerDocs = travelers.map(t => {
    const tDocs = allDocs?.filter(d => d.employee_id === t.id) || [];
    const verified = tDocs.filter(d => d.status === 'verified').length;
    const total = 5; 
    return {
      id: t.id,
      full_name: t.full_name || 'Traveler',
      initials: (t.full_name || 'Traveler').split(' ').filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'TR',
      isMe: t.id === currentEmployeeId,
      docsVerified: verified,
      docsTotal: total,
      status: (verified === total ? 'ready' : 'pending') as 'ready' | 'pending'
    };
  });

  return (
    <CoordinatorHubClient
      trip={trip}
      travelers={travelers}
      initialTravelerDocs={travelerDocs}
    />
  );
}
