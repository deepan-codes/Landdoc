'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { documents, properties, documentDetails as defaultDetails } from '@/mockData';

export default function DocumentDetailPage({ params }) {
  const docId = params.id;
  const baseDoc = documents.find((d) => d.id === docId) || documents[0];
  const property = properties.find((p) => p.id === baseDoc.propertyId) || properties[0];

  // Merge with detailed mock data if available
  const doc = {
    ...defaultDetails,
    id: baseDoc.id,
    name: baseDoc.name,
    propertyName: baseDoc.propertyName || property.name,
    propertyId: baseDoc.propertyId || property.id,
    type: baseDoc.type || defaultDetails.type,
    fileSize: baseDoc.fileSize || defaultDetails.fileSize,
    description: baseDoc.description || defaultDetails.notes,
  };

  const [activePage, setActivePage] = useState(1);
  const totalPages = doc.pages || 4;
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(doc.fileHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
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
          <Link
            href={`/properties/${property.id}`}
            className="text-xs text-text-muted hover:text-text-primary transition-colors px-2.5 py-1 bg-white border border-border rounded-md"
          >
            Property: <span className="font-medium text-text-primary">{property.name}</span>
          </Link>
        </div>
      </div>

      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-stone-100 text-text-primary rounded-full border border-border">
              {doc.type}
            </span>
            {/* <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {doc.originalStatus || 'Original Secured'}
            </span> */}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-text-primary">
            {doc.name}
          </h1>
          <p className="text-sm text-text-muted">
            {doc.docNumber || 'Doc Ref'} • Registered at {doc.registrationOffice} on {doc.registrationDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => alert('Exporting encrypted copy to local disk...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-button hover:bg-stone-50 transition-colors"
          >
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Download PDF</span>
          </button>
          <Link
            href={`/documents/add?edit=${doc.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-dark text-white text-xs sm:text-sm font-medium rounded-button hover:bg-[#134e3b] transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <span>Edit record</span>
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
                <span>Page {activePage} of {totalPages}</span>
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

            {/* Document Sheet Simulation */}
            <div className="relative bg-[#FAF9F5] border border-border rounded-lg p-6 sm:p-8 min-h-[440px] flex flex-col justify-between font-serif text-stone-800 shadow-inner">
              {/* Tamil Nadu Govt Stamp Simulation */}
              <div className="border-b-2 border-dashed border-stone-300 pb-4 mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-sans uppercase tracking-widest text-stone-500 font-semibold">
                    Government of Tamil Nadu • Registration Department
                  </p>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    Sub-Registrar Office, Poonamallee
                  </p>
                  <p className="text-xs text-stone-600 font-sans mt-0.5">
                    Document Registered as No. 412 of 1998 in Book 1
                  </p>
                </div>
                <div className="w-14 h-14 border border-stone-300 bg-stone-100 rounded flex flex-col items-center justify-center text-center p-1 font-sans">
                  <span className="text-[8px] font-bold uppercase text-stone-600">SEAL</span>
                  <span className="text-[10px] font-mono font-bold text-stone-800">TN-SRO</span>
                  <span className="text-[7px] text-stone-500">1998</span>
                </div>
              </div>

              {/* Document Schedule Content */}
              <div className="space-y-3 font-sans text-xs leading-relaxed text-stone-700">
                <div className="font-serif font-bold text-base text-stone-900">
                  SCHEDULE OF PROPERTY (SCHEDULE A)
                </div>
                <p>
                  All that piece and parcel of land bearing <strong>Survey No. {doc.surveyNumber || '25/1A'}</strong>,
                  situated at {property.location}, within the registration sub-district of Poonamallee,
                  comprising an extent of <strong>{doc.extent || '1,200 sq.ft'}</strong>.
                </p>
                <div className="bg-white/80 p-3 rounded border border-stone-200 text-xs space-y-1">
                  <p><strong>North by:</strong> 20 Feet Public Access Road</p>
                  <p><strong>South by:</strong> Plot No. 9 belonging to M. Raman</p>
                  <p><strong>East by:</strong> Survey No. 25/2 Remaining Land</p>
                  <p><strong>West by:</strong> Kamaraj Nagar Main Road</p>
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  Consideration paid in full: {doc.considerationValue}. Free from all prior encumbrances, charges, mortgage, or third-party claims.
                </p>
              </div>

              {/* Document Footer Watermark */}
              <div className="pt-4 border-t border-stone-200 mt-6 flex items-center justify-between text-[11px] font-sans text-stone-500">
                <span>Verified Local Vault Asset</span>
                <span>Page {activePage} of {totalPages}</span>
              </div>
            </div>

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
                <span className="font-medium text-text-primary">{doc.docNumber || '412/1998'}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Sub-Registrar (SRO)</span>
                <span className="font-medium text-text-primary">{doc.registrationOffice}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Registration Date</span>
                <span className="font-medium text-text-primary">{doc.registrationDate}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Consideration Value</span>
                <span className="font-semibold text-green-dark">{doc.considerationValue}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Extent / Measurement</span>
                <span className="font-medium text-text-primary">{doc.extent}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-text-muted">Survey Details</span>
                <span className="font-medium text-text-primary">{doc.surveyNumber}</span>
              </div>
            </div>
          </div>

          {/* Parties Involved */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-serif font-bold text-text-primary">
              Parties to Deed
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-stone-50 rounded-lg border border-border">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Vendor (Seller / Executant)
                </p>
                <p className="font-semibold text-text-primary mt-1">{doc.vendor?.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{doc.vendor?.address}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-lg border border-border">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Purchaser (Buyer / Claimant)
                </p>
                <p className="font-semibold text-text-primary mt-1">{doc.purchaser?.name}</p>
                <p className="text-xs text-text-muted mt-0.5">{doc.purchaser?.address}</p>
              </div>
            </div>
          </div>

          {/* Physical Security & Bank Locker Tracking */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-dark" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <h3 className="text-base font-serif font-bold text-text-primary">
                Physical Original Tracking
              </h3>
            </div>
            <p className="text-xs text-text-muted">
              Record where the physical paper document with ink signatures is locked.
            </p>
            <div className="bg-[#FAF9F5] border border-border rounded-lg p-3 text-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-text-muted">Locker / Box:</span>
                <span className="font-medium text-text-primary text-right">{doc.storageLocation}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Last Physical Audit:</span>
                <span className="font-medium text-text-primary">{doc.lastPhysicalAudit}</span>
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
