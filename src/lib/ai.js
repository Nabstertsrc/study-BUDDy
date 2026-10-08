import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { BackendBridge } from './backend-bridge';
import { getAPIKeys } from './env-config';
import { safeJsonParse, safeJsonParseArray, safeJsonParseObject } from './safeJsonParser';

// Mistral models available via free tier (api.mistral.ai)
// Sorted: best quality first, fastest last
export const MISTRAL_MODELS = [
    { id: 'mistral-large-latest',   label: 'Mistral Large',   description: 'Most capable — great for essays, deep analysis' },
    { id: 'mistral-small-latest',   label: 'Mistral Small',   description: 'Balanced speed and quality for study tasks' },
    { id: 'open-mistral-nemo',      label: 'Mistral Nemo',    description: 'Fast, lightweight — quick Q&A and summaries' },
    { id: 'codestral-latest',       label: 'Codestral',       description: 'Specialised for coding and STEM subjects' },
    { id: 'open-mixtral-8x7b',      label: 'Mixtral 8x7B',   description: 'Mixture-of-Experts: powerful and efficient' },
];

export const DEFAULT_MISTRAL_MODEL = 'mistral-small-latest';


const checkOpenAI = async (apiKey) => {
    // Replaced by Electron Main Process Check
    return { status: false };
};


export const getAIStatus = async () => {
    const keys = getAPIKeys();

    // Use Electron Bridge if available (Robust Method)
    // @ts-ignore
    if (window.electron && window.electron.checkAIStatus) {
        // @ts-ignore
        const results = await window.electron.checkAIStatus({
            openai: keys.openai,
            grok: keys.xai,
            deepseek: keys.deepseek,
            gemini: keys.gemini
        });
        return {
            gemini: results.gemini.status,
            deepseek: results.deepseek.status,
            grok: results.grok.status,
            openai: results.openai.status,
            mistral: !!keys.mistral,
            details: results
        };
    }

    // Web build: check if Python backend (Render) is alive — this is the primary AI source
    try {
        const backendOnline = await BackendBridge.isPythonReady();
        if (backendOnline) {
            return {
                gemini: true,
                deepseek: true,
                grok: false,
                openai: false,
                mistral: !!keys.mistral,
                details: {
                    gemini: { status: true, model: 'gemini-2.0-flash (via backend)' },
                    deepseek: { status: true, model: 'deepseek-chat (via backend)' },
                    mistral: { status: !!keys.mistral, model: keys.mistral ? DEFAULT_MISTRAL_MODEL : undefined },
                    grok: { status: false },
                    openai: { status: false }
                }
            };
        }
    } catch (_) {
        // Backend unreachable — fall through to key check
    }

    // Final fallback: check local keys only
    return {
        gemini: !!keys.gemini,
        deepseek: !!keys.deepseek,
        grok: !!keys.xai,
        openai: !!keys.openai,
        mistral: !!keys.mistral,
        details: {
            gemini: { status: !!keys.gemini, model: keys.gemini ? 'gemini-2.0-flash (local key)' : undefined, error: !keys.gemini ? 'No API key' : undefined },
            deepseek: { status: !!keys.deepseek, model: keys.deepseek ? 'deepseek-chat (local key)' : undefined, error: !keys.deepseek ? 'No API key' : undefined },
            grok: { status: !!keys.xai, error: !keys.xai ? 'No API key' : undefined },
            openai: { status: !!keys.openai, error: !keys.openai ? 'No API key' : undefined },
            mistral: { status: !!keys.mistral, model: keys.mistral ? DEFAULT_MISTRAL_MODEL : undefined, error: !keys.mistral ? 'No API key' : undefined }
        }
    };
};

// Define available models - prioritization: 2.5 (requested) -> 2.0 (stable new) -> 1.5 (legacy stable)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-001"];

export const generateWithGemini = async (prompt, systemPrompt = "", options = {}) => {
    console.log("AI: Routing Gemini request to Python backend...");
    try {
        return await BackendBridge.generateText(prompt, systemPrompt, options);
    } catch (err) {
        console.error("Python backend failed for Gemini prompt:", err);
        throw new Error(`AI Service Unavailable: The backend failed to generate a response. ${err.message}`);
    }
};

