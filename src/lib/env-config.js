/**
 * Centralized Environment & API Key Management
 * Handles both dev and production builds correctly
 * Ensures portable builds have access to bundled API keys
 */

// Keys are injected at build time by Vite's define or Render's environment variables
const ENV_KEYS = {
    gemini: import.meta.env.VITE_GEMINI_API_KEY || null,
    deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY || null,
    openai: import.meta.env.VITE_OPENAI_API_KEY || null,
    xai: import.meta.env.VITE_XAI_API_KEY || null,
    mistral: import.meta.env.VITE_MISTRAL_API_KEY || null,
    groq: import.meta.env.VITE_GROQ_API_KEY || null,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

/**
 * Get API keys with proper priority:
 * 1. User-saved keys (localStorage) - allows override
 * 2. Environment variables (build-time) - default from .env
 * 3. null (if none available)
 * 
 * @returns {Object} Object containing all API keys
 */
export function getAPIKeys() {
    return {
        gemini: validateKey(localStorage.getItem('gemini_key')) || ENV_KEYS.gemini || null,
        deepseek: validateKey(localStorage.getItem('deepseek_key')) || ENV_KEYS.deepseek || null,
        openai: validateKey(localStorage.getItem('openai_key')) || ENV_KEYS.openai || null,
        xai: validateKey(localStorage.getItem('xai_key')) || ENV_KEYS.xai || null,
        mistral: validateKey(localStorage.getItem('mistral_key')) || ENV_KEYS.mistral || null,
        groq: validateKey(localStorage.getItem('groq_key')) || ENV_KEYS.groq || null,
    }
}

/**
 * Validate that a key is a non-empty string
 * @param {any} key - The key to validate
 * @returns {string|null} - Validated key or null
 */
function validateKey(key) {
    if (!key || typeof key !== 'string') return null
    const trimmed = key.trim()
    return trimmed.length > 0 ? trimmed : null
}

/**
 * Check if any AI service is configured
 * @returns {boolean}
 */
export function hasAnyAPIKey() {
    const keys = getAPIKeys()
    return !!(keys.gemini || keys.deepseek || keys.openai || keys.xai || keys.mistral)
}

/**
 * Get the first available API key for fallback
 * @returns {string|null}
 */
export function getFirstAvailableKey() {
    const keys = getAPIKeys()
    return keys.gemini || keys.openai || keys.mistral || keys.xai || keys.deepseek || null
}

/**
 * Get Supabase configuration
 * @returns {Object}
 */
export function getSupabaseConfig() {
    return {
        url: ENV_KEYS.supabaseUrl,
        anonKey: ENV_KEYS.supabaseKey
    }
}

/**
 * Debug helper to check what keys are available
 * @returns {Object} Status of each key source
 */
export function debugKeys() {
    return {
        environment: {
            gemini: !!ENV_KEYS.gemini,
            deepseek: !!ENV_KEYS.deepseek,
            openai: !!ENV_KEYS.openai,
            xai: !!ENV_KEYS.xai,
            mistral: !!ENV_KEYS.mistral,
        },
        localStorage: {
            gemini: !!localStorage.getItem('gemini_key'),
            deepseek: !!localStorage.getItem('deepseek_key'),
            openai: !!localStorage.getItem('openai_key'),
            xai: !!localStorage.getItem('xai_key'),
            mistral: !!localStorage.getItem('mistral_key'),
        },
        final: {
            gemini: !!getAPIKeys().gemini,
            deepseek: !!getAPIKeys().deepseek,
            openai: !!getAPIKeys().openai,
            xai: !!getAPIKeys().xai,
            mistral: !!getAPIKeys().mistral,
        }
    }
}
