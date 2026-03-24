import { GoogleGenerativeAI } from "@google/generative-ai";
import { APP_CONFIG } from "../constants/app-config";
import { offlineService } from "./offline-service";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export class AIService {
    private static model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    static async generateResponse(prompt: string, useCache = true, systemPrompt = ""): Promise<string> {
        if (useCache) {
            const cached = await offlineService.getCachedResponse(prompt);
            if (cached) return cached;
        }

        const isOnline = await offlineService.isOnline();
        if (!isOnline) {
            throw new Error(APP_CONFIG.ERRORS.NETWORK);
        }

        try {
            const combinedPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
            const result = await this.model.generateContent(combinedPrompt);
            const response = await result.response;
            const text = response.text();

            if (useCache) {
                await offlineService.cacheResponse(prompt, text);
            }

            return text;
        } catch (error) {
            console.error("[AIService] Generation error:", error);
            throw new Error(APP_CONFIG.ERRORS.AI_GENERATION);
        }
    }

    /**
     * Multimodal generation for OCR and Image-to-Quiz features
     */
    static async generateResponseWithMedia(prompt: string, base64: string, mimeType: string): Promise<string> {
        try {
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64,
                        mimeType
                    }
                }
            ]);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("[AIService] Media error:", error);
            throw new Error("AI Vision analysis failed");
        }
    }

    // Matching Original Windows App Functions
    static async generateQuiz(topic: string, count: number = 5): Promise<any[]> {
        const prompt = `Generate ${count} multiple choice questions about "${topic}". 
        Return ONLY a JSON array of objects with fields: question, options (array of 4 strings), and correctAnswer (index 0-3).`;

        const response = await this.generateResponse(prompt);
        try {
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error("[AIService] Parse quiz error:", error);
            throw new Error("Failed to parse quiz data");
        }
    }

    static async generateSummary(content: string): Promise<string> {
        const prompt = `Summarize the following study material into structured notes with key points and a concise explanation:\n\n${content}`;
        return await this.generateResponse(prompt);
    }

    static async deepDive(topic: string): Promise<string> {
        const prompt = `Explain "${topic}" using the Feynman Technique. Break it down so a child could understand, then add technical depth.`;
        return await this.generateResponse(prompt);
    }

    static async gradeEssay(title: string, content: string): Promise<string> {
        const prompt = `Title: ${title}\n\nEssay Content: ${content}\n\nProvide constructive feedback, grading suggestions, and areas for improvement. Use the CAPS curriculum standards as a reference.`;
        return await this.generateResponse(prompt, false, "You are a professional academic assessor.");
    }

    static async findResources(query: string): Promise<any[]> {
        const prompt = `Find 5 high-quality, free educational resources for: "${query}".
        Return ONLY valid JSON array of objects: [{ "title": "...", "url": "...", "description": "...", "type": "video|pdf|tool" }]`;

        const response = await this.generateResponse(prompt, true, "You are an academic researcher.");
        try {
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            return [];
        }
    }

    static async findTelegramLinks(query: string) {
        const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const code = cleanQuery.split(' ')[0];

        return [
            {
                title: `[Search] "${cleanQuery}" PDFs on Telegram`,
                url: `https://www.google.com/search?q=site:t.me+${encodeURIComponent(cleanQuery)}+filetype:pdf`,
                type: "link"
            },
            {
                title: `@unisagroups_bot Search: ${code}`,
                url: `https://t.me/unisagroups_bot?start=${encodeURIComponent(code)}`,
                type: "bot"
            }
        ];
    }

    static async classifyDocument(content: string): Promise<any> {
        const prompt = `Classify this document content into one of: 'module', 'assignment', or 'material'.
        If it's a module, extract: title, code, credits.
        If it's an assignment, extract: title, module_id (guess from context), due_date (ISO), description.
        If it's material, extract: title, subject.
        Return ONLY valid JSON: { "type": "module|assignment|material", "data": { ... } }
        
        Content:
        ${content}`;

        const response = await this.generateResponse(prompt, false, "You are an academic organization expert.");
        try {
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            console.error("[AIService] Classify error:", error);
            throw new Error("Failed to classify document content");
        }
    }

    static async detectModuleFromContent(content: string, modules: { code: string, title: string }[]): Promise<string | null> {
        const modulesList = modules.map(m => `${m.code}: ${m.title}`).join('\n');
        const prompt = `SCAN this document content and find the matching module code from this list:
        
        ${modulesList}
        
        Return ONLY the code (e.g. CS101) or "NONE" if no match is found.
        
        Content:
        ${content.substring(0, 5000)}`;

        const response = await this.generateResponse(prompt, false);
        const code = response.trim().toUpperCase();
        return code === "NONE" ? null : code;
    }

    static async scanForPrescribedBooks(content: string): Promise<any[]> {
        const prompt = `Analyze this document and extract ALL prescribed/recommended books mentioned.
        For EACH book, extract title, author, and edition.
        Return ONLY valid JSON array: [{ "title": "...", "author": "...", "edition": "..." }]
        
        Content:
        ${content}`;

        const response = await this.generateResponse(prompt, false);
        try {
            const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        } catch (error) {
            return [];
        }
    }

    static cleanContentForAI(content: string, limit = 10000): string {
        if (!content) return '';
        let processed = content.replace(/\s+/g, ' ').trim();
        processed = processed.replace(/Page \d+ of \d+/gi, '');
        processed = processed.replace(/^\d+\s*$/gm, '');
        if (processed.length > limit) {
            processed = processed.substring(0, limit) + '...';
        }
        return processed;
    }
}