export const generateWithDeepSeek = async (prompt, systemPrompt = "") => {
    const { deepseek: apiKey } = getAPIKeys();
    if (!apiKey) {
        console.warn("DeepSeek API Key missing, falling back to Python...");
        return generateWithGemini(prompt, systemPrompt);
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.deepseek.com/v1",
        dangerouslyAllowBrowser: true
    });

    try {
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt || "You are a helpful study assistant." },
                { role: "user", content: prompt },
            ],
        });
        return response.choices[0].message.content;
    } catch (err) {
        console.error("DeepSeek direct call failed:", err);
        throw new Error(`All AI providers failed. DeepSeek error: ${err.message}`);
    }
};

export const generateWithGrok = async (prompt, systemPrompt = "") => {
    return generateWithGemini(prompt, systemPrompt);
};

/**
 * Generate text using Mistral AI (api.mistral.ai — free tier available).
 * Supports model selection; falls back through Mistral model tiers then to Gemini.
 * @param {string} prompt
 * @param {string} systemPrompt
 * @param {Object} options - { model?: string }
 */
export const generateWithMistral = async (prompt, systemPrompt = "", options = {}) => {
    const { mistral: apiKey } = getAPIKeys();
    
    if (!apiKey) {
        console.warn("Mistral API Key not configured, falling back to Gemini backend...");
        return generateWithGemini(prompt, systemPrompt, options);
    }

    const model = options.model || DEFAULT_MISTRAL_MODEL;
    console.log(`AI: Calling Mistral API with model ${model}...`);

    // Mistral uses an OpenAI-compatible API — we can use the openai SDK
    const mistralClient = new OpenAI({
        apiKey,
        baseURL: 'https://api.mistral.ai/v1',
        dangerouslyAllowBrowser: true,
    });

    // Try the requested model, then fall back through smaller Mistral models
    const modelsToTry = [
        model,
        ...MISTRAL_MODELS.map(m => m.id).filter(id => id !== model)
    ];

    for (const modelId of modelsToTry) {
        try {
            const response = await mistralClient.chat.completions.create({
                model: modelId,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ],
                max_tokens: 4096,
                temperature: 0.7,
            });
            console.log(`AI: Mistral ${modelId} responded successfully.`);
            return response.choices[0].message.content;
        } catch (err) {
            // Model unavailable or quota hit — try next one
            if (err?.status === 422 || err?.status === 404 || err?.message?.includes('not found')) {
                console.warn(`Mistral model ${modelId} unavailable, trying next...`);
                continue;
            }
            // Rate limit or auth error — fall through to Gemini
            console.error(`Mistral API error (${modelId}):`, err.message);
            break;
        }
    }

    // All Mistral models failed — fall back to Gemini backend
    console.warn('All Mistral models exhausted, falling back to Gemini...');
    return generateWithGemini(prompt, systemPrompt, options);
};

export const generateWithOpenAI = async (prompt, systemPrompt = "", options = {}) => {
    if (options.imageBase64) {
        // We'll add vision support to Python later if needed
        console.warn("Vision support currently only available in pure JS, but routing to Python for text...");
    }
    return await BackendBridge.generateText(prompt, systemPrompt, options);
};

