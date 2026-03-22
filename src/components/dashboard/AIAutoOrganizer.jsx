import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
    Upload,
    Sparkles,
    FileText,
    Search,
    CheckCircle2,
    Loader2,
    AlertCircle,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AIAutoOrganizer() {
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();

    const handleFile = async (file) => {
        if (!file) return;

        setIsUploading(true);
        const toastId = toast.loading(`Analyzing ${file.name}...`);

        try {
            console.log("Starting auto-organize for file:", file.name);
            const result = await base44.integrations.Organizer.AutoOrganizeUpload(file);
            console.log("Auto-organize result:", result);

            toast.success(`Classified as ${result.type}: ${result.data.title}`, {
                id: toastId,
                description: "Organized into your dashboard automatically.",
            });

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["modules"] });
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
            queryClient.invalidateQueries({ queryKey: ["materials"] });

        } catch (err) {
            console.error("Auto-organize full error object:", err);

            // Extract meaningful details from the error
            let userMessage = err.message || "An unexpected error occurred during AI analysis.";
            let hint = "Double-check your API keys and internet connection.";

            if (userMessage.includes("404") || userMessage.includes("not found")) {
                hint = "The AI model version might be deprecated or incorrect in your .env file.";
            } else if (userMessage.includes("quota") || userMessage.includes("429")) {
                hint = "You have exceeded your API quota for the day.";
            } else if (userMessage.includes("Invalid")) {
                hint = "The AI returned data that couldn't be parsed. New models might be hallucinating.";
            } else if (userMessage.includes("Load failed")) {
                hint = "Network error. The AI server could not be reached.";
            }

            setError({
                title: "AI Analysis Failed",
                message: userMessage,
                hint: hint,
                fileName: file.name
            });
            toast.error("Failed to classify document.", {
                id: toastId,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        AI Auto-Organizer
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Drop any document or image to auto-sort it
                    </p>
                </div>
            </div>

            <div className="p-6">
                <label
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                        "relative group cursor-pointer flex flex-col items-center justify-center py-10 px-6 rounded-2xl border-2 border-dashed transition-all duration-300",
                        dragActive
                            ? "border-violet-500 bg-violet-50/50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        isUploading && "pointer-events-none opacity-60"
                    )}
                >
                    <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    />

                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300",
                        dragActive ? "bg-violet-500 text-white scale-110" : "bg-slate-100 text-slate-400 group-hover:scale-110"
                    )}>
                        {isUploading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6" />
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-900">
                            {isUploading ? "AI is scanning your file..." : "Click to upload or drag & drop"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Supports PDFs, Images, Office Docs, and Text
                        </p>
                    </div>

                    {dragActive && (
                        <div className="absolute inset-0 bg-violet-500/5 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                            <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-violet-100 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                                <span className="text-sm font-semibold text-violet-700 font-mono">CLASSIFY MODE ACTIVE</span>
                            </div>
                        </div>
                    )}
                </label>

                <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                        <Search className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-blue-900">What happens after upload?</p>
                            <p className="text-[10px] text-blue-700 mt-0.5 leading-relaxed">
                                AI scans the text and visuals to identify if it's a syllabus (Module),
                                homework (Assignment), or revision material.
                                It then creates the entries and links them automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Modal */}
            {error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-5 border-b border-slate-100 bg-red-50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900">{error.title}</h4>
                                <p className="text-[10px] text-red-600 font-mono uppercase tracking-wider">Error Insight</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto p-2 hover:bg-red-200 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-red-700" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 overflow-auto pencil-scroll max-h-40">
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {error.message}
                                </p>
                            </div>
                            {error.fileName && (
                                <p className="text-xs text-slate-500 mb-2">
                                    File: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{error.fileName}</span>
                                </p>
                            )}
                            {error.hint && (
                                <div className="mt-2 text-xs bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 flex gap-2 items-start">
                                    <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{error.hint}</span>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                    onClick={() => setError(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
