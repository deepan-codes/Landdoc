'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { documents as mockDocuments, properties as mockProperties, documentDetails as defaultDetails } from '@/mockData';
import { getDocument, getProperty, updateDocument, deleteDocument } from '@/lib/db';

export default function DocumentDetailPage({ params }) {
  const router = useRouter();
  const docId = params?.id;

  const [loadedDoc, setLoadedDoc] = useState(null);
  const [loadedProperty, setLoadedProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [copiedHash, setCopiedHash] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const blobUrlRef = useRef(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('Registered Sale Deed');
  const [editNumber, setEditNumber] = useState('');
  const [editSurvey, setEditSurvey] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editImportant, setEditImportant] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOcrExpanded, setIsOcrExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        if (!docId) {
          setIsLoading(false);
          return;
        }

        // 1. Try loading from IndexedDB
        const dbDoc = await getDocument(docId);
        if (isMounted && dbDoc) {
          setLoadedDoc(dbDoc);
          if (dbDoc.fileBlob) {
            try {
              const url = URL.createObjectURL(dbDoc.fileBlob);
              blobUrlRef.current = url;
              setBlobUrl(url);
            } catch (err) {
              console.warn('Could not create object URL for blob:', err);
            }
          }

          // Fetch associated property
          if (dbDoc.propertyId) {
            const prop = await getProperty(dbDoc.propertyId);
            if (isMounted) {
              setLoadedProperty(prop || mockProperties.find((p) => p.id === dbDoc.propertyId) || null);
            }
          }
        } else if (isMounted) {
          // Fallback to mock data
          const fallback = mockDocuments.find((d) => d.id === docId) || mockDocuments[0];
          setLoadedDoc(fallback);
          const prop = mockProperties.find((p) => p.id === fallback?.propertyId) || mockProperties[0];
          setLoadedProperty(prop);
        }
      } catch (err) {
        console.warn('Error loading document details:', err);
        if (isMounted) {
          const fallback = mockDocuments.find((d) => d.id === docId) || mockDocuments[0];
          setLoadedDoc(fallback);
          const prop = mockProperties.find((p) => p.id === fallback?.propertyId) || mockProperties[0];
          setLoadedProperty(prop);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [docId]);

  const baseDoc = loadedDoc || mockDocuments[0];
  const property = loadedProperty || mockProperties.find((p) => p.id === baseDoc?.propertyId) || mockProperties[0];

  // Merge with detailed mock data where fields are missing
  const doc = {
    ...defaultDetails,
    ...baseDoc,
    id: baseDoc?.id,
    name: baseDoc?.name || baseDoc?.title || defaultDetails.name,
    propertyName: baseDoc?.propertyName || property?.name || 'Property Portfolio',
    propertyId: baseDoc?.propertyId || property?.id,
    type: baseDoc?.documentType || baseDoc?.type || defaultDetails.type,
    fileSize: baseDoc?.fileSize || defaultDetails.fileSize,
    docNumber: baseDoc?.documentNumber || baseDoc?.docNumber || defaultDetails.docNumber,
    surveyNumber: baseDoc?.surveyNumber || property?.surveyNumber || defaultDetails.surveyNumber,
    notes: baseDoc?.notes || defaultDetails.notes,
    description: baseDoc?.description || baseDoc?.notes || defaultDetails.notes,
    rawText: baseDoc?.rawText || baseDoc?.ocrText || '',
    ocrText: baseDoc?.ocrText || baseDoc?.rawText || '',
  };

  const totalPages = doc.pages || 4;

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(doc.fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownload = () => {
    if (blobUrl && baseDoc?.fileBlob) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = baseDoc.fileName || `${doc.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('Exporting encrypted copy to local disk...');
    }
  };

  // Open Edit Modal with current values
  const handleOpenEdit = () => {
    setEditTitle(doc.name || '');
    setEditType(doc.type || 'Registered Sale Deed');
    setEditNumber(doc.docNumber || '');
    setEditSurvey(doc.surveyNumber || '');
    setEditNotes(doc.notes || '');
    setEditImportant(Boolean(doc.isImportant || doc.isKey));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Save Edit to IndexedDB
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Document title is required.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const updates = {
        name: editTitle.trim(),
        title: editTitle.trim(),
        documentType: editType,
        type: editType,
        documentNumber: editNumber.trim(),
        docNumber: editNumber.trim(),
        surveyNumber: editSurvey.trim(),
        notes: editNotes.trim(),
        description: editNotes.trim(),
        isImportant: Boolean(editImportant),
        isKey: Boolean(editImportant),
      };

      // Check if document exists in IndexedDB before updating
      if (baseDoc?.id) {
        try {
          await updateDocument(baseDoc.id, updates);
        } catch (dbErr) {
          console.warn('Note on DB update:', dbErr);
        }
      }

      setLoadedDoc((prev) => ({ ...prev, ...updates }));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update document:', err);
      setEditError(err.message || 'Failed to update document record.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Document from IndexedDB
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      if (baseDoc?.id) {
        try {
          await deleteDocument(baseDoc.id);
        } catch (dbErr) {
          console.warn('Note on DB deletion:', dbErr);
        }
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      // Redirect to property folio or documents ledger
      const redirectUrl = property?.id ? `/properties/${property.id}` : '/documents';
      router.push(redirectUrl);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert(err.message || 'Failed to delete document from vault.');
      setIsDeleting(false);
    }
  };

  const isImageBlob = baseDoc?.fileBlob && (baseDoc.fileBlob.type?.startsWith('image/') || baseDoc.fileName?.match(/\.(jpg|jpeg|png)$/i));
  const isPdfBlob = baseDoc?.fileBlob && (baseDoc.fileBlob.type === 'application/pdf' || baseDoc.fileName?.match(/\.pdf$/i));

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <span>←</span>
          <span>Back to Documents</span>
        </Link>
        <div className="flex items-center gap-2">
          {property && (
            <Link
              href={`/properties/${property.id}`}
              className="text-xs text-text-muted hover:text-text-primary transition-colors px-2.5 py-1 bg-white border border-border rounded-md"
            >
              Property: <span className="font-medium text-text-primary">{property.name}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-stone-100 text-text-primary rounded-full border border-border">
              {doc.type}
            </span>
            {(doc.isImportant || doc.isKey) && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#FDF6ED] text-[#8C5E28] rounded-full border border-[#F3E2CF]">
                ★ Key Document
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
            {doc.name}
          </h1>
          <p className="text-sm text-text-muted">
            {doc.docNumber ? `Ref: ${doc.docNumber}` : 'Local Vault Record'}
            {doc.surveyNumber ? ` • Survey No. ${doc.surveyNumber}` : ''}
            {property?.location ? ` • ${property.location}` : ''}
          </p>
        </div>

        {/* Action Buttons: Download, Edit, Delete, Add Another */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-button hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>{baseDoc?.fileBlob ? 'Download File' : 'Download PDF'}</span>
          </button>

          {/* Edit Record Button */}
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-button hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>Edit record</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-xs sm:text-sm font-medium text-red-600 rounded-button hover:bg-red-50 hover:border-red-300 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <span>Delete</span>
          </button>

          {/* Add Another Document */}
          <Link
            href={`/documents/add?propertyId=${property?.id || ''}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-dark text-white text-xs sm:text-sm font-medium rounded-button hover:bg-[#134e3b] transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add document</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Document Canvas Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-border rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs text-text-muted">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">Preview</span>
                <span>•</span>
                <span>{blobUrl ? 'Stored Vault Blob' : `Page ${activePage} of ${totalPages}`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                  className="px-2 py-1 bg-stone-50 border border-border rounded text-text-primary disabled:opacity-40 hover:bg-stone-100 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                  className="px-2 py-1 bg-stone-50 border border-border rounded text-text-primary disabled:opacity-40 hover:bg-stone-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Document Sheet Simulation or Image/PDF Render */}
            {isImageBlob && blobUrl ? (
              <div className="relative bg-stone-900 rounded-lg overflow-hidden border border-border flex items-center justify-center p-2 min-h-[440px]">
                <img
                  src={blobUrl}
                  alt={doc.name}
                  className="max-w-full max-h-[600px] object-contain rounded"
                />
              </div>
            ) : isPdfBlob && blobUrl ? (
              <div className="relative bg-[#FAF9F5] border border-border rounded-lg p-6 min-h-[440px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-20 bg-stone-100 border border-border rounded-lg flex flex-col items-center justify-center text-stone-600 shadow-xs">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-[10px] font-mono font-bold mt-1 uppercase">PDF</span>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-text-primary">{baseDoc.fileName || `${doc.name}.pdf`}</h3>
                  <p className="text-xs text-text-muted mt-1">{doc.fileSize} • Stored securely in IndexedDB</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-dark text-white text-xs font-semibold rounded-lg hover:bg-[#134e3b] transition-colors"
                >
                  Download & View PDF File
                </button>
              </div>
            ) : (
              <div className="relative bg-[#FAF9F5] border border-border rounded-lg p-6 sm:p-8 min-h-[440px] flex flex-col justify-between font-serif text-stone-800 shadow-inner">
                {/* Simulated Deed Stamp */}
                <div className="border-b-2 border-dashed border-stone-300 pb-4 mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-sans uppercase tracking-widest text-stone-500 font-semibold">
                      Official Revenue / Folio Record
                    </p>
                    <p className="text-sm font-bold text-stone-900 mt-0.5">
                      {doc.type}
                    </p>
                    <p className="text-xs text-stone-600 font-sans mt-0.5">
                      {doc.docNumber ? `Registered as ${doc.docNumber}` : 'Vault Archival Schedule'}
                    </p>
                  </div>
                  <div className="w-14 h-14 border border-stone-300 bg-stone-100 rounded flex flex-col items-center justify-center text-center p-1 font-sans">
                    <span className="text-[8px] font-bold uppercase text-stone-600">SEAL</span>
                    <span className="text-[10px] font-mono font-bold text-stone-800">VAULT</span>
                    <span className="text-[7px] text-stone-500">LOCAL</span>
                  </div>
                </div>

                {/* Document Schedule Content */}
                <div className="space-y-3 font-sans text-xs leading-relaxed text-stone-700">
                  <div className="font-serif font-bold text-base text-stone-900">
                    SCHEDULE OF PROPERTY
                  </div>
                  <p>
                    All that piece and parcel of land bearing <strong>Survey No. {doc.surveyNumber || 'N/A'}</strong>,
                    situated at {property?.location || 'Tamil Nadu'}, belonging to {property?.name || 'Vault Parcel'}.
                  </p>
                  {doc.notes && (
                    <div className="bg-white/80 p-3 rounded border border-stone-200 text-xs space-y-1">
                      <p><strong>Notes:</strong> {doc.notes}</p>
                    </div>
                  )}
                </div>

                {/* Document Footer Watermark */}
                <div className="pt-4 border-t border-stone-200 mt-6 flex items-center justify-between text-[11px] font-sans text-stone-500">
                  <span>Verified Local Vault Asset</span>
                  <span>Page {activePage} of {totalPages}</span>
                </div>
              </div>
            )}

            {/* Document Remarks / Notes */}
            {doc.notes && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                  Vault Notes
                </h4>
                <p className="text-xs sm:text-sm text-text-primary bg-stone-50 border border-border rounded-lg p-3 leading-relaxed">
                  {doc.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Folio Details & Physical Locker Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Registration & Legal Details */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-serif font-bold text-text-primary">
              Registration & Folio
            </h3>
            <div className="divide-y divide-border text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Document Number</span>
                <span className="font-medium text-text-primary">{doc.docNumber || 'N/A'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Document Type</span>
                <span className="font-medium text-text-primary">{doc.type}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Target Property</span>
                <span className="font-medium text-text-primary">{property?.name || 'Local Vault'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Survey Details</span>
                <span className="font-medium text-text-primary">{doc.surveyNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Vault Integrity */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
            <h3 className="text-base font-serif font-bold text-text-primary">
              Vault File Integrity
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">File Size</span>
                <span className="text-text-primary font-medium">{doc.fileSize}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">SHA-256 Hash</span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="font-mono text-[11px] text-green-dark hover:text-green-900 bg-stone-50 px-2 py-0.5 rounded border border-border"
                  title="Click to copy full checksum"
                >
                  {copiedHash ? 'Copied!' : doc.fileHash}
                </button>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed pt-1">
                Encrypted locally on this machine. No cloud uploads or unencrypted metadata transmissions.
              </p>
            </div>
          </div>

          {/* Recognized OCR Text Inspection */}
          {(doc.rawText || doc.ocrText) && (
            <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-serif font-bold text-text-primary">
                    Recognized Text (Local OCR)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOcrExpanded(!isOcrExpanded)}
                  className="text-xs text-green-dark hover:underline font-medium"
                >
                  {isOcrExpanded ? 'Hide' : 'Inspect'}
                </button>
              </div>
              {isOcrExpanded && (
                <pre className="bg-[#FAF9F5] border border-border rounded-lg p-3 text-xs font-mono text-stone-800 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                  {doc.rawText || doc.ocrText}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          EDIT RECORD MODAL
          ========================================================================= */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 my-8 text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-text-primary">Edit Document Record</h3>
                <p className="text-xs text-text-muted mt-0.5">Update metadata in your local vault index</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Document Title */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-text-primary">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-text-primary">
                  Document Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                >
                  <option value="Registered Sale Deed">Registered Sale Deed</option>
                  <option value="Patta / Chitta Extract">Patta / Chitta Extract</option>
                  <option value="Encumbrance Certificate (EC)">Encumbrance Certificate (EC)</option>
                  <option value="Property Tax Receipt">Property Tax Receipt</option>
                  <option value="Field Measurement Book (FMB)">Field Measurement Book (FMB)</option>
                  <option value="Settlement / Partition Deed">Settlement / Partition Deed</option>
                  <option value="Layout Approval / Order">Layout Approval / Order</option>
                  <option value="Power of Attorney">Power of Attorney</option>
                  <option value="Other Legal Document">Other Legal Document</option>
                </select>
              </div>

              {/* Document Number */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-text-primary">
                  Document Number <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  placeholder="e.g. Doc No. 412/1998"
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Survey Number */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-text-primary">
                  Survey Number / Sub-division <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={editSurvey}
                  onChange={(e) => setEditSurvey(e.target.value)}
                  placeholder="e.g. 25/1A"
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1.5 text-text-primary">
                  Archival Notes & Safekeeping <span className="text-text-muted font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Canara Bank Safe Locker #418"
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Key Document Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editImportant}
                    onChange={(e) => setEditImportant(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-green-dark focus:ring-green-dark"
                  />
                  <span className="font-semibold text-text-primary">Mark as Key Document in Portfolio</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-green-dark text-white font-semibold rounded-lg hover:bg-[#134e3b] transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-text-primary">Delete Document?</h3>
                <p className="text-xs text-text-muted mt-0.5">This action permanently removes the record from this device.</p>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-border rounded-lg p-3 text-xs space-y-1">
              <p><strong>Title:</strong> {doc.name}</p>
              <p className="text-text-muted"><strong>Property:</strong> {property?.name || 'Vault'}</p>
              {doc.surveyNumber && <p className="text-text-muted"><strong>Survey:</strong> {doc.surveyNumber}</p>}
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete this document and its encrypted binary file? This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-text-primary hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
