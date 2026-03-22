import { base44 } from '@/api/base44Client';

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
 * Extract text from PDF using Gemini Vision API
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDF(file) {
    try {
        // Convert PDF to base64
        const base64 = await fileToBase64(file);

        // Use Gemini Vision to OCR the PDF
        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Extract ALL text from this PDF document. Return ONLY the extracted text content, preserving paragraph structure and formatting as much as possible. Do not add any commentary or explanations.`,
            systemPrompt: "You are an OCR assistant. Extract text accurately from documents.",
            image: base64
        });

        return response;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
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
