'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  validateTravelDocument,
  DocumentType,
  DOCUMENT_TYPES,
} from '@/lib/validation';

export interface UploadDocumentResult {
  success: boolean;
  error?: string;
  documentId?: string;
}

export interface GetSignedUrlResult {
  success: boolean;
  signedUrl?: string;
  error?: string;
}

/**
 * Handles employee upload of a required travel document for a specific trip.
 * Validates strict < 1 MB file size and authorized MIME whitelist.
 */
export async function uploadTripDocumentAction(formData: FormData): Promise<UploadDocumentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in to upload documents.' };
  }

  const tripId = formData.get('tripId') as string;
  const documentType = formData.get('documentType') as DocumentType;
  const file = formData.get('file') as File | null;

  if (!tripId || !documentType || !file) {
    return { success: false, error: 'Missing required upload parameters.' };
  }

  if (!DOCUMENT_TYPES.includes(documentType)) {
    return { success: false, error: `Invalid document type: ${documentType}` };
  }

  // 1. Strict File Validation (< 1 MB ceiling & MIME whitelist)
  const validationError = validateTravelDocument({
    size: file.size,
    type: file.type,
    name: file.name,
  });

  if (validationError) {
    return { success: false, error: validationError.message };
  }

  // 2. Resolve employee record for current user
  const { data: employee } = await supabase
    .from('employees')
    .select('id, company_id')
    .eq('user_id', user.id)
    .single();

  if (!employee) {
    return { success: false, error: 'Employee directory profile not found.' };
  }

  // 3. Verify traveler assignment on this trip
  const { data: assignment } = await supabase
    .from('trip_assignments')
    .select('id')
    .eq('trip_id', tripId)
    .eq('employee_id', employee.id)
    .single();

  if (!assignment) {
    return { success: false, error: 'You are not assigned as a traveler on this trip.' };
  }

  // 4. Upload file buffer to private Supabase storage bucket
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (err: any) {
    return { success: false, error: err.message || 'Storage client initialization failed.' };
  }

  const fileExt = file.name.split('.').pop() || 'pdf';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const storagePath = `trips/${tripId}/employees/${employee.id}/${documentType}_${Date.now()}.${cleanExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await adminClient.storage
    .from('travel-documents')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('[uploadTripDocumentAction] Storage upload failed:', uploadError.message);
    return { success: false, error: uploadError.message || 'Failed to upload document file.' };
  }

  // 5. Upsert into public.documents table
  const { data: existingDoc } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('employee_id', employee.id)
    .eq('trip_id', tripId)
    .eq('document_type', documentType)
    .maybeSingle();

  let docId = existingDoc?.id;

  if (existingDoc) {
    // Update existing document record
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        file_name: file.name,
        file_url: storagePath,
        storage_path: storagePath,
        file_size_bytes: file.size,
        status: 'pending',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDoc.id);

    if (updateError) {
      console.error('[uploadTripDocumentAction] DB update failed:', updateError.message);
      return { success: false, error: updateError.message || 'Failed to update document record.' };
    }

    // Clean up older storage object if path changed
    if (existingDoc.storage_path && existingDoc.storage_path !== storagePath) {
      await adminClient.storage.from('travel-documents').remove([existingDoc.storage_path]);
    }
  } else {
    // Insert new document record
    const { data: newDoc, error: insertError } = await supabase
      .from('documents')
      .insert({
        employee_id: employee.id,
        trip_id: tripId,
        document_type: documentType,
        file_name: file.name,
        file_url: storagePath,
        storage_path: storagePath,
        file_size_bytes: file.size,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[uploadTripDocumentAction] DB insert failed:', insertError.message);
      return { success: false, error: insertError.message || 'Failed to create document record.' };
    }
    docId = newDoc.id;
  }

  revalidatePath(`/employee/trips/${tripId}`);
  revalidatePath('/employee/dashboard');

  return { success: true, documentId: docId };
}

/**
 * Generates an authenticated, short-lived (1 hour) signed URL from the private bucket.
 */
export async function getDocumentSignedUrlAction(storagePath: string): Promise<GetSignedUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized: Please log in.' };
  }

  if (!storagePath) {
    return { success: false, error: 'Missing document storage path.' };
  }

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from('travel-documents')
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || 'Failed to generate signed URL.' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Signed URL generation failed.' };
  }
}
