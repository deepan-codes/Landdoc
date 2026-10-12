import { parseLandDocumentMetadata } from './ocr-parser';

/**
 * State for currently active OCR session to allow cancellation
 */
let activeWorker = null;
let isCancelled = false;

/**
 * Cancel any ongoing OCR process
 */
export async function cancelOcr() {
  isCancelled = true;
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch (e) {
      // ignore
    }
    activeWorker = null;
  }
}

/**
 * Load PDF.js library dynamically in browser environment
 */
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions?.workerSrc) {
    // Point to local public worker copied from pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
  return pdfjsLib;
}

/**
 * Load Tesseract.js library dynamically in browser environment
 */
async function loadTesseract() {
  const tesseract = await import('tesseract.js');
  return tesseract;
}

/**
 * Extract selectable digital text from PDF using PDF.js.
 * Fast, accurate, and completely offline for digital PDFs.
 * 
 * @param {ArrayBuffer} arrayBuffer 
 * @param {Function} [onProgress]
 * @returns {Promise<{ hasDigitalText: boolean, text: string, numPages: number }>}
 */
async function extractDigitalPdfText(arrayBuffer, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  let pagesWithText = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    if (isCancelled) throw new Error('OCR_CANCELLED');

    onProgress?.({
      stage: 'digital_check',
      progress: (pageNum / pdf.numPages) * 0.4,
      percent: Math.round((pageNum / pdf.numPages) * 40),
      message: `Checking page ${pageNum} of ${pdf.numPages} for selectable text...`,
      page: pageNum,
      totalPages: pdf.numPages,
    });

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ').trim();

    if (pageText.length > 15) {
      pagesWithText++;
      fullText += (fullText ? '\n\n' : '') + `[Page ${pageNum}]\n` + pageText;
    }
  }

  // If at least one page had substantial digital text, treat as digital PDF
  const hasDigitalText = fullText.trim().length >= 40 || pagesWithText > 0;
  return { hasDigitalText, text: fullText, numPages: pdf.numPages, pdf };
}

/**
 * Render a single PDF page onto an HTML canvas for Tesseract OCR
 * @param {Object} page - PDF.js page object
 * @param {number} [scale=1.5] - Resolution multiplier
 * @returns {Promise<HTMLCanvasElement>}
 */
async function renderPageToCanvas(page, scale = 1.5) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas;
}

/**
 * Run OCR on a rendered canvas or image file using Tesseract.js
 * @param {HTMLCanvasElement|File|Blob} imageSource 
 * @param {string} [language='eng'] 
 * @param {Function} [onProgress]
 * @returns {Promise<string>}
 */
async function runTesseractRecognition(imageSource, language = 'eng', onProgress) {
  const { createWorker } = await loadTesseract();

  if (isCancelled) throw new Error('OCR_CANCELLED');

  onProgress?.({
    stage: 'worker_init',
    progress: 0.1,
    percent: 10,
    message: `Initializing local recognition engine (${language.toUpperCase()})...`,
  });

  let worker = null;
  try {
    worker = await createWorker(language, 1, {
      logger: (m) => {
        if (isCancelled) return;
        if (m.status === 'recognizing text') {
          const prog = m.progress || 0;
          onProgress?.({
            stage: 'recognizing',
            progress: 0.2 + prog * 0.75,
            percent: Math.round((0.2 + prog * 0.75) * 100),
            message: `Recognizing text: ${Math.round(prog * 100)}%`,
          });
        }
      },
    });

    activeWorker = worker;

    if (isCancelled) throw new Error('OCR_CANCELLED');

    const result = await worker.recognize(imageSource);
    return result?.data?.text || '';
  } catch (err) {
    if (isCancelled) throw new Error('OCR_CANCELLED');
    
    // Check for offline missing language pack
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error(
        `Language model "${language}" is not yet cached on this device, and you are currently offline. ` +
        `Please connect to the internet once to download and cache the language model, or enter details manually.`
      );
    }
    throw err;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore
      }
      if (activeWorker === worker) {
        activeWorker = null;
      }
    }
  }
}

/**
 * Main OCR Extraction function.
 * Handles PDF (digital text first, then scanned page fallback) and Image files.
 * Returns raw text, extracted metadata suggestions, and extraction statistics.
 * 
 * @param {File|Blob} file 
 * @param {Object} [options]
 * @param {string} [options.language='eng'] - 'eng', 'tam', or 'eng+tam'
 * @param {Function} [options.onProgress] - Callback for progress reporting
 * @returns {Promise<Object>}
 */
