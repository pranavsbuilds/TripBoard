'use client';

import React, { useState, useTransition } from 'react';
import {
  validateTravelDocument,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
} from '@/lib/validation';
import {
  uploadTripDocumentAction,
  getDocumentSignedUrlAction,
} from '@/app/employee/trips/actions';
import { Check, AlertCircle, FileText, Upload, RefreshCw, X } from 'lucide-react';

export interface TripRequirementItem {
  id: string;
  document_type: DocumentType;
  title: string;
  is_mandatory: boolean;
}

export interface UploadedDocItem {
  id: string;
  document_type: DocumentType;
  file_name: string;
  file_size_bytes: number | null;
  storage_path: string | null;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string | null;
  uploaded_at: string;
}

interface EmployeeTripVaultClientProps {
  tripId: string;
  tripDestination: string;
  requirements: TripRequirementItem[];
  uploadedDocs: UploadedDocItem[];
  travelerName: string;
}

export function EmployeeTripVaultClient({
  tripId,
  tripDestination,
  requirements,
  uploadedDocs: initialUploadedDocs,
  travelerName,
}: EmployeeTripVaultClientProps) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>(initialUploadedDocs);
  const [activeUploadType, setActiveUploadType] = useState<DocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    fileName: string;
    docTitle: string;
    signedUrl: string;
    isPdf: boolean;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const uploadedCount = requirements.filter((r) =>
    uploadedDocs.some((d) => d.document_type === r.document_type)
  ).length;

  const handleFileSelect = async (docType: DocumentType, file: File | null) => {
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Client-Side Validation (< 1 MB & MIME whitelist)
    const validationError = validateTravelDocument({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (validationError) {
      setErrorMessage(validationError.message);
      return;
    }

    // 2. Server Action Upload
    setActiveUploadType(docType);

    const formData = new FormData();
    formData.append('tripId', tripId);
    formData.append('documentType', docType);
    formData.append('file', file);

    const result = await uploadTripDocumentAction(formData);

    setActiveUploadType(null);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to upload document.');
      return;
    }

    setSuccessMessage(
      `Successfully uploaded ${DOCUMENT_TYPE_LABELS[docType] || docType} (${file.name}).`
    );

    // Update local state optimistically
    const existingIndex = uploadedDocs.findIndex((d) => d.document_type === docType);
    const newDocItem: UploadedDocItem = {
      id: result.documentId || `temp-${Date.now()}`,
      document_type: docType,
      file_name: file.name,
      file_size_bytes: file.size,
      storage_path: `trips/${tripId}/...`,
      status: 'pending',
      uploaded_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      const updated = [...uploadedDocs];
      updated[existingIndex] = newDocItem;
      setUploadedDocs(updated);
    } else {
      setUploadedDocs([...uploadedDocs, newDocItem]);
    }

    startTransition(() => {
      // Re-render
    });
  };

  const handleViewDocument = async (doc: UploadedDocItem, docTitle: string) => {
    if (!doc.storage_path) {
      setErrorMessage('Document path not found.');
      return;
    }

    setPreviewLoading(true);
    setErrorMessage(null);

    const result = await getDocumentSignedUrlAction(doc.storage_path);
    setPreviewLoading(false);

    if (!result.success || !result.signedUrl) {
      setErrorMessage(result.error || 'Could not load document preview.');
      return;
    }

    const isPdf =
      doc.file_name.toLowerCase().endsWith('.pdf') ||
      doc.storage_path.toLowerCase().endsWith('.pdf');

    setPreviewDoc({
      fileName: doc.file_name,
      docTitle,
      signedUrl: result.signedUrl,
      isPdf,
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Upload Failed:</span> {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Vault Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-card space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-primary-dark">
                Travel Documents for {tripDestination}
              </h2>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded border ${
                  uploadedCount >= requirements.length && requirements.length > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {uploadedCount}/{requirements.length} Uploaded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Only travel documents specifically required by your organization for this trip are listed below.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 whitespace-nowrap self-start sm:self-auto">
            Strict Limit: &lt; 1 MB (PDF, JPG, PNG, WebP)
          </span>
        </div>

        {/* Requirements List */}
        {requirements.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-primary-dark">No Document Requirements Configured</p>
            <p className="text-xs text-slate-500">
              The administrator has not specified any mandatory travel documents for this trip.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {requirements.map((req) => {
              const uploaded = uploadedDocs.find(
                (d) => d.document_type === req.document_type
              );
              const isUploading = activeUploadType === req.document_type;
              const title = req.title || DOCUMENT_TYPE_LABELS[req.document_type] || req.document_type;

              if (uploaded) {
                const fileSizeFormatted = uploaded.file_size_bytes
                  ? uploaded.file_size_bytes < 1024 * 1024
                    ? `${(uploaded.file_size_bytes / 1024).toFixed(0)} KB`
                    : `${(uploaded.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                  : '';

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                        ✓
                      </div>
                      <div>
                        <span className="text-sm font-bold text-primary-dark block">
                          {title}
                        </span>
                        <span className="text-xs text-slate-400 font-mono block">
                          {uploaded.file_name} {fileSizeFormatted ? `· ${fileSizeFormatted}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded font-mono ${
                          uploaded.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : uploaded.status === 'rejected'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {uploaded.status === 'verified'
                          ? 'Verified'
                          : uploaded.status === 'rejected'
                          ? 'Rejected'
                          : 'Uploaded'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleViewDocument(uploaded, title)}
                        disabled={previewLoading}
                        className="text-xs font-bold text-brand-blue hover:underline px-2 py-1 cursor-pointer disabled:opacity-50"
                      >
                        View File
                      </button>

                      <label className="text-xs font-semibold text-slate-700 hover:text-primary-dark bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5 transition">
                        <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                        <span>{isUploading ? 'Uploading...' : 'Replace'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          disabled={isUploading}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileSelect(req.document_type, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              }

              // Pending Upload State
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base flex-shrink-0">
                      !
                    </div>
                    <div>
                      <span className="text-sm font-bold text-amber-950 block">
                        {title}
                      </span>
                      <span className="text-xs text-amber-800 block">
                        Required for this trip · Limit &lt; 1 MB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded font-mono">
                      Pending Upload
                    </span>

                    <label className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-2 rounded-lg cursor-pointer shadow-sm flex items-center gap-1.5 transition">
                      <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
                      <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={isUploading}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileSelect(req.document_type, e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minimal In-App Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-primary-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-200">
            {/* Minimal Modal Header */}
            <div className="bg-primary-dark text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">
                    {previewDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 font-mono">
                    {travelerName} · {previewDoc.docTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewer Canvas */}
            <div className="bg-slate-100 p-4 flex items-center justify-center min-h-[420px] max-h-[70vh] overflow-auto">
              {previewDoc.isPdf ? (
                <iframe
                  src={`${previewDoc.signedUrl}#toolbar=0`}
                  title={previewDoc.fileName}
                  className="w-full h-[480px] rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.signedUrl}
                  alt={previewDoc.fileName}
                  className="max-h-[480px] max-w-full rounded-xl object-contain shadow-sm"
                />
              )}
            </div>

            {/* Minimal Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
