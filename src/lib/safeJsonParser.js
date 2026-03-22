/**
 * Senior Developer's Robust JSON Parser
 * 
 * This utility provides enterprise-grade JSON parsing with comprehensive error handling.
 * It handles all edge cases from AI responses including:
 * - Markdown code blocks (```json)
 * - Extra text before/after JSON
 * - Malformed JSON with common AI mistakes
 * - Trailing commas
 * - Unquoted keys
 * - Single quotes instead of double quotes
 * 
 * @author Senior Developer Team
 * @version 2.0
 */

/**
 * Safely parse JSON from any string, with aggressive cleanup and fallback strategies
 * @param {string|object} input - The input to parse (can be string or already parsed object)
 * @param {object} [options] - Parsing options
 * @param {any} [options.fallback=null] - Value to return if parsing fails
 * @param {boolean} [options.throwOnError=false] - Whether to throw errors
 * @param {boolean} [options.verbose=false] - Enable verbose logging
 * @returns {any} Parsed JSON or fallback value
 */
export function safeJsonParse(input, options) {
    const {
        fallback = null,
        throwOnError = false,
        verbose = false
    } = options || {};

    // If already an object, return it
    if (typeof input === 'object' && input !== null) {
        return input;
    }

    // If not a string, return fallback
    if (typeof input !== 'string') {
        if (verbose) console.warn('[SafeJsonParser] Input is not a string or object:', typeof input);
        return fallback;
    }

    // If empty string, return fallback
    if (!input || input.trim() === '') {
        if (verbose) console.warn('[SafeJsonParser] Empty input provided');
        return fallback;
    }

    try {
        return _parseWithStrategies(input, verbose);
    } catch (error) {
        if (verbose) {
            console.error('[SafeJsonParser] All parsing strategies failed:', error.message);
            console.error('[SafeJsonParser] Input preview:', input.substring(0, 200));
        }

        if (throwOnError) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }

        return fallback;
    }
}

/**
 * Internal: Try multiple parsing strategies in order of likelihood
 */
function _parseWithStrategies(text, verbose = false) {
    const strategies = [
        { name: 'Direct Parse', fn: _directParse },
        { name: 'Markdown Cleanup', fn: _markdownCleanupParse },
        { name: 'Structure Extraction', fn: _structureExtractionParse },
        { name: 'Aggressive Repair', fn: _aggressiveRepairParse }
    ];

    for (const strategy of strategies) {
        try {
            const result = strategy.fn(text);
            if (verbose) console.log(`[SafeJsonParser] ✓ Success with: ${strategy.name}`);
            return result;
        } catch (error) {
            if (verbose) console.log(`[SafeJsonParser] ✗ Failed: ${strategy.name} - ${error.message}`);
            continue;
        }
    }

    throw new Error('All parsing strategies exhausted');
}

/**
 * Strategy 1: Direct parse (fastest, for clean JSON)
 */
function _directParse(text) {
    return JSON.parse(text.trim());
}

/**
 * Strategy 2: Remove markdown code blocks and try again
 */
function _markdownCleanupParse(text) {
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    return JSON.parse(cleaned);
}

/**
 * Strategy 3: Extract JSON structure boundaries
 */
function _structureExtractionParse(text) {
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Find first { or [
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let start = -1;
    let isObject = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        isObject = true;
    } else if (firstBracket !== -1) {
        start = firstBracket;
        isObject = false;
    }

    if (start === -1) {
        throw new Error('No JSON structure starter ({ or [) found');
    }

    // Find matching closing bracket
    const closingChar = isObject ? '}' : ']';
    const lastIdx = cleaned.lastIndexOf(closingChar);

    if (lastIdx === -1 || lastIdx <= start) {
        throw new Error(`No closing ${closingChar} found`);
    }

    const extracted = cleaned.substring(start, lastIdx + 1);
    return JSON.parse(extracted);
}

/**
 * Strategy 4: Aggressive repair of common AI JSON mistakes
 */
function _aggressiveRepairParse(text) {
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Extract structure
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    let start = -1;
    let isObject = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        isObject = true;
    } else if (firstBracket !== -1) {
        start = firstBracket;
        isObject = false;
    }

    if (start === -1) {
        throw new Error('No JSON structure found for repair');
    }

    const closingChar = isObject ? '}' : ']';
    const lastIdx = cleaned.lastIndexOf(closingChar);

    if (lastIdx === -1 || lastIdx <= start) {
        throw new Error('No closing bracket found for repair');
    }

    let candidate = cleaned.substring(start, lastIdx + 1);

    // Apply aggressive fixes
    const repaired = candidate
        // Remove trailing commas before closing brackets/braces
        .replace(/,\s*([}\]])/g, '$1')
        // Fix unquoted keys (word characters followed by colon)
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix single-quoted strings to double quotes
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        // Fix escaped single quotes
        .replace(/\\'/g, "'")
        // Remove comments (// and /* */)
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Fix missing commas between array elements (heuristic)
        .replace(/}\s*{/g, '},{')
        .replace(/]\s*\[/g, '],[');

    return JSON.parse(repaired);
}

/**
 * Extract JSON from AI response with markdown and explanatory text
 * Alias for backward compatibility
 */
export const robustJSONParse = (text, options = {}) => {
    return safeJsonParse(text, { ...options, throwOnError: true });
};

/**
 * Parse JSON array specifically (ensures result is an array)
 */
export function safeJsonParseArray(input, options = {}) {
    const result = safeJsonParse(input, options);

    if (Array.isArray(result)) {
        return result;
    }

    // If it's an object with an array property, try to extract it
    if (result && typeof result === 'object') {
        const arrayKeys = Object.keys(result).filter(key => Array.isArray(result[key]));
        if (arrayKeys.length > 0) {
            return result[arrayKeys[0]];
        }
    }

    return options.fallback || [];
}

/**
 * Parse JSON object specifically (ensures result is an object)
 */
export function safeJsonParseObject(input, options = {}) {
    const result = safeJsonParse(input, options);

    if (result && typeof result === 'object' && !Array.isArray(result)) {
        return result;
    }

    return options.fallback || {};
}

/**
 * Validate if a string contains valid JSON
 */
export function isValidJson(text) {
    try {
        safeJsonParse(text, { throwOnError: true });
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract all JSON objects/arrays from a text (useful for multi-JSON responses)
 */
export function extractAllJson(text) {
    const results = [];
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

    // Find all potential JSON structures
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const arrayRegex = /\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g;

    const objectMatches = cleaned.match(objectRegex) || [];
    const arrayMatches = cleaned.match(arrayRegex) || [];

    [...objectMatches, ...arrayMatches].forEach(match => {
        const parsed = safeJsonParse(match, { fallback: null });
        if (parsed !== null) {
            results.push(parsed);
        }
    });

    return results;
}

export default {
    safeJsonParse,
    robustJSONParse,
    safeJsonParseArray,
    safeJsonParseObject,
    isValidJson,
    extractAllJson
};
