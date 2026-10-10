'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { properties } from '@/mockData';

function ReviewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyId = searchParams.get('propertyId') || '1';
  const fileNameParam = searchParams.get('fileName') || 'Document_Deed_Scan.pdf';
  const fileSizeParam = searchParams.get('fileSize') || '2.4 MB';

  const property = properties.find((p) => p.id === propertyId) || properties[0];

  // Editable / verified extracted fields
  const [docTitle, setDocTitle] = useState('Registered Sale Deed (Conveyance)');
  const [docCategory, setDocCategory] = useState('Sale Deed');
  const [docNumber, setDocNumber] = useState('Doc No. 412/1998');
  const [sroOffice, setSroOffice] = useState('SRO Poonamallee');
  const [regDate, setRegDate] = useState('1998-06-12');
  const [surveyDetail, setSurveyDetail] = useState(`Survey ${property.surveyNumber}, Sub-Div 25/1A`);
  const [extent, setExtent] = useState('1,200 sq.ft (1.1 Are)');
  const [consideration, setConsideration] = useState('₹1,85,000');
  const [physicalStorage, setPhysicalStorage] = useState('Canara Bank Safe Locker #418');
  const [isSaving, setIsSaving] = useState(false);

  // Restore session data if present
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('landdoc_pending_doc');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.fileName && !fileNameParam) {
          // prefill
        }
      }
    } catch (e) {
      // ignore
    }
  }, [fileNameParam]);

  const handleSaveToVault = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      try {
        sessionStorage.removeItem('landdoc_pending_doc');
      } catch (err) {}
      router.push(`/properties/${property.id}`);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-4" aria-label="Breadcrumb">
        <Link href="/documents" className="hover:text-text-primary transition-colors">
          Documents
        </Link>
        <span>›</span>
        <Link href={`/documents/add?propertyId=${property.id}`} className="hover:text-text-primary transition-colors">
          Add document
        </Link>
        <span>›</span>
        <span className="text-text-primary font-medium">Review details</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded uppercase">
            DOCUMENT FOLIO DETAILS
          </span>
          <span className="text-xs text-text-muted">
            Target: <strong className="text-text-primary">{property.name}</strong>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal tracking-tight">
          Review Extracted Details
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Verify the parcel schedule and registration metadata before filing into your vault.
        </p>
      </div>

      <form onSubmit={handleSaveToVault} className="space-y-6">
        {/* File Banner */}
        <div className="bg-white border border-border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 bg-[#F2EFEB] rounded-lg flex items-center justify-center flex-shrink-0 text-stone-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{fileNameParam}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {fileSizeParam} • Attached to {property.name}
              </p>
            </div>
          </div>

          <Link
            href={`/documents/add?propertyId=${property.id}`}
            className="text-xs font-medium text-text-primary hover:text-green-dark bg-stone-50 border border-border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Change file
          </Link>
        </div>

        {/* Extracted Details 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Document Classification & Registration */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h2 className="font-serif font-bold text-base text-text-primary border-b border-border pb-3">
              Registration Folio Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Record Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                >
                  <option value="Sale Deed">Registered Sale Deed</option>
                  <option value="Patta">Patta / Chitta Extract</option>
                  <option value="EC">Encumbrance Certificate (EC)</option>
                  <option value="Tax">Property Tax Receipt</option>
                  <option value="FMB">Field Measurement Book (FMB)</option>
                  <option value="Settlement">Settlement / Partition Deed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Document Number
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Sub-Registrar Office (SRO)
                </label>
                <input
                  type="text"
                  value={sroOffice}
                  onChange={(e) => setSroOffice(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Parcel Schedule & Custody */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h2 className="font-serif font-bold text-base text-text-primary border-b border-border pb-3">
              Schedule & Physical Safekeeping
            </h2>

            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Survey Number & Sub-Division Mentioned
              </label>
              <input
                type="text"
                value={surveyDetail}
                onChange={(e) => setSurveyDetail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Extent / Measurement
                </label>
                <input
                  type="text"
                  value={extent}
                  onChange={(e) => setExtent(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Consideration Value
                </label>
                <input
                  type="text"
                  value={consideration}
                  onChange={(e) => setConsideration(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark font-medium text-green-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Physical Original Storage Location
              </label>
              <input
                type="text"
                value={physicalStorage}
                onChange={(e) => setPhysicalStorage(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
              />
              <p className="text-[11px] text-text-muted mt-1">
                Records safe deposit locker or domestic fireproof storage box location.
              </p>
            </div>
          </div>
        </div>

        {/* Local Storage Privacy Note */}
        <div className="bg-[#FAF9F5] border border-border rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-xs text-text-muted leading-relaxed">
            Your document stays on this device. No unencrypted files or records are synchronized to external cloud databases.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            href={`/documents/add?propertyId=${property.id}`}
            className="w-full sm:w-auto px-5 py-2.5 text-center text-xs sm:text-sm font-medium text-text-primary bg-white border border-border rounded-lg hover:bg-stone-50 transition-colors"
          >
            ← Back to Change File
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-2.5 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] active:scale-[0.99] transition-all shadow-xs disabled:opacity-50"
          >
            {isSaving ? 'Filing into Vault...' : 'Save Document to Vault →'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ReviewDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading review details...</div>}>
      <ReviewDocumentContent />
    </Suspense>
  );
}
