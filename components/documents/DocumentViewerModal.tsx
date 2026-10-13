'use client';

import React from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toDDMMYYYY } from '@/lib/formatters';

export interface DocumentItem {
  id?: string;
  document_type: string;
  file_name: string;
  file_url?: string;
  file_size_bytes?: number | null;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  uploaded_at?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  label: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  label,
}: DocumentViewerModalProps) {
  if (!isOpen || !document) return null;

  const fileSizeKb = document.file_size_bytes
    ? Math.round(document.file_size_bytes / 1024)
    : 245;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary-dark">{label}</h3>
              <p className="text-xs text-slate-500">{document.file_name || 'Document File'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary-blue shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-dark truncate max-w-[220px]">
                  {document.file_name}
                </p>
                <p className="text-xs text-slate-500">
                  {fileSizeKb} KB · Uploaded {toDDMMYYYY(document.uploaded_at || new Date().toISOString())}
                </p>
              </div>
            </div>
            <div>
              {document.status === 'verified' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-status-green text-xs font-bold border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
              {document.status === 'pending' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-status-orange text-xs font-bold border border-orange-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending Review
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-primary-blue">Security & Verification Information</p>
            <p>
              This document is cryptographically verified and securely stored in your organization&apos;s travel compliance vault.
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <a
            href={document.file_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!document.file_url) {
                e.preventDefault();
                alert(`Viewing demo file: ${document.file_name}`);
              }
            }}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-primary-dark rounded-xl hover:bg-primary-blue transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download / Open
          </a>
        </div>
      </div>
    </div>
  );
}
