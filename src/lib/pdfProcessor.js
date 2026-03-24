import { localApi } from '@/api/localApi';

/**
 * PDF Processing Utilities
 * Handles PDF download and OCR for study materials
 */

/**
 * Download PDF material to user's device
 * @param {Object} material - Material object with file_url
 * @param {string} filename - Optional custom filename
 */
export async function downloadPDF(material, filename = null) {
    try {
        const url = material.file_url;
        if (!url) {
            throw new Error('No file URL provided');
        }

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || material.title || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true };
    } catch (error) {
        console.error('Error downloading PDF:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Extract text locally using PDF.js to avoid AI payload API limits
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDF(file) {
    try {
        if (file.type === 'text/plain' || file.type === 'text/markdown') {
            return await file.text();
        }

        // Load PDF.js from CDN dynamically to avoid build-step worker issues
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || await new Promise((resolve, reject) => {
            if (window['pdfjs-dist/build/pdf']) return resolve(window['pdfjs-dist/build/pdf']);
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                const pdfjs = window['pdfjs-dist/build/pdf'];
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(pdfjs);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        // Extract text from up to 50 pages to prevent memory issues
        const maxPages = Math.min(pdf.numPages, 50);
        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Local PDF extraction failed:', error);

        // Ultimate Fallback to Gemini OCR natively if local parse fails
        try {
            const base64 = await fileToBase64(file);
            const response = await localApi.integrations.Core.InvokeLLM({
                prompt: `Extract ALL text from this PDF document. Return ONLY the extracted text content.`,
                systemPrompt: "You are an OCR assistant. Extract text accurately from documents.",
                image: base64
            });
            return response;
        } catch (geminiError) {
            throw new Error("Failed to extract text from PDF locally and via AI.");
        }
    }
}

/**
 * Extract text locally using PDF.js from a URL
 * @param {string} url - PDF file URL
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDFUrl(url) {
    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || await new Promise((resolve, reject) => {
            if (window['pdfjs-dist/build/pdf']) return resolve(window['pdfjs-dist/build/pdf']);
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                const pdfjs = window['pdfjs-dist/build/pdf'];
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(pdfjs);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });

        const pdf = await pdfjsLib.getDocument(url).promise;
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 50);
        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('URL PDF extraction failed:', error);
        return "";
    }
}

/**
 * Process PDF for quiz generation
 * Extracts and cleans text, ready for AI processing
 * @param {string} content - Raw extracted content
 * @returns {string} Cleaned and formatted content
 */
export function processForQuiz(content) {
    if (!content) return '';

    // Remove excessive whitespace
    let processed = content.replace(/\s+/g, ' ').trim();

    // Remove page numbers and headers/footers (common patterns)
    processed = processed.replace(/Page \d+ of \d+/gi, '');
    processed = processed.replace(/^\d+\s*$/gm, '');

    // Ensure reasonable length for quiz generation
    if (processed.length > 10000) {
        processed = processed.substring(0, 10000) + '...';
    }

    return processed;
}

/**
 * Process PDF for summary generation
 * Similar to quiz but keeps more context
 * @param {string} content - Raw extracted content
 * @returns {string} Cleaned content
 */
export function processForSummary(content) {
    if (!content) return '';

    let processed = content.replace(/\s+/g, ' ').trim();
    processed = processed.replace(/Page \d+ of \d+/gi, '');

    // Keep more content for summaries
    if (processed.length > 15000) {
        processed = processed.substring(0, 15000) + '...';
    }

    return processed;
}

/**
 * Helper: Convert File to Base64
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 string
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Check if a material is a PDF
 * @param {Object} material - Material object
 * @returns {boolean}
 */
export function isPDF(material) {
    if (!material) return false;

    const url = material.file_url || '';
    const type = material.type || '';
    const title = material.title || '';

    return (
        url.toLowerCase().endsWith('.pdf') ||
        type === 'pdf' ||
        title.toLowerCase().endsWith('.pdf')
    );
}

/**
 * Get file extension from URL
 * @param {string} url - File URL
 * @returns {string} File extension
 */
export function getFileExtension(url) {
    if (!url) return '';
    const parts = url.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}
