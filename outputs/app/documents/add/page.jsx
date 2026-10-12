'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { properties as mockProperties } from '@/mockData';
import { getAllProperties, getProperty, addDocument } from '@/lib/db';
import { extractDocumentText, cancelOcr } from '@/lib/ocr';
import { savePendingDraft } from '@/lib/draft';

function AddDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propIdParam = searchParams ? searchParams.get('propertyId') : null;

  // Property state
  const [propertiesList, setPropertiesList] = useState(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);

  // File state & validation
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const previewUrlRef = useRef(null);

  // Document metadata fields
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Registered Sale Deed');
  const [docNumber, setDocNumber] = useState('');
  const [surveyNumber, setSurveyNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  // Local OCR State
  const [ocrLanguage, setOcrLanguage] = useState('eng'); // 'eng', 'eng+tam', 'tam'
  const [autoExtract, setAutoExtract] = useState(true);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ percent: 0, message: '', stage: '' });
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [isRawTextExpanded, setIsRawTextExpanded] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);
  const [extractedFieldFlags, setExtractedFieldFlags] = useState({});
  const [isNavigatingReview, setIsNavigatingReview] = useState(false);

  // Submission & feedback state
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const scanParam = searchParams ? searchParams.get('scan') : null;

  // Load properties from IndexedDB and preselect from query parameter
  useEffect(() => {
    let isMounted = true;

    async function loadProperties() {
      try {
        const stored = await getAllProperties();
        if (!isMounted) return;

        // Combine stored properties with mock properties (deduplicating by ID)
        const merged = [...(stored || [])];
        for (const p of mockProperties) {
          if (!merged.some((m) => m.id === p.id)) {
            merged.push(p);
          }
        }
        setPropertiesList(merged);

        if (propIdParam) {
          // Preselect requested property
          const match = merged.find((p) => p.id === propIdParam);
          if (match) {
            setSelectedProperty(match);
            const initialSurvey = match.surveyNumber || (match.surveyNumbers && match.surveyNumbers[0]) || '';
            setSurveyNumber((prev) => prev || initialSurvey);
          } else {
            // Try fetching directly if not in list
            const fetched = await getProperty(propIdParam);
            if (isMounted && fetched) {
              setSelectedProperty(fetched);
              const initialSurvey = fetched.surveyNumber || (fetched.surveyNumbers && fetched.surveyNumbers[0]) || '';
              setSurveyNumber((prev) => prev || initialSurvey);
            }
          }
        } else if (merged.length > 0) {
          setSelectedProperty((prev) => prev || merged[0]);
          const initialSurvey = merged[0].surveyNumber || (merged[0].surveyNumbers && merged[0].surveyNumbers[0]) || '';
          setSurveyNumber((prev) => prev || initialSurvey);
        }
      } catch (err) {
        console.warn('Failed to load properties from IndexedDB:', err);
        if (isMounted && propIdParam) {
          const match = mockProperties.find((p) => p.id === propIdParam);
          if (match) setSelectedProperty(match);
        }
      }
    }

    loadProperties();
    return () => {
      isMounted = false;
    };
  }, [propIdParam]);

  // Auto-start camera if scan query param is present
  useEffect(() => {
    if (scanParam === 'camera' || scanParam === 'true' || scanParam === '1') {
      handleStartCamera();
    }
  }, [scanParam]);

  // Clean up camera stream and object URLs on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // Update survey number when switching properties if field was blank or matched previous property
  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    setIsPropertyMenuOpen(false);
    if (prop) {
      const propSurvey = prop.surveyNumber || (prop.surveyNumbers && prop.surveyNumbers[0]) || '';
      if (!surveyNumber || propertiesList.some((p) => p.surveyNumber === surveyNumber)) {
        setSurveyNumber(propSurvey);
      }
    }
  };

  // Validate and process selected file
  const handleProcessFile = (file) => {
    setFileError(null);
    setFormError(null);

    if (!file) return;

    // Validate size (max 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError('File size exceeds the 25 MB limit. Please select a smaller document.');
      return;
    }

    // Validate type (PDF, JPG, JPEG, PNG)
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setFileError('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    // Revoke previous preview URL if any
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    // Formatted size
    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setSelectedFile({
      name: file.name,
      size: sizeFormatted,
      rawSize: file.size,
      type: file.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg'),
    });
    setRawFile(file);

    // Auto-suggest document name if empty
    if (!docName.trim()) {
      const baseName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .trim();
      if (baseName) {
        setDocName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }
    }

    // Auto-suggest document category if filename has clear indicators
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('patta') || lowerName.includes('chitta')) {
      setDocType('Patta / Chitta Extract');
    } else if (lowerName.includes('encumbrance') || lowerName.includes('ec')) {
      setDocType('Encumbrance Certificate (EC)');
    } else if (lowerName.includes('tax') || lowerName.includes('kist')) {
      setDocType('Property Tax Receipt');
    } else if (lowerName.includes('fmb') || lowerName.includes('sketch')) {
      setDocType('Field Measurement Book (FMB)');
    } else if (lowerName.includes('sale') || lowerName.includes('deed')) {
      setDocType('Registered Sale Deed');
    } else if (lowerName.includes('layout') || lowerName.includes('plan')) {
      setDocType('Layout Approval / Order');
    }

    // Create thumbnail preview for images
    if (file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(extension)) {
      try {
        const objectUrl = URL.createObjectURL(file);
        previewUrlRef.current = objectUrl;
        setFilePreview(objectUrl);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFilePreview(null);
    }

    // Auto-trigger OCR extraction upon file selection if enabled
    if (autoExtract) {
      setTimeout(() => {
        handleRunOcr(file);
      }, 50);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Camera capture functionality
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      cameraInputRef.current?.click();
    }
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob],
          `Document_Scan_${new Date().toISOString().slice(0, 10)}.jpg`,
          { type: 'image/jpeg' }
        );
        handleProcessFile(file);
      }
      handleStopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleStopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleRemoveFile = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setRawFile(null);
    setFilePreview(null);
    setOcrResult(null);
    setOcrError(null);
    setIsOcrRunning(false);
    setExtractedFieldFlags({});
    setFormError(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Run local OCR on the currently selected document file
  const handleRunOcr = async () => {
    if (!rawFile) {
      setFileError('Please select or scan a document file first.');
      return;
    }

    setIsOcrRunning(true);
    setOcrError(null);
    setOcrProgress({ percent: 5, message: 'Initializing local OCR engine...', stage: 'start' });

    try {
      const result = await extractDocumentText(rawFile, {
        language: ocrLanguage,
        onProgress: (prog) => {
          setOcrProgress({
            percent: prog.percent || 0,
            message: prog.message || 'Extracting...',
            stage: prog.stage || 'running',
          });
        },
      });

      if (result.cancelled) {
        setIsOcrRunning(false);
        return;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to extract text from document.');
      }

      setOcrResult(result);

      // Pre-fill fields with suggestions
      const suggestions = result.suggestions || {};
      const newFlags = {};

      if (suggestions.title) {
        setDocName(suggestions.title);
        newFlags.title = true;
      }
      if (suggestions.documentType) {
        setDocType(suggestions.documentType);
        newFlags.type = true;
      }
      if (suggestions.documentNumber) {
        setDocNumber(suggestions.documentNumber);
        newFlags.docNumber = true;
      }
      if (suggestions.surveyNumber) {
        setSurveyNumber(suggestions.surveyNumber);
        newFlags.survey = true;
      }
      if (suggestions.notes) {
        setNotes((prev) => (prev ? `${prev} • ${suggestions.notes}` : suggestions.notes));
        newFlags.notes = true;
      }

      setExtractedFieldFlags(newFlags);
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'Failed to extract text using local OCR.');
    } finally {
      setIsOcrRunning(false);
    }
  };

  // Cancel running OCR worker
  const handleCancelOcr = async () => {
    await cancelOcr();
    setIsOcrRunning(false);
    setOcrProgress({ percent: 0, message: 'Text extraction was cancelled.', stage: 'cancelled' });
  };

  // Navigate to side-by-side Review page with pending draft
  const handleProceedToReview = async () => {
    if (!selectedProperty) {
      setFormError('Please select a target property before proceeding.');
      return;
    }
    if (!rawFile || !selectedFile) {
      setFileError('Please select a file to review.');
      return;
    }

    setIsNavigatingReview(true);
    try {
      await savePendingDraft({
        propertyId: String(selectedProperty.id),
        propertyName: selectedProperty.name,
        fileBlob: rawFile,
        fileName: rawFile.name || selectedFile.name,
        fileSize: selectedFile.size,
        fileType: rawFile.type || selectedFile.type,
        filePreview: filePreview,
        docTitle: docName,
        docCategory: docType,
        docNumber: docNumber,
        surveyDetail: surveyNumber,
        notes: notes,
        isImportant: isImportant,
        rawText: ocrResult?.rawText || '',
        ocrText: ocrResult?.rawText || '',
        suggestions: ocrResult?.suggestions || null,
        extractedFlags: extractedFieldFlags,
      });

      router.push(
        `/documents/review?propertyId=${selectedProperty.id}&fileName=${encodeURIComponent(
          selectedFile.name
        )}&fileSize=${encodeURIComponent(selectedFile.size)}`
      );
    } catch (err) {
      console.error('Failed to prepare review draft:', err);
      setIsNavigatingReview(false);
      setFormError('Unable to open review page. You can save directly using the button below.');
    }
  };

  // Save document to IndexedDB
  const handleSaveDocument = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);
    setFileError(null);

    // 1. Validate file
    if (!selectedFile || !rawFile) {
      setFileError('Please select or scan a document file before saving.');
      return;
    }

    // 2. Validate property
    if (!selectedProperty) {
      setFormError('Please select a target property for this document.');
      return;
    }

    // 3. Validate required fields
    if (!docName.trim()) {
      setFormError('Please enter a document title or name.');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const newDocRecord = {
        propertyId: String(selectedProperty.id),
        propertyName: selectedProperty.name,
        name: docName.trim(),
        title: docName.trim(),
        documentType: docType,
        type: docType,
        documentNumber: docNumber.trim(),
        surveyNumber: surveyNumber.trim() || selectedProperty.surveyNumber || '',
        notes: notes.trim(),
        description: notes.trim(),
        isImportant: Boolean(isImportant),
        isKey: Boolean(isImportant),
        fileBlob: rawFile, // Binary Blob / File preserved in IndexedDB
        fileName: rawFile.name || selectedFile.name,
        fileSize: selectedFile.size,
        fileType: rawFile.type || selectedFile.type,
        rawText: ocrResult?.rawText || '',
        ocrText: ocrResult?.rawText || '',
        extractedMetadata: ocrResult?.suggestions || null,
        dateAdded: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      await addDocument(newDocRecord);

      // Clean up preview object URL
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setSaveSuccess(true);

      // Smooth navigation after showing success state
      setTimeout(() => {
        router.push(`/properties/${selectedProperty.id}`);
      }, 700);
    } catch (err) {
      console.error('Failed to save document to IndexedDB:', err);
      setFormError(err.message || 'Failed to save document to vault. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-4" aria-label="Breadcrumb">
        <Link href="/documents" className="hover:text-text-primary transition-colors">
          Documents
        </Link>
        <span>›</span>
        <span className="text-text-primary font-medium">Add document</span>
      </nav>

      {/* 2. Heading */}
      <h1 className="text-3xl sm:text-4xl font-serif text-text-primary font-normal tracking-tight mb-2">
        {selectedProperty ? `Add a document to ${selectedProperty.name}` : 'Add a document'}
      </h1>
      <p className="text-xs sm:text-sm text-text-muted mb-6 leading-relaxed">
        File an archival deed, revenue extract, or official receipt into your encrypted local vault.
      </p>

      {/* 3. Property Selection Banner Card */}
      <div className={`bg-white border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs mb-6 relative transition-colors ${!selectedProperty ? 'border-amber-300/80 bg-amber-50/20' : 'border-border'}`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 bg-[#F2EFEB] rounded-lg flex items-center justify-center flex-shrink-0 text-text-primary">
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-text-primary text-sm sm:text-base leading-tight truncate">
              {selectedProperty ? selectedProperty.name : 'Select a target property'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {selectedProperty
                ? `Survey No. ${selectedProperty.surveyNumber || selectedProperty.surveyNumbers?.[0] || 'N/A'} • ${selectedProperty.location}`
                : 'Choose which property this document belongs to before continuing'}
            </p>
          </div>
        </div>

        {/* Change Property Dropdown Trigger */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsPropertyMenuOpen(!isPropertyMenuOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap border ${
              !selectedProperty
                ? 'bg-green-dark text-white border-green-dark hover:bg-[#134e3b]'
                : 'text-text-primary hover:text-green-dark bg-stone-50 hover:bg-stone-100 border-border'
            }`}
          >
            <span>{selectedProperty ? 'Change property' : 'Select property'}</span>
            <span className="text-xs">⌵</span>
          </button>

          {/* Property Dropdown Menu */}
          {isPropertyMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-border rounded-xl shadow-lg z-30 py-2 divide-y divide-border max-h-80 overflow-y-auto">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Select Target Property
              </div>
              {propertiesList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProperty(p)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between ${
                    selectedProperty?.id === p.id
                      ? 'bg-[#FAF7F2] font-semibold text-green-dark'
                      : 'hover:bg-stone-50 text-text-primary'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-sm text-text-primary truncate">{p.name}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 truncate">
                      {p.surveyNumber ? `Survey #${p.surveyNumber}` : p.location}
                    </p>
                  </div>
                  {selectedProperty?.id === p.id && (
                    <span className="text-green-dark font-bold text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-4 mb-6 text-sm flex items-center gap-3 shadow-xs animate-in fade-in">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Document saved successfully!</p>
            <p className="text-xs text-emerald-800 mt-0.5">Stored as an encrypted binary blob in your local vault. Redirecting...</p>
          </div>
        </div>
      )}

      {/* Error Alert Message */}
      {(fileError || formError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 mb-5 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{fileError || formError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFileError(null);
              setFormError(null);
            }}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Camera Live Viewfinder Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-2xl max-w-lg w-full overflow-hidden border border-stone-700 shadow-2xl space-y-4 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CAMERA SCANNER READY
              </span>
              <button
                type="button"
                onClick={handleStopCamera}
                className="text-stone-400 hover:text-white p-1 text-sm"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-6 border-2 border-dashed border-emerald-400/70 rounded-lg pointer-events-none" />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-2 text-xs text-stone-300 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSnapPhoto}
                className="w-14 h-14 rounded-full bg-white border-4 border-stone-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title="Capture Document"
              >
                <div className="w-10 h-10 rounded-full bg-green-dark" />
              </button>
              <div className="w-12" />
            </div>
          </div>
        </div>
      )}

      {/* 4. Selected File & Metadata Entry Form */}
      {selectedFile ? (
        <form onSubmit={handleSaveDocument} className="space-y-6">
          {/* File Card with Inspect & Replace */}
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="font-serif font-bold text-base text-text-primary">
                  Attached File
                </h2>
              </div>
              <span className="text-xs text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Ready to Save
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF9F5] border border-border rounded-xl">
              <div className="flex items-center gap-3.5 min-w-0">
                {filePreview ? (
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="group relative w-14 h-16 rounded-lg overflow-hidden bg-stone-200 border border-border flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-dark"
                    title="Click to inspect full image"
                  >
                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                      </svg>
                    </div>
                  </button>
                ) : (
                  <div className="w-14 h-16 rounded-lg bg-[#EFECE6] border border-border flex flex-col items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-[9px] font-bold font-mono text-stone-600 uppercase mt-0.5">
                      PDF
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold text-text-primary text-sm truncate">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">
                      {selectedFile.size} • Attached to {selectedProperty?.name}
                    </span>
                    {filePreview && (
                      <button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="text-[11px] text-green-dark hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Inspect preview</span>
                        <span>↗</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replace / Remove Actions */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <label className="text-xs font-medium text-text-primary hover:text-green-dark bg-white border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:bg-stone-50 transition-colors">
                  Replace
                  <input
                    type="file"
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs font-medium text-red-600 hover:text-red-800 bg-white border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {/* Full-screen Document Image Lightbox Modal */}
          {isPreviewModalOpen && filePreview && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              <div
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-[#FAF9F5]">
                  <div className="min-w-0 pr-3">
                    <h3 className="font-semibold text-sm text-text-primary truncate">
                      {selectedFile?.name || 'Document Scan Preview'}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {selectedFile?.size} • Document Schedule Inspection
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-stone-200/60 transition-colors text-sm font-bold"
                    title="Close preview"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-900/95">
                  <img
                    src={filePreview}
                    alt="Document Full Preview"
                    className="max-w-full max-h-[72vh] object-contain rounded shadow-lg"
                  />
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-white text-xs">
                  <span className="text-text-muted">Check text legibility, seals, and survey numbers.</span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="px-4 py-1.5 bg-green-dark text-white rounded-lg font-medium hover:bg-[#134e3b] transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Local Optical Character Recognition (OCR) Panel */}
          <div className="bg-[#FAF9F5] border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5m8.25 0h4.5c.621 0 1.125.504 1.125 1.125v4.5m0 8.25v4.5c0 .621-.504 1.125-1.125 1.125h-4.5m-8.25 0h-4.5A1.125 1.125 0 013.75 19.5v-4.5M9 12h6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-text-primary">
                    Local Document OCR & Field Extraction
                  </h3>
                  <p className="text-xs text-text-muted">
                    Extract text and property details entirely on this device using in-browser recognition.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded uppercase">
                  100% On-Device
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-stone-100 text-stone-700 border border-border rounded uppercase">
                  Zero Cloud Upload
                </span>
              </div>
            </div>

            {/* Language Selection & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-text-primary whitespace-nowrap">
                  Document Language:
                </label>
                <select
                  value={ocrLanguage}
                  onChange={(e) => setOcrLanguage(e.target.value)}
                  disabled={isOcrRunning}
                  className="px-2.5 py-1.5 text-xs bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:border-green-dark"
                >
                  <option value="eng">English (Fastest / Default)</option>
                  <option value="eng+tam">English + Tamil (Bilingual Deeds)</option>
                  <option value="tam">Tamil (தமிழ் ஆவணங்கள்)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {isOcrRunning ? (
                  <button
                    type="button"
                    onClick={handleCancelOcr}
                    className="px-3.5 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancel OCR
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    className="px-4 py-2 bg-green-dark hover:bg-[#134e3b] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    <span>{ocrResult ? 'Re-extract Text' : 'Extract Text & Details'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar during active OCR */}
            {isOcrRunning && (
              <div className="bg-white border border-border rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {ocrProgress.message || 'Extracting text...'}
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">{ocrProgress.percent}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-border/50">
                  <div
                    className="bg-green-dark h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(5, ocrProgress.percent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Processing locally on your device. Canvases and workers are created and released cleanly.
                </p>
              </div>
            )}

            {/* OCR Error Box */}
            {ocrError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="leading-relaxed">{ocrError}</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-medium rounded transition-colors text-xs"
                  >
                    Retry OCR
                  </button>
                  <span className="text-[11px] text-amber-800">
                    You can also proceed with manual entry in the fields below.
                  </span>
                </div>
              </div>
            )}

            {/* OCR Success Summary */}
            {ocrResult && !isOcrRunning && (
              <div className="bg-white border border-emerald-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <span className="text-xs font-semibold text-emerald-900">
                      {ocrResult.isDigitalPdf
                        ? `Digital PDF Text Extracted (${ocrResult.totalPages} pages)`
                        : `Character Recognition Complete (${ocrResult.language.toUpperCase()})`}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      • {ocrResult.matchedCount} suggestion(s) populated below
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRawTextExpanded(!isRawTextExpanded)}
                      className="text-xs font-medium text-green-dark hover:underline flex items-center gap-1"
                    >
                      <span>{isRawTextExpanded ? 'Hide Raw OCR Text' : 'Inspect Raw OCR Text'}</span>
                      <span>{isRawTextExpanded ? '▴' : '▾'}</span>
                    </button>
                  </div>
                </div>

                {/* Extracted suggestion chips */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                  {ocrResult.suggestions.documentType && (
                    <span className="px-2 py-0.5 bg-stone-100 border border-border rounded text-stone-700">
                      <strong>Category:</strong> {ocrResult.suggestions.documentType}
                    </span>
                  )}
                  {ocrResult.suggestions.surveyNumber && (
                    <span className="px-2 py-0.5 bg-stone-100 border border-border rounded text-stone-700">
                      <strong>Survey:</strong> {ocrResult.suggestions.surveyNumber}
                    </span>
                  )}
                  {ocrResult.suggestions.pattaNumber && (
                    <span className="px-2 py-0.5 bg-stone-100 border border-border rounded text-stone-700">
                      <strong>Patta:</strong> {ocrResult.suggestions.pattaNumber}
                    </span>
                  )}
                  {ocrResult.suggestions.documentNumber && (
                    <span className="px-2 py-0.5 bg-stone-100 border border-border rounded text-stone-700">
                      <strong>Doc #:</strong> {ocrResult.suggestions.documentNumber}
                    </span>
                  )}
                  {ocrResult.suggestions.ownerName && (
                    <span className="px-2 py-0.5 bg-stone-100 border border-border rounded text-stone-700">
                      <strong>Owner:</strong> {ocrResult.suggestions.ownerName}
                    </span>
                  )}
                </div>

                {/* Expandable Raw Text Box */}
                {isRawTextExpanded && (
                  <div className="mt-2 pt-2 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Recognized raw text ({ocrResult.rawText?.length || 0} characters):</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(ocrResult.rawText);
                          setCopiedRawText(true);
                          setTimeout(() => setCopiedRawText(false), 2000);
                        }}
                        className="text-green-dark hover:underline font-medium"
                      >
                        {copiedRawText ? '✓ Copied' : 'Copy Text'}
                      </button>
                    </div>
                    <pre className="bg-stone-50 border border-border rounded-lg p-3 text-xs font-mono text-stone-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                      {ocrResult.rawText || '(No text extracted)'}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Folio Metadata Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Document Folio Details */}
            <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h2 className="font-serif font-bold text-base text-text-primary border-b border-border pb-3">
                Folio & Classification
              </h2>

              {/* Document Name / Title */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Document Title <span className="text-red-500">*</span>
                  </span>
                  {extractedFieldFlags.title && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded tracking-normal normal-case">
                      Extracted suggestion
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => {
                    setDocName(e.target.value);
                    setExtractedFieldFlags((prev) => ({ ...prev, title: false }));
                  }}
                  placeholder="e.g. Registered Sale Deed, Patta Extract"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark focus:ring-1 focus:ring-green-dark"
                />
              </div>

              {/* Document Type Category */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Document Category <span className="text-red-500">*</span>
                  </span>
                  {extractedFieldFlags.type && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded tracking-normal normal-case">
                      Extracted suggestion
                    </span>
                  )}
                </label>
                <select
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value);
                    setExtractedFieldFlags((prev) => ({ ...prev, type: false }));
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

              {/* Document Registration Number */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Document Number <span className="text-text-muted font-normal lowercase">(optional)</span>
                  </span>
                  {extractedFieldFlags.docNumber && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded tracking-normal normal-case">
                      Extracted suggestion
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => {
                    setDocNumber(e.target.value);
                    setExtractedFieldFlags((prev) => ({ ...prev, docNumber: false }));
                  }}
                  placeholder="e.g. Doc No. 412/1998, TR-8829"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>
            </div>

            {/* Column 2: Parcel Association & Custody */}
            <div className="bg-white border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h2 className="font-serif font-bold text-base text-text-primary border-b border-border pb-3">
                Schedule & Safekeeping
              </h2>

              {/* Survey Number */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Survey Number / Sub-division <span className="text-text-muted font-normal lowercase">(optional)</span>
                  </span>
                  {extractedFieldFlags.survey && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded tracking-normal normal-case">
                      Extracted suggestion
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => {
                    setSurveyNumber(e.target.value);
                    setExtractedFieldFlags((prev) => ({ ...prev, survey: false }));
                  }}
                  placeholder="e.g. 101/2A, 55/1"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  <span>
                    Archival Notes & Safekeeping <span className="text-text-muted font-normal lowercase">(optional)</span>
                  </span>
                  {extractedFieldFlags.notes && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded tracking-normal normal-case">
                      Extracted suggestion
                    </span>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setExtractedFieldFlags((prev) => ({ ...prev, notes: false }));
                  }}
                  placeholder="e.g. Preserved in Canara Bank Safe Locker #418, original stamp papers"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark"
                />
              </div>

              {/* Important Flag Toggle */}
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
                      Highlights this deed in the primary portfolio summary card.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-[#FAF9F5] border border-border rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs text-text-muted leading-relaxed">
              Your file is stored as a binary Blob directly in this device&apos;s browser IndexedDB. No unencrypted files leave your device.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href={selectedProperty ? `/properties/${selectedProperty.id}` : '/documents'}
              className="w-full sm:w-auto px-5 py-2.5 text-center text-xs sm:text-sm font-medium text-text-primary bg-white border border-border rounded-lg hover:bg-stone-50 transition-colors"
            >
              Cancel
            </Link>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleProceedToReview}
                disabled={isNavigatingReview || isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-green-dark text-green-dark hover:bg-emerald-50 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Review Extracted Details (Split View)</span>
                <span>→</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || saveSuccess}
                className="w-full sm:w-auto px-7 py-2.5 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] active:scale-[0.99] transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Saving to Vault...</span>
                  </>
                ) : saveSuccess ? (
                  <span>✓ Document Saved</span>
                ) : (
                  <span>Save Document to Vault</span>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* 5. Initial Scan and Upload Options */
        <>
          {/* Two Prominent Cards (Scan with camera & Upload a file) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Card 1: Scan with camera */}
            <div className="bg-white border border-border rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-10 h-10 bg-[#F2EFEB] text-[#133E31] rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5m8.25 0h4.5c.621 0 1.125.504 1.125 1.125v4.5m0 8.25v4.5c0 .621-.504 1.125-1.125 1.125h-4.5m-8.25 0h-4.5A1.125 1.125 0 013.75 19.5v-4.5M9 12h6" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-serif font-bold text-lg text-text-primary">
                    Scan with camera
                  </h2>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider bg-[#FDF6ED] text-[#9A6B2F] border border-[#F3E2CF] rounded uppercase">
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  Use device camera to scan Tamil Nadu stamp paper deeds, patta certificates, or tax challans with boundary enhancement.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="w-full py-2.5 px-4 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span>Open scanner</span>
                </button>
                {/* Fallback Camera File Input */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  capture="environment"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Card 2: Upload a file */}
            <div className="bg-white border border-border rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-10 h-10 bg-[#F2EFEB] text-[#133E31] rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3h-6m-1.5-6H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h2 className="font-serif font-bold text-lg text-text-primary mb-2">
                  Upload a file
                </h2>
                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  Upload existing scanned deeds, e-Sevai downloads, or high-contrast archival photography.
                </p>
              </div>

              <div className="space-y-2">
                <label className="w-full py-2.5 px-4 bg-white border border-border text-xs sm:text-sm font-medium text-text-primary rounded-lg hover:bg-stone-50 transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.559 18.32a1.5 1.5 0 11-2.122-2.122L16.2 6.436" />
                  </svg>
                  <span>Choose file</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-text-muted text-center">
                  PDF, JPG or PNG, up to 25 MB
                </p>
              </div>
            </div>
          </div>

          {/* Large Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-white border rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all mb-5 shadow-xs ${
              isDragging
                ? 'border-green-dark bg-emerald-50/20 ring-2 ring-green-dark/20'
                : 'border-border hover:border-stone-400'
            }`}
          >
            <div className="w-11 h-11 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500 mb-2.5">
              <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">
              Or drop a file here
            </p>
            <p className="text-xs text-text-muted mt-1.5 flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Your document stays on this device</span>
            </p>
          </div>
        </>
      )}

      {/* 6. Collapsible Tips for a clear scan */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-8 shadow-xs">
        <button
          type="button"
          onClick={() => setIsTipsExpanded(!isTipsExpanded)}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[#B8893B]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.439a11.96 11.96 0 003.75-2.249m-7.5 2.25a11.96 11.96 0 01-3.75-2.25m7.5-12.75a6 6 0 10-7.5 0" />
            </svg>
            <span className="text-sm font-medium text-text-primary">Tips for a clear scan</span>
          </div>
          <svg
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isTipsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isTipsExpanded && (
          <div className="px-5 pb-5 pt-1 border-t border-border/60 bg-[#FCFBF8] text-xs text-text-muted space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-text-primary whitespace-nowrap">• Use good lighting:</span>
              <span>Place document on a flat surface in bright, even lighting to prevent dark corners or shadows.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-text-primary whitespace-nowrap">• Keep the document flat:</span>
              <span>Smooth out heavy folds or creases on physical Tamil Nadu non-judicial stamp papers before capture.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-text-primary whitespace-nowrap">• Capture all four corners:</span>
              <span>Frame the full perimeter including SRO endorsement seals, stamp values, and page indices.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-text-primary whitespace-nowrap">• Avoid blur, shadows and glare:</span>
              <span>Keep your device parallel to the page and avoid direct light reflections on lamination or plastic sleeves.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-text-primary whitespace-nowrap">• Ensure readability:</span>
              <span>Check that schedule parcel numbers, sub-divisions, patta numbers, and boundary descriptions are crisp and legible.</span>
            </div>
          </div>
        )}
      </div>

      {/* 7. Bottom Navigation & Cancel */}
      <div className="text-center space-y-2 pt-1">
        <div>
          <Link
            href={selectedProperty ? `/properties/${selectedProperty.id}` : '/documents'}
            className="text-xs sm:text-sm text-text-muted hover:text-text-primary transition-colors font-medium inline-block py-1"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AddDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading upload form...</div>}>
      <AddDocumentContent />
    </Suspense>
  );
}
