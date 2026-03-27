/**
 * Backend Bridge
 * Handles communication between the React Frontend and Local Backend Sidecars (Python/Go).
 */

import { getAPIKeys } from './env-config';
import { safeJsonParse } from './safeJsonParser';

const PORTS = {
    PYTHON: 5001,
    GO: 5002
};

const BASE_URLS = {
    PYTHON: `https://queue-marshal-server-production-a2fe.up.railway.app`,
    GO: `http://127.0.0.1:${PORTS.GO}`
};

export const BackendBridge = {
    /**
     * Check if the Python AI service is running.
     */
    async isPythonReady() {
        try {
            const res = await fetch(`${BASE_URLS.PYTHON}/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    /**
     * Check if the Go Search service is running.
     */
    async isGoReady() {
        try {
            // Go server doesn't have a specific health endpoint yet, but we can verify checking root or just assume off if connection fails
            const res = await fetch(`${BASE_URLS.GO}/search?q=ping`, { method: 'GET', signal: AbortSignal.timeout(1000) });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    /**
     * Classify a document using the Python Backend.
     * @param {string} fileBase64 
     * @param {string} mimeType 
     */
    async classifyDocument(fileBase64, mimeType, isBackground = false) {
        // Import localApi dynamically to avoid circular dependencies
        const { localApi } = await import('../api/localApi');

        try {
            const balance = await localApi.wallet.getBalance();
            if (!isBackground && balance < 1) throw new Error("INSUFFICIENT_CREDITS");

            const keys = getAPIKeys();
            const response = await fetch(`${BASE_URLS.PYTHON}/classify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileBase64,
                    mimeType,
                    ...(Object.values(keys).some(k => k !== null) ? { keys } : {})
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Python Backend Error: ${response.status}`);
            }

            const data = await response.json();

            // If Python gracefully returned an error inside JSON, throw it so ai.js fallback engages
            if (data.error) {
                throw new Error(data.error);
            }

            // Deduct credit only on success AND if not background
            if (!isBackground) {
                await localApi.wallet.spendCredits(1, `Classify Document: ${mimeType}`);
            }

            return data;
        } catch (error) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                // Show user-friendly toast
                import('sonner').then(({ toast }) => {
                    toast.error('Not enough credits! Please top up your wallet.', {
                        description: 'Go to the Credits page to purchase more or wait for your monthly free credits.',
                        duration: 6000
                    });
                });
            }
            console.error("BackendBridge: Classify failed:", error);
            throw error;
        }
    },

    /**
     * Search for resources using the Go Backend.
     * @param {string} query 
     */
    async searchResources(query) {
        try {
            const response = await fetch(`${BASE_URLS.GO}/search?q=${encodeURIComponent(query)}`);

            if (!response.ok) {
                throw new Error(`Go Backend Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Suppressing console.error to avoid alarming red stack traces during intentional Gemini fallback 
            // when the local Go engine is known not to be running. Browser fetch failures are automatically logged anyway.
            throw error; // Propagate to caller for fallback handling
        }
    },

    /**
     * Generate text or JSON using the Python Backend (Gemini/OpenAI).
     * @param {string} prompt 
     * @param {string} systemPrompt 
     */
    async generateText(prompt, systemPrompt = "", options = {}) {
        const { localApi } = await import('../api/localApi');
        const isBackground = options.isBackground || false;

        try {
            const balance = await localApi.wallet.getBalance();
            if (!isBackground && balance < 1) throw new Error("INSUFFICIENT_CREDITS");

            let finalPrompt = prompt;
            if (options.response_json_schema) {
                finalPrompt += `\n\nIMPORTANT: You must return ONLY valid JSON exactly matching this schema:\n${JSON.stringify(options.response_json_schema, null, 2)}`;
            }

            const keys = getAPIKeys();
            const response = await fetch(`${BASE_URLS.PYTHON}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    systemPrompt,
                    ...(Object.values(keys).some(k => k !== null) ? { keys } : {}),
                    ...options
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Python Backend Error: ${response.status}`);
            }

            const result = await response.json();

            // Deduct credit only on success AND if not background
            if (!isBackground) {
                await localApi.wallet.spendCredits(1, `AI Inquiry: ${prompt.substring(0, 30)}...`);
            }

            // If response_json_schema was provided, try to parse text as JSON
            if (options.response_json_schema && typeof result.text === 'string') {
                try {
                    return this._extractAndParseJSON(result.text);
                } catch (e) {
                    console.warn("Failed to parse JSON from AI response, returning raw text", e);
                }
            }

            return result.text;
        } catch (error) {
            if (error.message === 'INSUFFICIENT_CREDITS') {
                import('sonner').then(({ toast }) => {
                    toast.error('Out of credits!', {
                        description: 'Top up your wallet to keep using AI features. You receive 10 free credits every month.',
                        duration: 6000
                    });
                });
            }
            console.error("BackendBridge: Generate failed:", error);
            throw error;
        }
    },

    /**
     * Robustly extracts and parses JSON from a string that might contain markdown or extra text.
     * Now uses centralized safeJsonParser for consistency.
     */
    _extractAndParseJSON(text) {
        return safeJsonParse(text, {
            throwOnError: true,
            verbose: true
        });
    }
};
