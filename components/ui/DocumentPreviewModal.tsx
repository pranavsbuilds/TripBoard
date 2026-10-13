'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  travelerName?: string;
  documentType?: string;
  status?: string;
  signedUrl: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  fileName,
  travelerName,
  documentType,
  status,
  signedUrl,
}: DocumentPreviewModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPdf =
    fileName.toLowerCase().endsWith('.pdf') ||
    signedUrl.toLowerCase().includes('.pdf');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#071D3A]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-200">
        {/* Minimal Modal Header */}
        <div className="bg-[#071D3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-sm font-bold text-white leading-none truncate max-w-md">
                {fileName}
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 font-mono">
                {travelerName ? `${travelerName} · ` : ''}
                {documentType || 'Travel Document'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono border ${
                  status.toLowerCase() === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : status.toLowerCase() === 'rejected'
                    ? 'bg-red-500/20 text-red-300 border-red-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {status.toUpperCase()}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimal Viewer Canvas */}
        <div className="bg-slate-100 p-4 flex items-center justify-center min-h-[420px] max-h-[70vh] overflow-auto">
          {isPdf ? (
            <iframe
              src={`${signedUrl}#toolbar=0`}
              title={fileName}
              className="w-full h-[500px] rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <img
              src={signedUrl}
              alt={fileName}
              className="max-h-[500px] max-w-full rounded-xl object-contain shadow-sm"
            />
          )}
        </div>

        {/* Minimal Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
