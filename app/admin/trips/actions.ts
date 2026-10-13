'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureAdminCompany } from '@/app/admin/employees/actions';

export interface CreateTripInput {
  destination: string;
  purpose: string;
  startDate: string; // ISO date string e.g. '2026-10-20'
  endDate: string;   // ISO date string e.g. '2026-10-27'
  groupBudget: number;
  individualBudget: number;
  totalBudget: number;
  travelerIds: string[];
  coordinatorId: string;
}

export interface CreateTripResult {
  success: boolean;
  tripId?: string;
  error?: string;
}

export async function createTripAction(input: CreateTripInput): Promise<CreateTripResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in.' };
  }

  // Ensure the admin has an active company workspace (auto-provisions if missing)
  const { companyId, error: compError } = await ensureAdminCompany();
  if (compError || !companyId) {
    return { success: false, error: compError || 'Could not identify your organization.' };
  }

  const title = `${input.destination.split(',')[0].trim()} ${input.purpose}`;
  const country = input.destination.includes(',')
    ? input.destination.split(',').pop()?.trim() || 'India'
    : 'India';

  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminClient = createAdminClient();
  } catch (clientErr) {
    console.warn('[createTripAction] Admin client init note:', clientErr);
  }

  const dbClient = adminClient || supabase;

  // 1. Insert trip
  const { data: trip, error: tripErr } = await dbClient
    .from('trips')
    .insert({
      company_id: companyId,
      title,
      destination: input.destination.trim(),
      country,
      purpose: input.purpose.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      budget_inr: input.totalBudget,
      group_budget_inr: input.groupBudget,
      individual_budget_inr: input.individualBudget,
      status: 'upcoming',
      coordinator_id: input.coordinatorId,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (tripErr) {
    console.error('[createTripAction] Trip insert failed:', tripErr.message, tripErr.details);
    return { success: false, error: tripErr.message || 'Failed to create trip record.' };
  }

  // 2. Insert trip_assignments — only columns that exist in schema.sql
  const assignments = input.travelerIds.map((empId) => ({
    trip_id: trip.id,
    employee_id: empId,
    is_coordinator: empId === input.coordinatorId,
  }));

  const { error: assignErr } = await dbClient.from('trip_assignments').insert(assignments);

  if (assignErr) {
    console.error('[createTripAction] Assignments insert failed:', assignErr.message, assignErr.details);
    // Rollback the trip so we don't leave an orphan record
    await dbClient.from('trips').delete().eq('id', trip.id);
    return { success: false, error: assignErr.message || 'Failed to assign travelers to trip.' };
  }

  return { success: true, tripId: trip.id };
}