export async function extractDocumentText(file, { language = 'eng', onProgress } = {}) {
  isCancelled = false;

  if (!file) {
    throw new Error('No document file was provided for extraction.');
  }

  // Validate size (max 25MB)
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds the maximum limit of 25 MB.');
  }

  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(file.name || '');

  if (!isPdf && !isImage) {
    throw new Error('Unsupported file format. Please upload a PDF, JPG, JPEG, or PNG document.');
  }

  let rawExtractedText = '';
  let isDigitalPdf = false;
  let totalPages = 1;

  try {
    if (isPdf) {
      // 1. Check for digital selectable text in PDF first
      onProgress?.({
        stage: 'reading_pdf',
        progress: 0.05,
        percent: 5,
        message: 'Reading PDF document structure...',
      });

      const arrayBuffer = await file.arrayBuffer();
      const digitalCheck = await extractDigitalPdfText(arrayBuffer, onProgress);
      totalPages = digitalCheck.numPages;

      if (digitalCheck.hasDigitalText && digitalCheck.text.trim().length >= 40) {
        // PDF has readable digital text! No OCR needed.
        rawExtractedText = digitalCheck.text;
        isDigitalPdf = true;

        onProgress?.({
          stage: 'complete',
          progress: 1,
          percent: 100,
          message: `Successfully extracted readable text from ${digitalCheck.numPages} PDF page(s).`,
        });
      } else {
        // Scanned PDF! Render each page to canvas and run OCR sequentially
        const pdf = digitalCheck.pdf;
        const pageTexts = [];

        for (let p = 1; p <= pdf.numPages; p++) {
          if (isCancelled) throw new Error('OCR_CANCELLED');

          onProgress?.({
            stage: 'rendering_page',
            progress: (p - 1) / pdf.numPages,
            percent: Math.round(((p - 1) / pdf.numPages) * 100),
            message: `Rendering scanned page ${p} of ${pdf.numPages}...`,
            page: p,
            totalPages: pdf.numPages,
          });

          const page = await pdf.getPage(p);
          const canvas = await renderPageToCanvas(page, 1.5);

          try {
            const pageText = await runTesseractRecognition(canvas, language, (prog) => {
              const baseProg = (p - 1) / pdf.numPages;
              const scaledProg = baseProg + (prog.progress || 0) * (1 / pdf.numPages);
              onProgress?.({
                stage: 'recognizing',
                progress: scaledProg,
                percent: Math.round(scaledProg * 100),
                message: `Page ${p} of ${pdf.numPages}: ${prog.message}`,
                page: p,
                totalPages: pdf.numPages,
              });
            });

            if (pageText && pageText.trim()) {
              pageTexts.push(`[Page ${p}]\n` + pageText.trim());
            }
          } finally {
            // Immediately release canvas and bitmap memory
            canvas.width = 0;
            canvas.height = 0;
          }
        }

        rawExtractedText = pageTexts.join('\n\n');
      }
    } else {
      // Direct Image OCR (JPG, JPEG, PNG)
      totalPages = 1;
      rawExtractedText = await runTesseractRecognition(file, language, onProgress);
    }

    if (isCancelled) throw new Error('OCR_CANCELLED');

    // Parse extracted text to suggest land document metadata
    const parsed = parseLandDocumentMetadata(rawExtractedText);

    onProgress?.({
      stage: 'done',
      progress: 1,
      percent: 100,
      message: parsed.hasExtraction
        ? `Found ${parsed.matchedCount} property field suggestion(s).`
        : 'Text extracted. Review and edit fields before saving.',
    });

    return {
      success: true,
      rawText: rawExtractedText,
      isDigitalPdf,
      totalPages,
      language,
      suggestions: parsed.suggestions,
      hasExtraction: parsed.hasExtraction,
      matchedCount: parsed.matchedCount,
    };
  } catch (error) {
    if (error.message === 'OCR_CANCELLED') {
      return {
        success: false,
        cancelled: true,
        message: 'Text extraction was cancelled.',
      };
    }

    console.error('OCR Extraction error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during text extraction.',
      rawText: '',
      suggestions: parseLandDocumentMetadata('').suggestions,
    };
  } finally {
    activeWorker = null;
  }
}
