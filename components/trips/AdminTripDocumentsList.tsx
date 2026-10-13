'use client';

import React, { useState } from 'react';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '@/lib/validation';
import { getDocumentSignedUrlAction } from '@/app/employee/trips/actions';
import { DocumentPreviewModal } from '@/components/ui/DocumentPreviewModal';
import { FileText, Eye, AlertCircle, Loader2 } from 'lucide-react';

export interface AdminDocItem {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  storage_path?: string | null;
  status: string;
  rejection_reason?: string | null;
  uploaded_at: string;
  employee?: {
    full_name?: string;
    employee_code?: string;
  } | null;
}

interface AdminTripDocumentsListProps {
  documents: AdminDocItem[];
}

export function AdminTripDocumentsList({ documents }: AdminTripDocumentsListProps) {
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileName: string;
    travelerName?: string;
    documentType?: string;
    status?: string;
    signedUrl: string;
  } | null>(null);

  const handleView = async (doc: AdminDocItem) => {
    const path = doc.storage_path || doc.file_url;
    if (!path) {
      setErrorMessage('No storage path found for this document.');
      return;
    }

    setErrorMessage(null);
    setLoadingDocId(doc.id);

    const result = await getDocumentSignedUrlAction(path);
    setLoadingDocId(null);

    if (!result.success || !result.signedUrl) {
      setErrorMessage(result.error || 'Failed to generate signed document URL.');
      return;
    }

    const typeLabel =
      DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] || doc.document_type;

    setPreviewModal({
      isOpen: true,
      fileName: doc.file_name,
      travelerName: doc.employee?.full_name,
      documentType: typeLabel,
      status: doc.status,
      signedUrl: result.signedUrl,
    });
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
          No travel documents uploaded for this trip yet. Assigned employees upload documents through their Employee Portal.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const isLoading = loadingDocId === doc.id;
            const typeLabel =
              DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] || doc.document_type;

            return (
              <div
                key={doc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-brand-blue flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-primary-dark px-2 py-0.5 rounded">
                        {typeLabel}
                      </span>
                      <span className="text-sm font-semibold text-primary-dark truncate max-w-xs md:max-w-md">
                        {doc.file_name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      Traveler: <strong>{doc.employee?.full_name || 'Assigned Employee'}</strong>{' '}
                      {doc.employee?.employee_code ? `(${doc.employee.employee_code})` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-full font-mono ${
                      doc.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status.toUpperCase()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleView(doc)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-[#F8FCFF] hover:bg-sky-50 border border-[#D5E5F2] hover:border-brand-blue text-brand-blue text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoading ? 'Loading...' : 'View Document'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal Document Preview Modal */}
      {previewModal && (
        <DocumentPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal(null)}
          fileName={previewModal.fileName}
          travelerName={previewModal.travelerName}
          documentType={previewModal.documentType}
          status={previewModal.status}
          signedUrl={previewModal.signedUrl}
        />
      )}
    </div>
  );
}
