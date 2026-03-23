import React, { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { localApi } from "@/api/localApi";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAPIKeys } from "@/lib/env-config";
import {
    MessageSquareText,
    Upload,
    FileText,
    Send,
    User,
    Bot,
    Loader2,
    Sparkles,
    X,
    File,
    BookOpen,
    ArrowRight,
    RotateCcw,
    Lightbulb,
    Copy,
    CheckCircle,
    ChevronDown,
    AlertCircle,
    Zap,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Radio,
    PhoneOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ProfessionalAIContent } from "@/components/ui/ProfessionalAIContent";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { isPDF } from "@/lib/pdfProcessor";
import AILoadingState from "@/components/ui/AILoadingState";

// Track backend availability so we don't waste time retrying a dead server
let _backendDown = false;

/**
 * Quick health check for the Python sidecar (2s timeout).
 * If it fails once, we cache the result and skip all future backend calls.
 */
const isBackendAvailable = async () => {
    if (_backendDown) return false;
    try {
        const res = await fetch("https://queue-marshal-server-production-a2fe.up.railway.app/health", {
            method: "GET",
            signal: AbortSignal.timeout(2000)
        });
        return res.ok;
    } catch {
        console.log("DocumentChat: Python backend is offline — using direct Gemini for all AI calls.");
        _backendDown = true;
        return false;
    }
};

/**
 * Call AI directly via the Gemini SDK (no backend needed).
 */
const callGeminiDirect = async (prompt, systemPrompt = "") => {
    try {
        await localApi.wallet.spendCredits(1, "Document Chat");
    } catch (e) {
        throw new Error("You have run out of credits! Please upgrade or top up your balance.");
    }

    const keys = getAPIKeys();
    if (!keys.gemini) {
        throw new Error("No AI service available. Please ensure your Gemini API key is configured in Settings.");
    }

    try {
        const genAI = new GoogleGenerativeAI(keys.gemini);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (err) {
        console.warn("[Wallet] Refunding 1 credit due to Gemini API failure...");
        await localApi.wallet.addCredits(1, { amount: 0, currency: 'USD', note: 'Refund for failed Gemini Chat' });
        throw err;
    }
};

/**
 * Resilient AI caller: uses backend if available, otherwise calls Gemini directly.
 */
const callAI = async (prompt, systemPrompt = "") => {
    const backendUp = await isBackendAvailable();
    if (backendUp) {
        try {
            return await base44.integrations.Core.InvokeLLM({ prompt, systemPrompt });
        } catch (err) {
            if (err.message && err.message.includes("credits")) {
                throw err; // Don't fall back, this is a hard stop
            }
            console.warn("DocumentChat: Backend call failed, falling back to Gemini direct:", err.message);
            _backendDown = true;
        }
    }

    // Direct Gemini API call (deducts credit internally)
    return await callGeminiDirect(prompt, systemPrompt);
};

/**
 * Extract text from a PDF — uses Gemini Vision with inline base64 data.
 */
const extractPDFWithGemini = async (base64Data) => {
    const backendUp = await isBackendAvailable();
    if (backendUp) {
        try {
            return await base44.integrations.Core.InvokeLLM({
                prompt: "Extract ALL text content from this PDF document. Return ONLY the raw extracted text, preserving the structure and paragraph formatting. Do not add any commentary, headers, or explanations. Just the pure document text.",
                systemPrompt: "You are an OCR and text extraction assistant. Extract text accurately and completely.",
                file_urls: [`data:application/pdf;base64,${base64Data}`]
            });
        } catch (err) {
            if (err.message && err.message.includes("credits")) {
                throw err;
            }
            console.warn("DocumentChat: Backend PDF extraction failed, using direct Gemini:", err.message);
            _backendDown = true;
        }
    }

    try {
        await localApi.wallet.spendCredits(1, "Document Processing");
    } catch (e) {
        throw new Error("You have run out of credits! Please upgrade or top up your balance.");
    }

    // Direct Gemini API with inline PDF data
    const keys = getAPIKeys();
    if (!keys.gemini) {
        throw new Error("No AI service available. Please configure your Gemini API key in Settings.");
    }

    try {
        const genAI = new GoogleGenerativeAI(keys.gemini);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent([
            "Extract ALL text content from this PDF document. Return ONLY the raw extracted text, preserving the structure and paragraph formatting. Do not add any commentary, headers, or explanations. Just the pure document text.",
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                }
            }
        ]);
        return result.response.text();
    } catch (err) {
        console.warn("[Wallet] Refunding 1 credit due to Gemini PDF processing failure...");
        await localApi.wallet.addCredits(1, { amount: 0, currency: 'USD', note: 'Refund for failed document processing' });
        throw err;
    }
};

