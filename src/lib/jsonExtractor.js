/**
 * JSON Extractor - Now using centralized safeJsonParser
 * This file is kept for backward compatibility
 */
import { robustJSONParse as safeRobustParse, safeJsonParse } from './safeJsonParser';

/**
 * Robustly parses JSON from a string that might contain markdown,
 * explanatory text, or other non-JSON artifacts.
 * @deprecated Use safeJsonParse from safeJsonParser.js instead
 */
export const robustJSONParse = (text) => {
    return safeRobustParse(text, { throwOnError: true, verbose: false });
};

// Re-export all utilities for convenience
export { safeJsonParse, safeJsonParseArray, safeJsonParseObject, isValidJson } from './safeJsonParser';
