import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { BackendBridge } from './backend-bridge';
import { getAPIKeys } from './env-config';
import { safeJsonParse, safeJsonParseArray } from './safeJsonParser';


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
            details: results
        };
    }

    // Fallback for web-only dev (should not be hit in Electron app)
    return {
        gemini: !!keys.gemini,
        deepseek: !!keys.deepseek,
        grok: !!keys.xai,
        openai: !!keys.openai,
        details: {}
    };
};

// Define available models - prioritization: 2.5 (requested) -> 2.0 (stable new) -> 1.5 (legacy stable)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-001"];

export const generateWithGemini = async (prompt, systemPrompt = "", options = {}) => {
    console.log("AI: Routing Gemini request to Python backend...");
    try {
        return await BackendBridge.generateText(prompt, systemPrompt, options);
    } catch (err) {
        console.warn("Python backend failed for Gemini prompt, falling back to JS SDK...", err);

        const geminiKey = getAPIKeys().gemini || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
        if (!geminiKey) throw new Error("AI Service Unavailable: Setup Gemini API key for fallback.");

        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const combinedPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;

        try {
            const result = await model.generateContent(combinedPrompt);
            return result.response.text();
        } catch (fallbackErr) {
            console.error("Gemini Direct Fallback failed:", fallbackErr);
            throw new Error("AI Service Unavailable: Both Backend and Gemini API failed.");
        }
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
            return await generateWithDeepSeek(prompt);
        } catch (err) {
            console.warn(`Summarize with ${provider} failed, trying fallback...`);
            // Fallback chain: OpenAI -> Grok -> DeepSeek
            return await generateWithOpenAI(prompt)
                .catch(() => generateWithGrok(prompt))
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

        // Try Local Python Backend first
        try {
            return await BackendBridge.classifyDocument(fileBase64, mimeType, options.isBackground || false);
        } catch (err) {
            console.warn("Local Python Backend unavailable, falling back to pure JS/API calls...", err);

            // Fallback to direct Gemini API call
            const geminiKey = getAPIKeys().gemini || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
            if (!geminiKey) throw new Error("AI Service Unavailable: Setup Gemini API key for fallback.");

            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Analyze this document and extract its properties.
Return ONLY valid JSON matching this schema:
{
  "title": "Document Title",
  "subject": "Academic Subject (e.g. Math, History)",
  "category": "Document Category (e.g. Assignment, Notes, Past Paper)",
  "type": "File Type description",
  "difficulty": "Beginner/Intermediate/Advanced",
  "summary": "A brief 2 sentence summary of the contents"
}
Do not use markdown code block wrappers like \`\`\`json. Just output the raw object.`;

            try {
                // Ensure base64 padding is removed if it has data url scheme
                const base64Clean = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;

                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Clean, mimeType } }
                ]);

                const text = result.response.text();
                // Clean typical JSON markdown wrapping
                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanText);
            } catch (fallbackErr) {
                console.error("Gemini Direct Fallback failed:", fallbackErr);
                throw new Error("AI Service Unavailable: Both Backend and Gemini API failed.");
            }
        }
    },


    async findResources(query, options = {}) {
        console.log(`Go findResources: Searching for "${query}"...`);

        // Try Local Go Backend first
        try {
            return await BackendBridge.searchResources(query);
        } catch (err) {
            console.warn("Local Go Backend unavailable, falling back to Gemini...", err);

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