const SUGGESTED_QUESTIONS = [
    "Summarize the key points of this document",
    "What are the main concepts discussed?",
    "Create a study guide from this content",
    "What are the most important definitions?",
    "Explain the hardest concept in simple terms",
    "What topics should I focus on for an exam?",
];

export default function DocumentChat({ materials = [] }) {
    const [file, setFile] = useState(null);
    const [documentContent, setDocumentContent] = useState("");
    const [documentTitle, setDocumentTitle] = useState("");
    const [extracting, setExtracting] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [question, setQuestion] = useState("");
    const [generating, setGenerating] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [showMaterialPicker, setShowMaterialPicker] = useState(false);
    const [materialSearch, setMaterialSearch] = useState("");

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [conversation, generating]);

    // Focus input when document is loaded
    useEffect(() => {
        if (documentContent && inputRef.current) {
            inputRef.current.focus();
        }
    }, [documentContent]);

    // ========== VOICE CHAT STATE ==========
    const [voiceMode, setVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [azureVoiceId, setAzureVoiceId] = useState("en-US-JennyNeural");
    const azureVoicesList = [
        { voice_id: "en-US-JennyNeural", name: "Jenny (Warm Female)" },
        { voice_id: "en-US-GuyNeural", name: "Guy (Professional Male)" },
        { voice_id: "en-US-AriaNeural", name: "Aria (Friendly Female)" },
        { voice_id: "en-US-DavisNeural", name: "Davis (Casual Male)" },
        { voice_id: "en-GB-SoniaNeural", name: "Sonia (British Female)" },
        { voice_id: "en-GB-RyanNeural", name: "Ryan (British Male)" },
        { voice_id: "en-AU-NatashaNeural", name: "Natasha (Aussie Female)" },
        { voice_id: "en-AU-WilliamNeural", name: "William (Aussie Male)" }
    ];
    const [availableVoices, setAvailableVoices] = useState([]);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const currentUtteranceRef = useRef(null);
    const audioPlayerRef = useRef(null);

    // Load available browser voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            setAvailableVoices(voices);
            // Prefer an English female voice for the "teacher" feel
            const preferred = voices.find(v =>
                v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
            ) || voices.find(v =>
                v.lang.startsWith('en') && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'))
            ) || voices.find(v => v.lang.startsWith('en'));
            if (preferred) setSelectedVoice(preferred);
        };
        loadVoices();
        speechSynthesis.onvoiceschanged = loadVoices;
        return () => { speechSynthesis.onvoiceschanged = null; };
    }, []);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            stopSpeaking();
            stopListening();
        };
    }, []);

    // ========== SPEECH RECOGNITION (Mic → Text) ==========
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        // Stop any ongoing speech before listening
        stopSpeaking();

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceTranscript("");
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            setVoiceTranscript(finalTranscript || interimTranscript);
            if (finalTranscript) {
                setQuestion(finalTranscript);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            // Auto-submit in voice mode if we got text
            if (voiceMode && voiceTranscript) {
                // Small delay to ensure state is updated
                setTimeout(() => {
                    const q = voiceTranscript.trim();
                    if (q) askQuestion(q);
                }, 200);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                toast.error("Microphone access denied.", {
                    description: "Please allow microphone access in your browser settings."
                });
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // ========== SPEECH SYNTHESIS (Text → Voice) ==========
    const speakText = async (text) => {
        if (!text) return;

        // Stop any current speech (both standard & 11labs)
        stopSpeaking();

        // Clean markdown formatting from text for better TTS
        // Strip out asterisks, underscores, hashes, italics, bold
        const cleanText = text
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/[*_~`]/g, '') // Remove bold, italics, code, tildes fully
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
            .replace(/\n- /g, '\n') // Remove list dashes
            .replace(/\n\d+\. /g, '\n') // Remove numbered lists
            .replace(/---/g, '') // Remove dividers
            .replace(/[\\{}\[\]|,]/g, ' ') // Remove backslashes, brackets, braces, pipes, commas
            .replace(/⚠️|📚|🎯|✅|❌|💡|🔑|🌟|💪|✨|🎙️|🔊/g, '') // Remove emojis
            .trim();

        setIsSpeaking(true);

        const azureKey = import.meta.env.VITE_AZURE_SPEECH_KEY;
        const azureRegion = import.meta.env.VITE_AZURE_SPEECH_REGION;

        // Try Azure TTS if key is present
        if (azureKey && azureRegion) {
            try {
                // Escape XML characters for SSML safely
                const safeText = cleanText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${azureVoiceId}'><prosody rate="-5%">${safeText}</prosody></voice></speak>`;

                const response = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                    method: 'POST',
                    headers: {
                        'Ocp-Apim-Subscription-Key': azureKey,
                        'Content-Type': 'application/ssml+xml',
                        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
                    },
                    body: ssml
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audioPlayerRef.current = audio;

                    audio.onended = () => {
                        setIsSpeaking(false);
                        // Auto-listen after speaking in voice mode
                        if (voiceMode) {
                            setTimeout(() => startListening(), 500);
                        }
                        URL.revokeObjectURL(url);
                    };

                    audio.onerror = () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(url);
                    };

                    audio.play();
                    return; // Successfully played with Azure
                } else {
                    console.warn("Azure TTS failed, falling back to browser TTS", await response.text());
                }
            } catch (error) {
                console.error("Azure TTS error:", error);
            }
        }

        // Fallback to standard browser TTS
        const sentences = cleanText.match(/[^.!?\n]+[.!?\n]*/g) || [cleanText];
        const chunks = [];
        let current = '';
        for (const sentence of sentences) {
            if ((current + sentence).length > 200) {
                if (current) chunks.push(current.trim());
                current = sentence;
            } else {
                current += sentence;
            }
        }
        if (current.trim()) chunks.push(current.trim());

        const speakChunk = (index) => {
            if (index >= chunks.length) {
                setIsSpeaking(false);
                // Auto-listen after speaking in voice mode
                if (voiceMode) {
                    setTimeout(() => startListening(), 500);
                }
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[index]);
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            utterance.volume = 1;
            if (selectedVoice) utterance.voice = selectedVoice;

            utterance.onend = () => speakChunk(index + 1);
            utterance.onerror = () => {
                setIsSpeaking(false);
            };

            currentUtteranceRef.current = utterance;
            synthRef.current.speak(utterance);
        };

        speakChunk(0);
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
            audioPlayerRef.current = null;
        }
        setIsSpeaking(false);
    };

    const toggleVoiceMode = () => {
        if (voiceMode) {
            // Exiting voice mode
            stopSpeaking();
            stopListening();
            setVoiceMode(false);
        } else {
            // Entering voice mode
            setVoiceMode(true);
            toast.success("🎙️ Voice Tutor Mode activated!", {
                description: "Speak your questions and listen to AI explanations."
            });
            // Auto-start listening after a brief delay
            setTimeout(() => startListening(), 800);
        }
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const processFile = async (selectedFile) => {
        setFile(selectedFile);
        setDocumentTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        setExtracting(true);
        setConversation([]);

        try {
            // Read file content
            if (selectedFile.type === "application/pdf") {
                // Convert to base64
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(selectedFile);
                    reader.onload = () => {
                        const dataUrl = /** @type {string} */ (reader.result);
                        resolve(dataUrl.split(',')[1]);
                    };
                    reader.onerror = reject;
                });

                // Use resilient PDF extraction (backend -> direct Gemini fallback)
                const extractedText = await extractPDFWithGemini(base64);

                setDocumentContent(extractedText);
                toast.success("Document processed successfully!", {
                    description: `${selectedFile.name} is ready for conversation.`
                });
            } else {
                // Text file: read directly — no AI needed
                const text = await selectedFile.text();
                setDocumentContent(text);
                toast.success("Document loaded!", {
                    description: `${selectedFile.name} is ready for conversation.`
                });
            }
        } catch (error) {
            console.error("Document processing error:", error);
            toast.error("Failed to process document", {
                description: error.message || "Please try again or use a different format."
            });
            setFile(null);
            setDocumentTitle("");
        } finally {
            setExtracting(false);
        }
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf" || droppedFile.type.includes("text")) {
                await processFile(droppedFile);
            } else {
                toast.error("Unsupported file type", {
                    description: "Please upload a PDF or text file."
                });
            }
        }
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    const selectExistingMaterial = async (material) => {
        setShowMaterialPicker(false);
        setDocumentTitle(material.title);
        setExtracting(true);
        setConversation([]);

        try {
            if (material.content && material.content.length > 50) {
                // Use existing extracted content — no AI call needed!
                setDocumentContent(material.content);
                setFile({ name: material.title, type: material.type === 'pdf' ? 'application/pdf' : 'text/plain' });
                toast.success("Material loaded!", {
                    description: `${material.title} is ready for conversation.`
                });
            } else if (material.file_url) {
                // Need to extract content from file_url using resilient AI
                const extractedText = await callAI(
                    `Extract ALL text content from the document at: ${material.file_url}. Return ONLY the raw extracted text, preserving the structure. Do not add any commentary.`,
                    "You are a text extraction assistant."
                );

                setDocumentContent(extractedText);
                setFile({ name: material.title, type: material.type === 'pdf' ? 'application/pdf' : 'text/plain' });
                toast.success("Material processed!", {
                    description: `${material.title} is ready for conversation.`
                });
            } else {
                toast.error("Material has no content to chat with.");
            }
        } catch (error) {
            console.error("Material loading error:", error);
            toast.error("Failed to load material content.", {
                description: error.message
            });
        } finally {
            setExtracting(false);
        }
    };

    const askQuestion = async (questionText = null) => {
        const q = questionText || question;
        if (!q.trim() || !documentContent || generating) return;

        const userMessage = { role: "user", content: q };
        const newConversation = [...conversation, userMessage];
        setConversation(newConversation);
        setQuestion("");
        setGenerating(true);

        try {
            // Build conversation history for context
            const historyContext = newConversation
                .slice(-6) // Keep last 6 messages for context
                .map(m => `${m.role === "user" ? "Student" : "AI Tutor"}: ${m.content}`)
                .join("\n\n");

            const truncatedContent = documentContent.length > 12000
                ? documentContent.substring(0, 12000) + "\n\n[Document truncated for processing...]"
                : documentContent;

            const prompt = `You are an intelligent study assistant helping a student understand a document they uploaded.

DOCUMENT TITLE: "${documentTitle}"

DOCUMENT CONTENT:
---
${truncatedContent}
---

CONVERSATION SO FAR:
${historyContext}

STUDENT'S QUESTION: "${q}"

INSTRUCTIONS:
1. Prioritize answering based on the document content provided above to ensure accuracy.
2. If the document does not contain the answer, seamlessly use your expansive AI knowledge to answer the question, but gently note that you are drawing from general knowledge beyond the document.
3. Be an active study buddy: provide extra context and rich explanations related to the course subject to help the student learn holistically.
4. Use clear formatting with headers, bullet points, and emphasis where appropriate.
5. Be incredibly encouraging, natural, and supportive in tone.
6. Suggest highly relevant follow-up questions the student could ask to dive deeper into the overarching subject.
7. Output purely in elegant markdown formatting.`;

            // Use resilient AI caller (backend -> direct Gemini fallback)
            const response = await callAI(
                prompt,
                "You are a brilliant, patient, world-class study tutor. Your primary goal is to help the student deeply understand their uploaded document, but you must also act as a limitless knowledge base for their overarching course subject. Provide holistic, context-rich explanations using gorgeous structured markdown. Be highly encouraging and engaging."
            );

            setConversation([...newConversation, { role: "assistant", content: response }]);

            // Auto-speak AI response if voice mode or autoSpeak is on
            if (voiceMode || autoSpeak) {
                speakText(response);
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errMsg = "⚠️ I had trouble processing your question. This could be due to insufficient credits or a connection issue. Please try again!";
            setConversation([
                ...newConversation,
                { role: "assistant", content: errMsg }
            ]);
            toast.error("Failed to get response. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const copyMessage = (content, idx) => {
        navigator.clipboard.writeText(content);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
        toast.success("Copied to clipboard!");
    };

    const resetChat = () => {
        stopSpeaking();
        stopListening();
        setVoiceMode(false);
        setFile(null);
        setDocumentContent("");
        setDocumentTitle("");
        setConversation([]);
        setQuestion("");
        setExtracting(false);
        setGenerating(false);
    };

    const filteredMaterials = materials?.filter(m =>
        (m.content && m.content.length > 50) || m.file_url
    ).filter(m =>
        !materialSearch || m.title?.toLowerCase().includes(materialSearch.toLowerCase())
    ) || [];

    // ========== EXTRACTING STATE ==========
    if (extracting) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <AILoadingState
                    title="Processing Your Document"
                    message={`Reading and understanding "${documentTitle}". Preparing it for an interactive conversation...`}
                />
            </motion.div>
        );
    }

    // ========== UPLOAD / SELECT STATE ==========
    if (!documentContent) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Hero Upload Area */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-violet-500/10" />
                    <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

                    <div className="relative bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-white/60 shadow-2xl p-8 lg:p-12">
                        {/* Header */}
                        <div className="flex items-center gap-5 mb-10">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                                <MessageSquareText className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-3xl tracking-tighter bg-gradient-to-r from-cyan-700 via-blue-700 to-violet-700 bg-clip-text text-transparent">
                                    Chat with Document
                                </h3>
                                <p className="text-slate-500 font-bold text-base mt-1">Upload a document and have an AI-powered conversation about its contents</p>
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={cn(
                                "border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-300",
                                dragActive
                                    ? "border-cyan-500 bg-cyan-50/50 scale-[1.01]"
                                    : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/20"
                            )}
                        >
                            <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
                                <Upload className="w-10 h-10 text-slate-400" />
                            </div>
                            <p className="font-black text-xl text-slate-900 mb-2">
                                Drag & drop your document here
                            </p>
                            <p className="text-slate-500 mb-6 font-medium">
                                Supports PDF and text files • Max 50 pages recommended
                            </p>
                            <label className="cursor-pointer group inline-block">
                                <input
                                    type="file"
                                    accept=".pdf,.txt,.md,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all group-hover:scale-[1.02]">
                                    <File className="w-4 h-4" />
                                    Browse Files
                                </div>
                            </label>
                        </div>

                        {/* OR Divider */}
                        {materials && materials.length > 0 && (
                            <>
                                <div className="flex items-center gap-4 my-8">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">or select from your materials</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>

                                {/* Material Picker */}
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Search your uploaded materials..."
                                        value={materialSearch}
                                        onChange={(e) => setMaterialSearch(e.target.value)}
                                        className="rounded-xl border-slate-200 bg-white/60"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pencil-scroll pr-2">
                                        {filteredMaterials.slice(0, 10).map((material) => (
                                            <motion.button
                                                key={material.id}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => selectExistingMaterial(material)}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all text-left group"
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                    material.type === "pdf" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                                                )}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-slate-900 truncate group-hover:text-cyan-700 transition-colors">
                                                        {material.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {material.type?.toUpperCase() || "Document"} • {material.content ? `${Math.round(material.content.length / 1000)}K chars` : "Needs extraction"}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                                            </motion.button>
                                        ))}
                                    </div>

                                    {filteredMaterials.length === 0 && (
                                        <div className="text-center py-6 text-slate-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm font-medium">No materials found</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: MessageSquareText, title: "Natural Conversation", desc: "Ask questions in plain language about your document", color: "from-cyan-500 to-blue-500" },
                        { icon: Lightbulb, title: "Deep Understanding", desc: "Get explanations, summaries, and key insights", color: "from-violet-500 to-purple-500" },
                        { icon: BookOpen, title: "Exam Preparation", desc: "Generate study guides and practice questions", color: "from-emerald-500 to-teal-500" },
                    ].map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-shadow"
                        >
                            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg", card.color)}>
                                <card.icon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{card.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{card.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    }

    // ========== CHAT INTERFACE ==========
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row gap-6"
        >
            {/* Sidebar — Document Info */}
            <div className="lg:w-72 shrink-0 space-y-4">
                <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/60 shadow-xl">
                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        Document Loaded
                    </h4>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 mb-4">
                        <p className="text-cyan-900 font-bold text-sm leading-tight truncate">{documentTitle}</p>
                        <p className="text-xs text-cyan-600 mt-1">
                            {Math.round(documentContent.length / 1000)}K characters
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl h-10 font-bold border-2 hover:bg-slate-50 text-xs"
                            onClick={resetChat}
                        >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" />
                            New Document
                        </Button>

                        {/* Voice Mode Toggle */}
                        <Button
                            onClick={toggleVoiceMode}
                            className={cn(
                                "w-full rounded-xl h-10 font-bold border-2 text-xs transition-all",
                                voiceMode
                                    ? "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white border-rose-300 shadow-lg shadow-rose-500/20"
                                    : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-violet-300 shadow-lg shadow-violet-500/20"
                            )}
                        >
                            {voiceMode ? (
                                <><PhoneOff className="w-3.5 h-3.5 mr-2" /> End Voice Session</>
                            ) : (
                                <><Radio className="w-3.5 h-3.5 mr-2" /> 🎙️ Voice Tutor Mode</>
                            )}
                        </Button>

                        {/* Auto-Speak Toggle */}
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full rounded-xl h-10 font-bold border-2 text-xs",
                                autoSpeak ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""
                            )}
                            onClick={() => setAutoSpeak(!autoSpeak)}
                        >
                            {autoSpeak ? (
                                <><Volume2 className="w-3.5 h-3.5 mr-2" /> Auto-Read: ON</>
                            ) : (
                                <><VolumeX className="w-3.5 h-3.5 mr-2" /> Auto-Read: OFF</>
                            )}
                        </Button>

                        {/* Azure Voice Selection */}
                        {azureVoicesList.length > 0 && (
                            <div className="pt-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block tracking-widest pl-1">
                                    Tutor Voice
                                </label>
                                <Select value={azureVoiceId} onValueChange={setAzureVoiceId}>
                                    <SelectTrigger className="w-full rounded-xl border-2 hover:border-cyan-200 text-xs font-bold h-10 bg-white">
                                        <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-2 max-h-[300px]">
                                        {azureVoicesList.map((v) => (
                                            <SelectItem key={v.voice_id} value={v.voice_id} className="text-xs font-bold py-2.5 rounded-lg cursor-pointer">
                                                {v.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {conversation.length > 0 && (
                            <Button
                                variant="outline"
                                className="w-full rounded-xl h-10 font-bold border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-xs"
                                onClick={() => { stopSpeaking(); setConversation([]); }}
                            >
                                <X className="w-3.5 h-3.5 mr-2" />
                                Clear Chat
                            </Button>
                        )}
                    </div>
                </div>

                {/* Suggested Questions */}
                {conversation.length < 2 && (
                    <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border-2 border-white/60 shadow-xl">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Try Asking
                        </h4>
                        <div className="space-y-2">
                            {SUGGESTED_QUESTIONS.map((sq, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ x: 4 }}
                                    onClick={() => askQuestion(sq)}
                                    disabled={generating}
                                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-100 hover:border-cyan-200 text-xs font-medium text-slate-600 hover:text-cyan-700 transition-all disabled:opacity-50"
                                >
                                    {sq}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 min-w-0">
                <div className="relative bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border-2 border-white/60 shadow-2xl shadow-cyan-900/5 overflow-hidden flex flex-col h-[700px]">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <MessageSquareText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-white tracking-tight">Document Assistant</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                                    <p className="text-[10px] uppercase font-black tracking-widest text-cyan-200">
                                        Ready • {conversation.filter(m => m.role === "assistant").length} responses
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Badge className="bg-white/15 text-white border-white/20 text-[10px] font-bold px-3">
                            <Zap className="w-3 h-3 mr-1" />
                            AI Powered
                        </Badge>
                    </div>

                    {/* Messages */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 pencil-scroll scroll-smooth"
                    >
                        {/* Welcome Message */}
                        {conversation.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl rounded-tl-md p-6 border border-cyan-100">
                                    <p className="font-bold text-slate-900 mb-2">
                                        👋 Hi! I've loaded your document: <span className="text-cyan-700">"{documentTitle}"</span>
                                    </p>
                                    <p className="text-sm text-slate-600 mb-4">
                                        I've read the entire document and I'm ready to help you understand it. Ask me anything!
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTED_QUESTIONS.slice(0, 3).map((sq, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => askQuestion(sq)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50 font-semibold transition-colors"
                                            >
                                                {sq}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Conversation Messages */}
                        {conversation.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.05 }}
                                className={cn(
                                    "flex gap-4 max-w-[92%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                    msg.role === "user"
                                        ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                                        : "bg-gradient-to-br from-cyan-500 to-blue-600"
                                )}>
                                    {msg.role === "user" ? (
                                        <User className="w-5 h-5 text-white" />
                                    ) : (
                                        <Bot className="w-5 h-5 text-white" />
                                    )}
                                </div>
                                <div className={cn(
                                    "flex-1 rounded-2xl p-5 relative group",
                                    msg.role === "user"
                                        ? "bg-white border-2 border-slate-100 rounded-tr-md"
                                        : "bg-gradient-to-br from-white to-cyan-50/30 border-2 border-cyan-100/50 rounded-tl-md shadow-lg shadow-cyan-500/5"
                                )}>
                                    {msg.role === "user" ? (
                                        <p className="text-slate-900 font-semibold leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <ProfessionalAIContent content={msg.content} />
                                    )}

                                    {/* Copy button for AI responses */}
                                    {msg.role === "assistant" && (
                                        <button
                                            onClick={() => copyMessage(msg.content, idx)}
                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-white/80 hover:bg-slate-100 border border-slate-200"
                                        >
                                            {copiedIdx === idx ? (
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Typing Indicator */}
                        {generating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4 mr-auto"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm border-2 border-cyan-100 rounded-2xl rounded-tl-md p-5 px-8 flex items-center gap-3 shadow-lg">
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="w-2 h-2 rounded-full bg-cyan-500"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-cyan-700 font-black uppercase text-[10px] tracking-widest">Analyzing Document</span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-5 bg-white/80 backdrop-blur-sm border-t-2 border-slate-50">
                        <div className="relative flex items-center gap-3 max-w-4xl mx-auto">
                            {/* Mic Button */}
                            <Button
                                onClick={toggleListening}
                                disabled={generating}
                                size="lg"
                                className={cn(
                                    "w-11 h-11 rounded-xl p-0 shrink-0 transition-all",
                                    isListening
                                        ? "bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 animate-pulse"
                                        : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                                )}
                            >
                                {isListening ? (
                                    <MicOff className="w-5 h-5 text-white" />
                                ) : (
                                    <Mic className="w-5 h-5" />
                                )}
                            </Button>

                            <Input
                                ref={inputRef}
                                value={isListening ? voiceTranscript : question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder={isListening ? "🎤 Listening... speak now" : "Ask anything about your document..."}
                                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !generating && askQuestion()}
                                disabled={generating || isListening}
                                className={cn(
                                    "text-base py-6 rounded-2xl border-2 bg-slate-50/50 shadow-inner px-6 h-14 font-medium pr-16",
                                    isListening ? "border-red-300 bg-red-50/30" : "border-slate-100 focus:border-cyan-400"
                                )}
                            />

                            {/* Speaker / Stop button */}
                            {isSpeaking && (
                                <Button
                                    onClick={stopSpeaking}
                                    size="lg"
                                    className="w-11 h-11 rounded-xl p-0 shrink-0 bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 animate-pulse"
                                >
                                    <VolumeX className="w-5 h-5 text-white" />
                                </Button>
                            )}

                            <Button
                                onClick={() => askQuestion()}
                                disabled={generating || (!question.trim() && !isListening)}
                                size="lg"
                                className="absolute right-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-xl shadow-cyan-500/30 w-11 h-11 rounded-xl p-0"
                            >
                                {generating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">
                            {isListening ? "🔴 Recording — speak your question" : isSpeaking ? "🔊 AI is speaking..." : `Responses are based on your uploaded document • ${conversation.filter(m => m.role === "user").length} questions asked`}
                        </p>
                    </div>
                </div>
            </div>

            {/* ========== VOICE MODE OVERLAY ========== */}
            <AnimatePresence>
                {voiceMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        {/* Close button */}
                        <button
                            onClick={toggleVoiceMode}
                            className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Document info */}
                        <div className="absolute top-6 left-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-white/80 font-bold text-sm truncate max-w-[200px]">{documentTitle}</p>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Voice Tutor Session</p>
                            </div>
                        </div>

                        {/* Central Visualizer */}
                        <div className="relative flex flex-col items-center mb-12">
                            {/* Animated rings */}
                            <div className="relative w-48 h-48">
                                <motion.div
                                    animate={{
                                        scale: isListening ? [1, 1.3, 1] : isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
                                        opacity: isListening ? [0.6, 0.2, 0.6] : isSpeaking ? [0.4, 0.15, 0.4] : 0.1
                                    }}
                                    transition={{ repeat: Infinity, duration: isListening ? 1 : 2 }}
                                    className={cn(
                                        "absolute inset-0 rounded-full",
                                        isListening ? "bg-red-500/30" : isSpeaking ? "bg-violet-500/30" : "bg-cyan-500/20"
                                    )}
                                />
                                <motion.div
                                    animate={{
                                        scale: isListening ? [1, 1.5, 1] : isSpeaking ? [1, 1.25, 1] : 1,
                                        opacity: isListening ? [0.3, 0.1, 0.3] : isSpeaking ? [0.2, 0.05, 0.2] : 0.05
                                    }}
                                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                                    className={cn(
                                        "absolute inset-[-20px] rounded-full",
                                        isListening ? "bg-red-500/20" : isSpeaking ? "bg-violet-500/20" : "bg-cyan-500/10"
                                    )}
                                />
                                <motion.div
                                    animate={{
                                        scale: isListening ? [1, 1.6, 1] : isSpeaking ? [1, 1.35, 1] : 1,
                                        opacity: isListening ? [0.2, 0.05, 0.2] : isSpeaking ? [0.1, 0.03, 0.1] : 0.02
                                    }}
                                    transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                                    className={cn(
                                        "absolute inset-[-40px] rounded-full",
                                        isListening ? "bg-red-500/15" : isSpeaking ? "bg-violet-500/15" : "bg-cyan-500/5"
                                    )}
                                />

                                {/* Center button */}
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (isSpeaking) {
                                            stopSpeaking();
                                        } else if (isListening) {
                                            stopListening();
                                        } else if (generating) {
                                            // Do nothing while generating
                                        } else {
                                            startListening();
                                        }
                                    }}
                                    className={cn(
                                        "absolute inset-0 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer",
                                        isListening
                                            ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50"
                                            : isSpeaking
                                                ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/50"
                                                : generating
                                                    ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/50"
                                                    : "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/50 hover:shadow-cyan-500/70"
                                    )}
                                >
                                    {isListening ? (
                                        <Mic className="w-16 h-16 text-white" />
                                    ) : isSpeaking ? (
                                        <Volume2 className="w-16 h-16 text-white" />
                                    ) : generating ? (
                                        <Loader2 className="w-16 h-16 text-white animate-spin" />
                                    ) : (
                                        <Mic className="w-16 h-16 text-white" />
                                    )}
                                </motion.button>
                            </div>
                        </div>

                        {/* State Label */}
                        <div className="text-center mb-8">
                            <h2 className={cn(
                                "text-3xl font-black tracking-tight mb-2",
                                isListening ? "text-red-400" : isSpeaking ? "text-violet-400" : generating ? "text-amber-400" : "text-cyan-400"
                            )}>
                                {isListening ? "Listening..." : isSpeaking ? "Teaching..." : generating ? "Thinking..." : "Tap to Speak"}
                            </h2>
                            <p className="text-white/40 text-sm font-medium max-w-md">
                                {isListening
                                    ? "Speak your question clearly — I'm all ears!"
                                    : isSpeaking
                                        ? "Your AI tutor is explaining the answer..."
                                        : generating
                                            ? "Analyzing the document to answer your question..."
                                            : "Tap the microphone and ask me anything about your document"}
                            </p>
                        </div>

                        {/* Live Transcript */}
                        {(isListening && voiceTranscript) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 max-w-lg mb-6"
                            >
                                <p className="text-white/70 text-lg font-medium text-center">
                                    "{voiceTranscript}"
                                </p>
                            </motion.div>
                        )}

                        {/* Last AI response (brief) */}
                        {conversation.length > 0 && !isListening && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 max-w-xl max-h-32 overflow-y-auto mb-6"
                            >
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Latest Response</p>
                                <p className="text-white/70 text-sm line-clamp-3">
                                    {conversation.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.substring(0, 200)}...
                                </p>
                            </motion.div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            {isSpeaking && (
                                <Button
                                    onClick={stopSpeaking}
                                    className="rounded-2xl bg-white/10 hover:bg-white/20 text-white px-6 h-12 font-bold"
                                >
                                    <VolumeX className="w-4 h-4 mr-2" />
                                    Stop Speaking
                                </Button>
                            )}
                            <Button
                                onClick={toggleVoiceMode}
                                className="rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 h-12 font-bold border border-red-500/20"
                            >
                                <PhoneOff className="w-4 h-4 mr-2" />
                                End Session
                            </Button>
                        </div>

                        {/* Session Stats */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 text-white/30">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {conversation.filter(m => m.role === "user").length} Questions
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Voice Tutor Active
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {documentTitle}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
