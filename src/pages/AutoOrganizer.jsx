import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
    Upload,
    FileText,
    X,
    CheckCircle2,
    Loader2,
    Sparkles,
    Search,
    BookOpen,
    Calendar,
    Layers,
    BrainCircuit,
    ArrowRight,
    TrendingUp,
    FileSearch,
    GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AutoOrganizer() {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const queryClient = useQueryClient();

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const processFiles = async (fileList) => {
        setProcessing(true);
        const newResults = [];

        for (const file of fileList) {
            try {
                toast.info(`Processing ${file.name}...`);
                const result = await base44.integrations.Organizer.AutoOrganizeUpload(file);
                newResults.push({
                    name: file.name,
                    status: "success",
                    data: result.data,
                });
                toast.success(`Successfully organized ${file.name}`);
            } catch (error) {
                console.error("Auto-organize error:", error);
                newResults.push({
                    name: file.name,
                    status: "error",
                    error: error.message
                });
                toast.error(`Failed to organize ${file.name}`);
            }
        }

        setResults(prev => [...newResults, ...prev]);
        setProcessing(false);
        setFiles([]);

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["modules"] });
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
        queryClient.invalidateQueries({ queryKey: ["materials"] });
        queryClient.invalidateQueries({ queryKey: ["prescribed-books"] });
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles(droppedFiles);
            await processFiles(droppedFiles);
        }
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(selectedFiles);
            await processFiles(selectedFiles);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <BrainCircuit className="w-5 h-5" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Intelligence Core</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Auto-Organizer</h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Drop your documents, lecture slides, or textbooks. Our AI extracts module codes,
                        detects assignments, and finds prescribed books automatically.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 opacity-20" />
                            </div>
                        ))}
                    </div>
                    <p className="text-xs font-medium text-slate-600">
                        <span className="text-indigo-600 font-bold">500+</span> files organized today
                    </p>
                </div>
            </div>

            {/* Main Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                    "relative group overflow-hidden transition-all duration-500 rounded-[32px] border-4 border-dashed",
                    dragActive
                        ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
                        : "border-slate-200 hover:border-indigo-400 bg-white shadow-xl shadow-slate-200/50",
                    processing && "pointer-events-none opacity-80"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-12 md:p-24 text-center">
                    {processing ? (
                        <div className="space-y-6">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-indigo-600 animate-bounce" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900">AI is Analyzing...</h3>
                                <p className="text-slate-500">Extracting structure, modules, and assignments...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
                                <Upload className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                                Drop your study materials here
                            </h3>
                            <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                                We'll automatically create modules, populate assignments,
                                and link textbooks for you.
                            </p>
                            <label className="cursor-pointer group">
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.txt,.md"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl shadow-indigo-200 active:scale-95">
                                    <FileSearch className="w-6 h-6" />
                                    Select Multiple Files
                                </div>
                            </label>
                            <div className="mt-10 flex items-center justify-center gap-8">
                                {['PDF Support', 'OCR Engine', 'Textbooks', 'Auto-Scan'].map(feature => (
                                    <div key={feature} className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Processing Results */}
            {results.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700 delay-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Layers className="w-7 h-7 text-indigo-600" />
                            Organization Timeline
                        </h2>
                        <Button variant="ghost" onClick={() => setResults([])} className="text-slate-500 hover:text-red-500">
                            Clear History
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "relative overflow-hidden bg-white rounded-3xl border transition-all hover:shadow-xl",
                                    result.status === "success" ? "border-slate-200" : "border-red-200 bg-red-50"
                                )}
                            >
                                <div className="p-1 flex items-center gap-6 p-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                        result.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-100 text-red-600"
                                    )}>
                                        {result.status === "success" ? <CheckCircle2 className="w-8 h-8" /> : <X className="w-8 h-8" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-slate-900 text-xl truncate">{result.name}</h4>
                                            {result.status === "success" && (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] tracking-widest px-2">
                                                    Auto-Organized
                                                </Badge>
                                            )}
                                        </div>

                                        {result.status === "success" ? (
                                            <div className="flex flex-wrap gap-4 mt-3">
                                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {result.data?.code || "Unknown"}: {result.data?.title || "New Material"}
                                                    </span>
                                                </div>
                                                {result.data?.assignments_found?.length > 0 && (
                                                    <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100">
                                                        <Calendar className="w-4 h-4 text-violet-500" />
                                                        <span className="text-sm font-semibold text-violet-700">
                                                            {result.data.assignments_found.length} Assignments Detected
                                                        </span>
                                                    </div>
                                                )}
                                                {result.data?.prescribed_books?.length > 0 && (
                                                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                        <Search className="w-4 h-4 text-blue-500" />
                                                        <span className="text-sm font-semibold text-blue-700">
                                                            {result.data.prescribed_books.length} Books Extracted
                                                        </span>
                                                    </div>
                                                )}
                                                {result.data?.institution && (
                                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                                                        <GraduationCap className="w-4 h-4 text-amber-500" />
                                                        <span className="text-sm font-semibold text-amber-700">
                                                            {result.data.institution}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-red-600 text-sm font-medium">{result.error}</p>
                                        )}
                                    </div>

                                    <div className="hidden md:flex items-center gap-4">
                                        {result.status === "success" && result.data?.code && (
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="rounded-xl border-slate-200 hover:bg-slate-50 group shadow-sm transition-all hover:scale-105"
                                            >
                                                <Link to={`/Modules?code=${result.data.code}`}>
                                                    Review Module
                                                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insights / Stats */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">Efficiency Boost</h3>
                    <p className="text-slate-500 text-sm">
                        AI organization saves an average of <span className="text-indigo-600 font-bold">12 minutes</span> per document compared to manual entry.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-slate-900">OCR Precision</h3>
                    <p className="text-slate-500 text-sm">
                        Our vision models extract data with <span className="text-emerald-600 font-bold">98%+ accuracy</span> from handwritten or digital notes.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-200 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold">Pro Tip</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                        Upload your entire semester schedule as an image to instantly populate your dashboard timeline!
                    </p>
                </div>
            </div>
        </div>
    );
}
