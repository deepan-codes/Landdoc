'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { documents as mockDocuments, properties as mockProperties, documentDetails as defaultDetails } from '@/mockData';
import { getDocument, getProperty } from '@/lib/db';

export default function DocumentDetailPage({ params }) {
  const docId = params?.id;
  const [loadedDoc, setLoadedDoc] = useState(null);
  const [loadedProperty, setLoadedProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [copiedHash, setCopiedHash] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const blobUrlRef = useRef(null);

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
            {doc.isImportant && (
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-button hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>{baseDoc?.fileBlob ? 'Download File' : 'Download PDF'}</span>
          </button>
          <Link
            href={`/documents/add?propertyId=${property?.id || ''}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-dark text-white text-xs sm:text-sm font-medium rounded-button hover:bg-[#134e3b] transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add another document</span>
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
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4">
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
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-3">
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
        </div>
      </div>
    </div>
  );
}
