'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { properties as mockProperties } from '@/mockData';
import { getProperty, addDocument } from '@/lib/db';
import { getPendingDraft, clearPendingDraft } from '@/lib/draft';

function ReviewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const propertyIdParam = searchParams.get('propertyId') || '1';
  const fileNameParam = searchParams.get('fileName') || 'Document_Deed_Scan.pdf';
  const fileSizeParam = searchParams.get('fileSize') || '2.4 MB';

  const [property, setProperty] = useState(() => {
    return mockProperties.find((p) => p.id === propertyIdParam) || mockProperties[0];
  });

  // Draft file & blob preview state
  const [draftData, setDraftData] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const blobUrlRef = useRef(null);

  // Form field states
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Registered Sale Deed');
  const [docNumber, setDocNumber] = useState('');
  const [sroOffice, setSroOffice] = useState('');
  const [regDate, setRegDate] = useState('');
  const [surveyDetail, setSurveyDetail] = useState('');
  const [extent, setExtent] = useState('');
  const [consideration, setConsideration] = useState('');
  const [physicalStorage, setPhysicalStorage] = useState('');
  const [notes, setNotes] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  // Extraction tracking flags
  const [extractedFlags, setExtractedFlags] = useState({});
  const [userEditedFlags, setUserEditedFlags] = useState({});
  const [rawText, setRawText] = useState('');
  const [isRawTextOpen, setIsRawTextOpen] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);

  // Zoom / viewer controls for original document
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Load target property from IndexedDB or fallback
  useEffect(() => {
    let isMounted = true;
    async function loadProp() {
      try {
        const found = await getProperty(propertyIdParam);
        if (isMounted && found) {
          setProperty(found);
        } else if (isMounted) {
          const fallback = mockProperties.find((p) => p.id === propertyIdParam) || mockProperties[0];
          setProperty(fallback);
        }
      } catch (err) {
        if (isMounted) {
          const fallback = mockProperties.find((p) => p.id === propertyIdParam) || mockProperties[0];
          setProperty(fallback);
        }
      }
    }
    loadProp();
    return () => {
      isMounted = false;
    };
  }, [propertyIdParam]);

  // 2. Load pending draft (with binary Blob, raw text & suggestions)
  useEffect(() => {
    let isMounted = true;

    async function loadDraft() {
      try {
        const draft = await getPendingDraft();
        if (!isMounted) return;

        if (draft) {
          setDraftData(draft);

          // Create object URL for original file preview
          if (draft.fileBlob) {
            const url = URL.createObjectURL(draft.fileBlob);
            blobUrlRef.current = url;
            setBlobUrl(url);
          } else if (draft.filePreview) {
            setBlobUrl(draft.filePreview);
          }

          const sugg = draft.suggestions || {};
          const flags = draft.extractedFlags || {};

          setDocTitle(draft.docTitle || sugg.title || 'Registered Sale Deed (Conveyance)');
          setDocCategory(draft.docCategory || sugg.documentType || 'Registered Sale Deed');
          setDocNumber(draft.docNumber || sugg.documentNumber || '');
          setSroOffice(sugg.sroOffice || '');
          setRegDate(sugg.regDate || '');
          setSurveyDetail(draft.surveyDetail || sugg.surveyNumber || '');
          setExtent(sugg.extent || '');
          setConsideration(sugg.consideration || '');
          setNotes(draft.notes || sugg.notes || '');
          setIsImportant(Boolean(draft.isImportant));
          setRawText(draft.rawText || '');
          setExtractedFlags(flags);
        } else {
          // Fallback initial values if opened directly
          setDocTitle('Registered Sale Deed (Conveyance)');
          setDocCategory('Registered Sale Deed');
          setDocNumber('Doc No. 412/1998');
          setSroOffice('SRO Poonamallee');
          setRegDate('1998-06-12');
          setSurveyDetail('Survey 25/1A');
          setExtent('1,200 sq.ft');
          setConsideration('₹1,85,000');
          setPhysicalStorage('Canara Bank Safe Locker #418');
        }
      } catch (err) {
        console.warn('Failed to load pending draft:', err);
      }
    }

    loadDraft();

    return () => {
      isMounted = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const markFieldEdited = (fieldName) => {
    setUserEditedFlags((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleSaveToVault = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const combinedNotes = [
        sroOffice ? `SRO: ${sroOffice}` : null,
        regDate ? `Reg Date: ${regDate}` : null,
        extent ? `Extent: ${extent}` : null,
        consideration ? `Consideration: ${consideration}` : null,
        physicalStorage ? `Safekeeping: ${physicalStorage}` : null,
        notes ? `Notes: ${notes}` : null,
      ].filter(Boolean).join(' • ');

      const fileName = draftData?.fileName || fileNameParam;
      const fileSize = draftData?.fileSize || fileSizeParam;
      const fileBlob = draftData?.fileBlob || null;
      const fileType = draftData?.fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      await addDocument({
        propertyId: String(property.id),
        propertyName: property.name,
        name: docTitle.trim(),
        title: docTitle.trim(),
        documentType: docCategory,
        type: docCategory,
        documentNumber: docNumber.trim(),
        surveyNumber: surveyDetail.trim() || property.surveyNumber || '',
        notes: combinedNotes,
        description: combinedNotes,
        isImportant: Boolean(isImportant),
        isKey: Boolean(isImportant),
        fileBlob: fileBlob, // Preserves original binary File/Blob
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        rawText: rawText || '',
        ocrText: rawText || '',
        extractedMetadata: draftData?.suggestions || null,
        dateAdded: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      });

      // Clear draft storage after saving successfully
      await clearPendingDraft();

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      router.push(`/properties/${property.id}`);
    } catch (err) {
      console.error('Failed to save document:', err);
      setErrorMsg(err.message || 'Failed to save document record.');
      setIsSaving(false);
    }
  };

  const isPdf = draftData?.fileType === 'application/pdf' || fileNameParam.toLowerCase().endsWith('.pdf');
  const isImage = !isPdf && blobUrl;

  const renderBadge = (fieldName) => {
    if (userEditedFlags[fieldName]) {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 border border-border rounded normal-case tracking-normal">
          User confirmed
        </span>
      );
    }
    if (extractedFlags[fieldName] || draftData?.suggestions?.[fieldName]) {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded normal-case tracking-normal">
          Extracted suggestion
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
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
        <span className="text-text-primary font-medium">Review & verify details</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded uppercase">
            DOCUMENT FOLIO VERIFICATION
          </span>
          <span className="text-xs text-text-muted">
            Target Property: <strong className="text-text-primary">{property.name}</strong>
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal tracking-tight">
          Review Extracted Details
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
          Verify suggested fields against the original deed on the left. OCR suggestions are not verified facts until you confirm them.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 mb-5 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSaveToVault} className="space-y-6">
        {/* Main Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Original Document Viewer (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-border rounded-xl p-4 shadow-xs space-y-3 sticky top-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="min-w-0 pr-2">
                  <h3 className="font-serif font-bold text-sm text-text-primary truncate">
                    Original Document
                  </h3>
                  <p className="text-[11px] text-text-muted truncate">
                    {draftData?.fileName || fileNameParam} ({draftData?.fileSize || fileSizeParam})
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {isImage && (
                    <>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-stone-50 text-text-primary"
                        title="Zoom out"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono text-text-muted px-1">{zoomLevel}%</span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                        className="px-2 py-1 text-xs border border-border rounded hover:bg-stone-50 text-text-primary"
                        title="Zoom in"
                      >
                        +
                      </button>
                    </>
                  )}
                  <Link
                    href={`/documents/add?propertyId=${property.id}`}
                    className="ml-1 text-[11px] text-green-dark hover:underline font-medium"
                  >
                    Change
                  </Link>
                </div>
              </div>

              {/* Viewer Window */}
              <div className="relative bg-stone-900 rounded-lg overflow-auto border border-border min-h-[380px] max-h-[560px] flex items-center justify-center p-2">
                {isImage ? (
                  <img
                    src={blobUrl}
                    alt="Original Deed"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="max-w-full transition-transform duration-200 rounded object-contain"
                  />
                ) : isPdf && blobUrl ? (
                  <iframe
                    src={blobUrl}
                    title="PDF Document Preview"
                    className="w-full h-[520px] rounded border-0 bg-white"
                  />
                ) : (
                  <div className="text-center p-6 text-stone-300 space-y-2">
                    <svg className="w-10 h-10 mx-auto text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-xs">Original document scan attached</p>
                    <p className="text-[11px] text-stone-400">{fileNameParam}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                <span>Check stamp numbers, schedule details, and signatures.</span>
                <span className="text-emerald-700 font-medium">100% Local</span>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Metadata Verification Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Column 1: Document Classification & Registration */}
            <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h2 className="font-serif font-bold text-base text-text-primary border-b border-border pb-3">
                Registration Folio Details
              </h2>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Document Title <span className="text-red-500">*</span>
                  </span>
                  {renderBadge('title')}
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => {
                    setDocTitle(e.target.value);
                    markFieldEdited('title');
                  }}
                  required
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Record Category</span>
                    {renderBadge('type')}
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => {
                      setDocCategory(e.target.value);
                      markFieldEdited('type');
                    }}
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

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Document Number</span>
                    {renderBadge('docNumber')}
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => {
                      setDocNumber(e.target.value);
                      markFieldEdited('docNumber');
                    }}
                    placeholder="e.g. Doc No. 412/1998"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Sub-Registrar Office</span>
                    {renderBadge('sroOffice')}
                  </label>
                  <input
                    type="text"
                    value={sroOffice}
                    onChange={(e) => {
                      setSroOffice(e.target.value);
                      markFieldEdited('sroOffice');
                    }}
                    placeholder="e.g. SRO Poonamallee"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Registration Date</span>
                    {renderBadge('regDate')}
                  </label>
                  <input
                    type="date"
                    value={regDate}
                    onChange={(e) => {
                      setRegDate(e.target.value);
                      markFieldEdited('regDate');
                    }}
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
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>Survey Number & Sub-Division</span>
                  {renderBadge('survey')}
                </label>
                <input
                  type="text"
                  value={surveyDetail}
                  onChange={(e) => {
                    setSurveyDetail(e.target.value);
                    markFieldEdited('survey');
                  }}
                  placeholder="e.g. 25/1A"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Extent / Measurement</span>
                    {renderBadge('extent')}
                  </label>
                  <input
                    type="text"
                    value={extent}
                    onChange={(e) => {
                      setExtent(e.target.value);
                      markFieldEdited('extent');
                    }}
                    placeholder="e.g. 1,200 sq.ft"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                    <span>Consideration Value</span>
                    {renderBadge('consideration')}
                  </label>
                  <input
                    type="text"
                    value={consideration}
                    onChange={(e) => {
                      setConsideration(e.target.value);
                      markFieldEdited('consideration');
                    }}
                    placeholder="e.g. ₹1,85,000"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark font-medium text-green-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Physical Storage Location / Safe Locker
                </label>
                <input
                  type="text"
                  value={physicalStorage}
                  onChange={(e) => setPhysicalStorage(e.target.value)}
                  placeholder="e.g. Canara Bank Safe Locker #418"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Key Document Toggle */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-green-dark focus:ring-green-dark"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-text-primary">Mark as Key Document</span>
                    <p className="text-text-muted text-[11px] mt-0.5">
                      Flags this record as a pivotal deed in the property portfolio.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Inspect Raw Extracted OCR Text Accordion */}
            {rawText && (
              <div className="bg-white border border-border rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="font-serif font-bold text-sm text-text-primary">
                      Inspect Raw OCR Text ({rawText.length} chars)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(rawText);
                        setCopiedRawText(true);
                        setTimeout(() => setCopiedRawText(false), 2000);
                      }}
                      className="text-xs text-green-dark hover:underline font-medium"
                    >
                      {copiedRawText ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRawTextOpen(!isRawTextOpen)}
                      className="text-xs text-text-muted hover:text-text-primary px-2 py-1 border border-border rounded"
                    >
                      {isRawTextOpen ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {isRawTextOpen && (
                  <pre className="bg-[#FAF9F5] border border-border rounded-lg p-3.5 text-xs font-mono text-stone-800 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                    {rawText}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
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
                {isSaving ? 'Filing into Vault...' : 'Confirm & Save Document to Vault →'}
              </button>
            </div>
          </div>
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
