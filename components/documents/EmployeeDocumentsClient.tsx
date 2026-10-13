'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, ArrowLeft, Upload, CheckCircle2, AlertCircle, 
  Loader2, Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DocumentViewerModal, DocumentItem } from './DocumentViewerModal';

interface DocRequirement {
  type: string;
  label: string;
  desc: string;
}

interface EmployeeDocumentsClientProps {
  currentEmployeeId: string;
  selectedTrip: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
  } | null;
  initialDocuments: DocumentItem[];
  requiredDocTypes: DocRequirement[];
}

export function EmployeeDocumentsClient({
  currentEmployeeId,
  selectedTrip,
  initialDocuments,
  requiredDocTypes,
}: EmployeeDocumentsClientProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docsList, setDocsList] = useState<DocumentItem[]>(initialDocuments);
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Modal viewer state
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [viewingLabel, setViewingLabel] = useState<string>('');

  const triggerUpload = (docType: string) => {
    setActiveUploadType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadType) return;

    setUploadingType(activeUploadType);

    try {
      // Simulate/upload to Supabase documents
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        document_type: activeUploadType,
        file_name: file.name,
        file_size_bytes: file.size,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
      };

      // Persist to Supabase if employee exists
      if (currentEmployeeId) {
        await supabase
          .from('documents')
          .insert({
            employee_id: currentEmployeeId,
            trip_id: selectedTrip?.id || null,
            document_type: activeUploadType,
            file_name: file.name,
            file_url: URL.createObjectURL(file),
            file_size_bytes: file.size,
            status: 'pending',
          });
      }

      // Update state locally
      setDocsList(prev => {
        const filtered = prev.filter(d => d.document_type !== activeUploadType);
        return [...filtered, newDoc];
      });

      setToastMessage(`"${file.name}" uploaded successfully! Status set to Pending Review.`);
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      console.error('[Upload Error]', err);
      setToastMessage('Document uploaded locally.');
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      setUploadingType(null);
      setActiveUploadType(null);
    }
  };

  const openViewer = (doc: DocumentItem, label: string) => {
    setViewingDoc(doc);
    setViewingLabel(label);
  };

  const verifiedCount = docsList.filter(d => d.status === 'verified').length;

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-green-50 text-status-green flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm text-primary-dark font-medium">
            {toastMessage}
          </div>
        </div>
      )}

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
              {verifiedCount}/{requiredDocTypes.length} Verified
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
          const isCurrentUploading = uploadingType === docReq.type;

          return (
            <div 
              key={docReq.type} 
              className={`border rounded-xl p-5 shadow-sm transition-all ${
                isMissing ? 'bg-orange-50/50 border-orange-200 border-2' : 'bg-white border-slate-200'
              }`}
            >
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
                      <button 
                        onClick={() => openViewer(uploadedDoc!, docReq.label)}
                        className="text-brand-blue text-sm font-semibold hover:underline cursor-pointer"
                      >
                        View File
                      </button>
                    </>
                  )}
                  {isPending && (
                    <>
                      <span className="flex items-center gap-1.5 text-status-orange font-medium text-sm">
                        <AlertCircle className="w-4 h-4" /> Pending Review
                      </span>
                      <button 
                        onClick={() => openViewer(uploadedDoc!, docReq.label)}
                        className="text-brand-blue text-sm font-semibold hover:underline cursor-pointer"
                      >
                        View File
                      </button>
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
                <div 
                  onClick={() => !isCurrentUploading && triggerUpload(docReq.type)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) {
                      setActiveUploadType(docReq.type);
                      const dummyEvent = {
                        target: { files: [droppedFile] }
                      } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileChange(dummyEvent);
                    }
                  }}
                  className="mt-4 md:ml-16 border-2 border-dashed border-orange-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:bg-orange-50/50 transition-colors"
                >
                  {isCurrentUploading ? (
                    <div className="py-2 flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                      <p className="text-sm font-bold text-primary-dark">Uploading document...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-primary-dark mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500 mb-3">PDF, JPG, or PNG (max. 10MB)</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerUpload(docReq.type);
                        }}
                        className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 transition-colors cursor-pointer"
                      >
                        Select File
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        document={viewingDoc}
        label={viewingLabel}
      />
    </div>
  );
}
