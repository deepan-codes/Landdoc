'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { properties } from '@/mockData';

function DocumentScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propIdParam = searchParams ? searchParams.get('propertyId') : null;

  const [selectedProperty, setSelectedProperty] = useState(() => {
    if (propIdParam) {
      return properties.find((p) => p.id === propIdParam)?.id || properties[0]?.id || '1';
    }
    return properties[0]?.id || '1';
  });

  const [capturedPages, setCapturedPages] = useState([]);
  const [filterMode, setFilterMode] = useState('bw'); // 'bw' or 'original'
  const [autoCrop, setAutoCrop] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const [previewingPage, setPreviewingPage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // Auto-start camera when scanner page mounts
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraLoading(true);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play prevented:', playErr);
        }
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access was blocked by browser permissions. Please allow camera access in your browser settings or use device photo capture.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          'No camera hardware was detected on this device. You can capture or select photos using the file picker below.'
        );
      } else {
        setCameraError(
          'Unable to access camera directly. Please grant permission or use the fallback file/camera capture button.'
        );
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Ensure video element receives stream once rendered
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Capture current frame from live camera
  const handleCaptureFrame = () => {
    if (!videoRef.current || !isCameraActive) {
      // If camera is not active, trigger native mobile file/camera picker
      fallbackInputRef.current?.click();
      return;
    }

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Optional Black & White enhancement for deeds
      if (filterMode === 'bw') {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // High contrast thresholding for text crispness
          const v = gray > 130 ? 250 : 25;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const nextId = capturedPages.length + 1;
      const sizeMb = (dataUrl.length / (1024 * 1024 * 1.33)).toFixed(1);

      setCapturedPages((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: `Page ${nextId} - Document Scan`,
          size: `${sizeMb > 0 ? sizeMb : '0.8'} MB`,
          preview: dataUrl,
        },
      ]);
    } catch (err) {
      console.error('Frame capture failed:', err);
    } finally {
      setTimeout(() => setIsCapturing(false), 300);
    }
  };

  // Fallback file input change (for mobile camera or desktop file pick)
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const nextId = capturedPages.length + 1;
      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      setCapturedPages((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: `Page ${nextId} - ${file.name.slice(0, 24)}`,
          size: sizeFormatted,
          preview: event.target?.result,
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePage = (id) => {
    setCapturedPages((prev) => prev.filter((p) => p.id !== id));
  };

  // Navigate to review with captured pages
  const handleSaveScans = () => {
    if (capturedPages.length === 0) {
      setCameraError('Please capture or upload at least one page before proceeding.');
      return;
    }

    const targetProp = properties.find((p) => p.id === selectedProperty) || properties[0];

    try {
      sessionStorage.setItem(
        'landdoc_pending_doc',
        JSON.stringify({
          propertyId: targetProp.id,
          propertyName: targetProp.name,
          fileName: `Scanned_Folio_${capturedPages.length}_Pages.pdf`,
          fileSize: `${capturedPages.length * 1.2} MB`,
          fileType: 'application/pdf',
          filePreview: capturedPages[0]?.preview,
          surveyNumber: targetProp.surveyNumber,
          pattaNumber: targetProp.pattaNumber,
        })
      );
    } catch (err) {
      console.warn('Storage notice:', err);
    }

    router.push(
      `/documents/review?propertyId=${targetProp.id}&fileName=${encodeURIComponent(
        `Scanned_Folio_${capturedPages.length}_Pages.pdf`
      )}&fileSize=${encodeURIComponent(`${capturedPages.length * 1.2} MB`)}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <span>←</span>
          <span>Back to Documents</span>
        </Link>
        <span className="text-xs text-text-muted bg-white border border-border px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Document Scanner Mode</span>
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-text-primary">
          Document Scanner
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Scan physical property deeds, FMB cadastral maps, and revenue tax challans with boundary enhancement.
        </p>
      </div>

      {/* Hidden Fallback File/Camera Input */}
      <input
        type="file"
        ref={fallbackInputRef}
        capture="environment"
        accept="image/*"
        onChange={handleFallbackFile}
        className="hidden"
      />

      {/* Camera Alert / Error */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{cameraError}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1.5 bg-amber-200 text-amber-900 rounded-lg hover:bg-amber-300 font-medium transition-colors"
            >
              Retry Camera
            </button>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="px-3 py-1.5 bg-green-dark text-white rounded-lg hover:bg-[#134e3b] font-medium transition-colors"
            >
              Capture / Pick Photo
            </button>
          </div>
        </div>
      )}

      {/* Main Scanner Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Viewfinder Camera View (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-md aspect-[4/3] flex flex-col justify-between p-4 sm:p-5 text-white border border-stone-800">
            {/* Live Video Element */}
            {isCameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900 text-stone-300">
                {isCameraLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-400">Requesting device camera access...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Camera Standby</p>
                      <p className="text-xs text-stone-400 mt-1 max-w-sm">
                        Use your device camera or tap capture below to take photos of physical deeds.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fallbackInputRef.current?.click()}
                      className="mt-1 px-4 py-2 bg-green-dark text-white rounded-lg text-xs font-semibold hover:bg-[#134e3b] transition-colors"
                    >
                      📷 Take Photo with Device Camera
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Viewfinder Top Bar */}
            <div className="flex items-center justify-between z-10">
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white/90 border border-white/20 hover:bg-black/70 transition-colors flex items-center gap-1.5"
                title="Restart Camera"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>{isCameraActive ? 'Active' : 'Start'}</span>
              </button>

              <div className="px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[11px] font-mono tracking-wide text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isCameraActive ? 'LIVE VIEW' : 'SCANNER READY'}</span>
              </div>

              <button
                type="button"
                onClick={() => setAutoCrop(!autoCrop)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  autoCrop
                    ? 'bg-green-dark text-white border-green-500/50'
                    : 'bg-black/40 text-white/80 border-white/20'
                }`}
              >
                Auto-crop {autoCrop ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Viewfinder Document Guide Frame */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_20px_rgba(52,211,153,0.15)] z-10">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
              </div>
              <div className="text-center">
                <span className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] text-stone-200 font-mono border border-white/10">
                  Align stamp paper within guides
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />
              </div>
            </div>

            {/* Viewfinder Bottom Controls */}
            <div className="flex items-center justify-between z-10 pt-2">
              {/* Filter mode pill */}
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-white/15 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('bw')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterMode === 'bw' ? 'bg-white text-stone-900 font-semibold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  B&W Doc
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('original')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    filterMode === 'original' ? 'bg-white text-stone-900 font-semibold' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Color
                </button>
              </div>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isCapturing}
                className="w-16 h-16 rounded-full bg-white border-4 border-stone-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                title="Capture Page"
              >
                <div
                  className={`w-11 h-11 rounded-full ${
                    isCapturing ? 'bg-emerald-600 scale-90' : 'bg-green-dark'
                  } transition-all`}
                />
              </button>

              {/* Page count badge */}
              <div className="text-xs text-stone-300 font-medium bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/15">
                {capturedPages.length} {capturedPages.length === 1 ? 'Page' : 'Pages'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted px-1">
            <span>Keep your device parallel to avoid glare on plastic sleeves.</span>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="text-green-dark hover:underline font-medium"
            >
              Upload or capture from file picker →
            </button>
          </div>
        </div>

        {/* Right: Captured Pages Tray & Save (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-text-primary text-base">
                Scanned Folio ({capturedPages.length})
              </h3>
              <span className="text-[11px] text-text-muted">High-res 300 DPI</span>
            </div>

            {/* Target Property */}
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">
                Link to Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-border rounded-lg focus:outline-none focus:border-green-dark text-text-primary"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Survey #{p.surveyNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Captured Pages List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {capturedPages.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg bg-stone-50/50">
                  <div className="w-8 h-8 mx-auto text-stone-400 mb-2">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5m8.25 0h4.5c.621 0 1.125.504 1.125 1.125v4.5m0 8.25v4.5c0 .621-.504 1.125-1.125 1.125h-4.5m-8.25 0h-4.5A1.125 1.125 0 013.75 19.5v-4.5M9 12h6" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-text-primary">No pages captured yet</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Tap the shutter button or capture a photo to add pages to this deed.
                  </p>
                </div>
              ) : (
                capturedPages.map((page, idx) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-stone-100/70 border border-border rounded-lg text-xs transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewingPage(page)}
                      className="flex items-center gap-2.5 min-w-0 text-left group flex-1 cursor-pointer focus:outline-none"
                      title="Click to inspect this page"
                    >
                      {page.preview ? (
                        <div className="relative w-10 h-12 rounded overflow-hidden bg-stone-200 border border-border flex-shrink-0 group-hover:ring-2 group-hover:ring-green-dark transition-all">
                          <img src={page.preview} alt="Scan" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span className="w-6 h-6 bg-green-dark text-white rounded flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0">
                          {idx + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary group-hover:text-green-dark transition-colors truncate">
                          {page.title}
                        </p>
                        <p className="text-[10px] text-text-muted flex items-center gap-1.5">
                          <span>{page.size} • Cropped</span>
                          <span className="text-green-dark font-medium underline">Click to inspect</span>
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePage(page.id)}
                      className="text-text-muted hover:text-red-600 p-1.5 transition-colors ml-1"
                      title="Delete page"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-border space-y-2">
              <button
                type="button"
                onClick={handleSaveScans}
                disabled={capturedPages.length === 0}
                className="w-full py-2.5 bg-green-dark text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#134e3b] disabled:opacity-50 transition-colors shadow-xs"
              >
                Continue to Review ({capturedPages.length} {capturedPages.length === 1 ? 'page' : 'pages'}) →
              </button>
              <p className="text-[11px] text-text-muted text-center">
                Your document stays on this device.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Page Lightbox Modal */}
      {previewingPage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setPreviewingPage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-[#FAF9F5]">
              <div className="min-w-0 pr-3">
                <h3 className="font-semibold text-sm text-text-primary truncate">
                  {previewingPage.title}
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {previewingPage.size} • High Resolution 300 DPI Folio Inspection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingPage(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-stone-200/60 transition-colors text-sm font-bold"
                title="Close inspect modal"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-900/95">
              {previewingPage.preview ? (
                <img
                  src={previewingPage.preview}
                  alt={previewingPage.title}
                  className="max-w-full max-h-[72vh] object-contain rounded shadow-lg"
                />
              ) : (
                <p className="text-white text-xs">No visual preview available</p>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-white text-xs">
              <span className="text-text-muted">Ensure text, survey numbers, and seals are legible.</span>
              <button
                type="button"
                onClick={() => setPreviewingPage(null)}
                className="px-4 py-1.5 bg-green-dark text-white rounded-lg font-medium hover:bg-[#134e3b] transition-colors"
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

export default function DocumentScanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading scanner...</div>}>
      <DocumentScanContent />
    </Suspense>
  );
}
