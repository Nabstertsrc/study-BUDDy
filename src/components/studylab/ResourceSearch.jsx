import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    ExternalLink,
    Globe,
    Loader2,
    Check,
    Youtube,
    FileText,
    Book,
    Zap,
    Bookmark,
    Eye,
    X
} from "lucide-react";
import { toast } from "sonner";
import AILoadingState from "@/components/ui/AILoadingState";
import { cn } from "@/lib/utils";

export default function ResourceSearch({ modules }) {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [savedIds, setSavedIds] = useState(new Set());
    const [viewingResource, setViewingResource] = useState(null);
    const [importing, setImporting] = useState(null);

    useEffect(() => {
        const loadSaved = async () => {
            const materials = await base44.entities.StudyMaterial.list();
            const urls = materials?.map(m => m.file_url).filter(Boolean) || [];
            setSavedIds(new Set(urls));
        };
        loadSaved();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        try {
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `Find 6-8 extremely high-quality, free educational resources (PDFs, study guides, YouTube playlists, interactive tools, or university repos) for the topic: "${query}".
        Focus on UNISA, Khan Academy, Coursera (Audit/Free), OpenStax, and reputable university portals.
        
        Return ONLY valid JSON array with this structure:
        [{
            "title": "Clear Resource Title",
            "url": "https://...",
            "description": "2-sentence summary of value",
            "type": "video" | "pdf" | "article" | "course",
            "provider": "e.g. YouTube, Khan Academy"
        }]`,
                systemPrompt: "You are an elite academic librarian skilled in finding free, premium-quality study materials.",
                response_json_schema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            url: { type: "string" },
                            description: { type: "string" },
                            type: { type: "string" },
                            provider: { type: "string" }
                        }
                    }
                }
            });

            setResults(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Cloud search failed. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const saveToMaterials = async (resource) => {
        setImporting(resource.url);
        try {
            const isPdf = resource.url.toLowerCase().endsWith('.pdf') || resource.type === 'pdf';
            let localPath = null;
            let fileName = `${resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;

            if (isPdf && window['electron']?.downloadUrl) {
                toast.loading("Downloading material to local storage...");
                const download = await window['electron'].downloadUrl({
                    url: resource.url,
                    name: fileName
                });
                localPath = download.name;
            }

            await base44.entities.StudyMaterial.create({
                title: resource.title,
                content: resource.description,
                type: isPdf ? "pdf" : "link",
                file_url: resource.url,
                local_file_name: localPath,
                is_processed: false,
                tags: ["web-discovery", resource.type]
            });

            setSavedIds(prev => new Set([...prev, resource.url]));
            toast.success(isPdf ? "PDF downloaded and imported!" : "Resource link saved!");
        } catch (err) {
            console.error("Import failed:", err);
            toast.error("Failed to import resource locally.");
        } finally {
            setImporting(null);
        }
    };

    const previewResource = (resource) => {
        setViewingResource(resource);
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'video': return <Youtube className="w-4 h-4" />;
            case 'pdf': return <FileText className="w-4 h-4" />;
            case 'course': return <Book className="w-4 h-4" />;
            default: return <Globe className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
                    <Globe className="w-48 h-48" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">Global Resource Discovery</h3>
                            <p className="text-slate-400 text-sm">Find premium free materials from across the web</p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by topic, module code, or subject (e.g. MIP1501 calculus tips)..."
                            className="flex-1 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl focus:ring-blue-500 focus:border-blue-500 text-lg px-6"
                        />
                        <Button
                            type="submit"
                            disabled={searching}
                            className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all active:scale-95 w-full sm:w-auto"
                        >
                            {searching ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Zap className="w-6 h-6" />
                            )}
                        </Button>
                    </form>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {searching && (
                    <div className="md:col-span-2 lg:col-span-3">
                        <AILoadingState
                            title="Discovery Engine Active"
                            message={`Scanning global repositories for premium materials on "${query}". Filtering for high-quality academic sources...`}
                        />
                    </div>
                )}

                {!searching && results.map((res, idx) => (
                    <Card key={idx} className="flex flex-col h-full rounded-3xl border-slate-200/60 shadow-lg hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden bg-white">
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none px-3 py-1 flex items-center gap-2">
                                    {getTypeIcon(res.type)}
                                    {res.provider || res.type}
                                </Badge>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-colors"
                                        onClick={() => previewResource(res)}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            <h4 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {res.title}
                            </h4>
                            <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                                {res.description}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-xl gap-2",
                                    savedIds.has(res.url) ? "text-emerald-600 bg-emerald-50" : "text-slate-600 hover:bg-white hover:text-blue-600 shadow-sm border border-slate-200 bg-white"
                                )}
                                onClick={() => saveToMaterials(res)}
                                disabled={savedIds.has(res.url) || importing === res.url}
                            >
                                {importing === res.url ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : savedIds.has(res.url) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Bookmark className="w-4 h-4" />
                                )}
                                {savedIds.has(res.url) ? "Imported" : importing === res.url ? "Importing..." : "Import to Lab"}
                            </Button>

                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-slate-200">
                                {res.type}
                            </Badge>
                        </div>
                    </Card>
                ))}

                {!searching && results.length === 0 && query && (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-20 opacity-40">
                        <Globe className="w-20 h-20 mx-auto mb-4" />
                        <p className="text-xl font-medium">No results found for your query.</p>
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            {viewingResource && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
                    <div className="w-full h-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                    {getTypeIcon(viewingResource.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm truncate max-w-md">{viewingResource.title}</h4>
                                    <p className="text-[10px] text-slate-400">{viewingResource.url}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 h-9 rounded-xl"
                                    onClick={() => {
                                        saveToMaterials(viewingResource);
                                    }}
                                    disabled={savedIds.has(viewingResource.url) || importing === viewingResource.url}
                                >
                                    {savedIds.has(viewingResource.url) ? "Imported" : "Import to My Lab"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewingResource(null)}
                                    className="text-white hover:bg-white/10 rounded-xl"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            <iframe
                                src={viewingResource.url}
                                className="w-full h-full border-none"
                                title="Browser Preview"
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                <p className="bg-slate-900/50 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-md">
                                    Note: Some websites may block in-app viewing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
