import * as pdfjsLib from 'pdfjs-dist';

// Polyfills for modern JavaScript features used by modern pdfjs-dist versions
if (typeof window !== 'undefined') {
  if (!('toHex' in Uint8Array.prototype)) {
    (Uint8Array.prototype as any).toHex = function () {
      let result = '';
      for (let i = 0; i < this.length; i++) {
        result += this[i].toString(16).padStart(2, '0');
      }
      return result;
    };
  }

  if (!('toHex' in ArrayBuffer.prototype)) {
    (ArrayBuffer.prototype as any).toHex = function () {
      return (new Uint8Array(this) as any).toHex();
    };
  }

  if (!('withResolvers' in Promise)) {
    (Promise as any).withResolvers = function <T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: any) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

// Configure pdfjs worker
try {
  if (typeof window !== 'undefined') {
    // Avoid cross-origin worker issues by utilizing unpkg CDN or in-thread fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('Failed to configure pdfjs worker source:', e);
}

export interface ExtractedPdfData {
  fileName: string;
  fileSize: number;
  totalPages: number;
  fullText: string;
  pageTexts: Array<{ pageNumber: number; text: string }>;
  isScanned: boolean; // True if very little text found (mostly raster images)
  samplePreview: string;
  headings: string[];
}

/**
 * Server-side PDF extraction fallback if browser worker or environment fails
 */
async function extractViaServer(file: File | Blob, fileName: string): Promise<ExtractedPdfData | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const res = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'X-File-Name': encodeURIComponent(fileName),
      },
      body: arrayBuffer,
    });

    if (!res.ok) {
      console.warn(`Server PDF extraction responded with ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data && data.fullText !== undefined) {
      return {
        fileName: data.fileName || fileName,
        fileSize: (file as File).size || arrayBuffer.byteLength,
        totalPages: data.totalPages || 1,
        fullText: data.fullText || '',
        pageTexts: data.pageTexts || [{ pageNumber: 1, text: data.fullText || '' }],
        isScanned: (data.fullText || '').length < (data.totalPages || 1) * 30,
        samplePreview: (data.fullText || '').substring(0, 1200),
        headings: data.headings || [],
      };
    }
  } catch (err) {
    console.warn('Server-side PDF extraction failed:', err);
  }
  return null;
}

export async function extractTextFromPdf(file: File | Blob, fileName = 'Document.pdf'): Promise<ExtractedPdfData> {
  const arrayBuffer = await file.arrayBuffer();

  // Attempt client-side parsing first
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      disableFontFace: true,
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    const pageTexts: Array<{ pageNumber: number; text: string }> = [];
    let combinedText = '';
    const headings: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;

          // Detect line breaks based on vertical positioning
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageStr += '\n';
          } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
            pageStr += ' ';
          }

          pageStr += item.str;
          lastY = item.transform[5];

          // Detect potential creature or chapter headers (all caps or distinct size)
          if (item.str.length > 3 && item.str.length < 50 && (item.height > 12 || item.str === item.str.toUpperCase())) {
            const trimmed = item.str.trim();
            if (trimmed && !headings.includes(trimmed) && !trimmed.match(/^\d+$/) && headings.length < 60) {
              headings.push(trimmed);
            }
          }
        }

        const trimmedPageStr = pageStr.trim();
        if (trimmedPageStr) {
          pageTexts.push({ pageNumber: pageNum, text: trimmedPageStr });
          combinedText += `\n\n--- [PAGE ${pageNum}] ---\n` + trimmedPageStr;
        }
      } catch (pageErr) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageErr);
      }
    }

    const cleanText = combinedText.trim();
    if (cleanText.length > 0 || totalPages > 0) {
      const isScanned = cleanText.length < totalPages * 30;
      return {
        fileName,
        fileSize: (file as File).size || arrayBuffer.byteLength,
        totalPages,
        fullText: cleanText,
        pageTexts,
        isScanned,
        samplePreview: cleanText.substring(0, 1200) || '(No embedded digital text found - document may be scanned images)',
        headings,
      };
    }
  } catch (clientErr) {
    console.warn('Client-side pdfjs extraction encountered an issue, trying server fallback:', clientErr);
  }

  // Fallback to server-side parser
  const serverResult = await extractViaServer(file, fileName);
  if (serverResult) {
    return serverResult;
  }

  // Basic fallback if everything fails
  return {
    fileName,
    fileSize: (file as File).size || arrayBuffer.byteLength,
    totalPages: 1,
    fullText: '',
    pageTexts: [],
    isScanned: true,
    samplePreview: '(PDF attached)',
    headings: [],
  };
}

/**
 * For scanned PDFs or when image rendering is needed, renders a specific page to a compressed WebP/JPEG data URI
 */
export async function renderPdfPageToDataUrl(file: File | Blob, pageNumber: number, maxWidth = 1200): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) return null;

    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(1.5, maxWidth / viewport.width);
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await (page.render as any)({
      canvasContext: context,
      viewport: scaledViewport,
      canvas: canvas,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.82);
  } catch (err) {
    console.error(`Failed to render PDF page ${pageNumber}:`, err);
    return null;
  }
}