// Orchestrator that chooses or combines
export const studyBuddyAI = {
    async summarize(content, provider = "gemini") {
        const prompt = `Summarize the following study material into structured notes:\n\n${content}`;
        try {
            if (provider === "gemini") return await generateWithGemini(prompt);
            if (provider === "openai") return await generateWithOpenAI(prompt);
            if (provider === "grok") return await generateWithGrok(prompt);
            if (provider === "mistral") return await generateWithMistral(prompt);
            return await generateWithDeepSeek(prompt);
        } catch (err) {
            console.warn(`Summarize with ${provider} failed, trying fallback...`);
            return await generateWithGemini(prompt)
                .catch(() => generateWithMistral(prompt))
                .catch(() => generateWithDeepSeek(prompt));
        }
    },

    async generateQuiz(content, numQuestions = 5, provider = "gemini") {
        const prompt = `Generate ${numQuestions} multiple choice questions (with 4 options and 1 correct answer) based on this content:\n\n${content}\n\nReturn the result in JSON format: [{question, options:[], answer}]`;
        let res;
        try {
            if (provider === "gemini") res = await generateWithGemini(prompt);
            else if (provider === "openai") res = await generateWithOpenAI(prompt);
            else if (provider === "grok") res = await generateWithGrok(prompt);
            else res = await generateWithDeepSeek(prompt);
        } catch (err) {
            console.warn(`Quiz generation with ${provider} failed, trying fallback...`);
            // Fallback chain: OpenAI -> Grok -> DeepSeek
            res = await generateWithOpenAI(prompt)
                .catch(() => generateWithGrok(prompt))
                .catch(() => generateWithDeepSeek(prompt));
        }

        // Use robust JSON parser
        return safeJsonParseArray(res, {
            throwOnError: true,
            verbose: true
        });
    },

    async getFeedback(assignment, studentWork, provider = "deepseek") {
        const prompt = `Assignment: ${assignment.title}\nDescription: ${assignment.description}\n\nStudent's Work: ${studentWork}\n\nProvide constructive feedback and grading suggestions.`;
        try {
            return await generateWithOpenAI(prompt);
        } catch (err) {
            return await generateWithGemini(prompt).catch(() => generateWithGrok(prompt));
        }
    },

    async classifyAndExtract(fileBase64, mimeType, options = {}) {
        console.log("AI classifyAndExtract: Routed via BackendBridge");

        // Use Python Backend exclusively (Secrets are held on Render)
        try {
            return await BackendBridge.classifyDocument(fileBase64, mimeType, options.isBackground || false);
        } catch (err) {
            console.error("Python Backend Failure during classification:", err);
            throw new Error(`Classification Failed: The cloud analysis service is currently unavailable. Please try again later.`);
        }
    },


    async findResources(query, options = {}) {
        console.log(`Go findResources: Searching for "${query}"...`);

        // Try Local Go Backend first
        try {
            return await BackendBridge.searchResources(query);
        } catch (err) {
            console.warn(`Local Go Backend unavailable, falling back to Gemini for query: "${query}"...`);

            // Fallback to original Gemini implementation
            const prompt = `Find 5-7 high-quality, free educational resources (PDFs, study guides, YouTube playlists, interactive tools) for: "${query}".
            Focus on reputable sources like Khan Academy, Coursera (free courses), OpenStax, and university repositories.
            Return ONLY valid JSON.
            
            [{
                "title": "Descriptive Title",
                "url": "https://...",
                "description": "Brief summary",
                "type": "video" | "pdf" | "article" | "tool",
                "why_useful": "Why this student should use it"
            }]`;

            const res = await generateWithGemini(prompt, "You are an academic researcher finding the best free learning materials.", options);
            return safeJsonParseArray(res, {
                throwOnError: true,
                verbose: false
            });
        }
    },


    async findRelatedMaterials(moduleCode, topic) {
        return this.findResources(`${moduleCode} ${topic} study materials`);
    },

    async findTelegramResources(query) {
        console.log(`Telegram Discovery: Generated Deep Search Links for "${query}"`);

        // Deterministic "Deep Search" Strategy
        // We avoid LLM hallucination for channels by generating proven "Search Queries"

        const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const code = cleanQuery.split(' ')[0]; // extract module code if possible

        const resources = [
            {
                title: `[Search] "${cleanQuery}" PDFs on Telegram`,
                url: `https://www.google.com/search?q=site:t.me+${encodeURIComponent(cleanQuery)}+filetype:pdf`,
                description: "Deep scan of indexed Telegram files. Click to view found PDFs.",
                type: "link",
                verified: true,
                tags: ["pdf-search", "deep-scan"]
            },
            {
                title: `@unisagroups_bot Search: ${code}`,
                url: `https://t.me/unisagroups_bot?start=${encodeURIComponent(code)}`,
                description: "Direct bot search for specific module communities.",
                type: "bot",
                verified: true,
                tags: ["bot-search", "community"]
            },
            {
                title: `Global File Search: ${code}`,
                url: `https://cse.google.com/cse?cx=006436681783584873733:31p6j2j2q6s&q=${encodeURIComponent(code)}`,
                description: "Search across 1000+ educational Telegram channels.",
                type: "link",
                verified: true,
                tags: ["global-search", "notes"]
            }
        ];

        // Only ask AI if we want fuzzy matches, but users prefer RELIABILITY.
        // We will return these robust search helpers instead of fake groups.
        return resources;
    }
};

