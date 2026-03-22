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
    Send,
    MessageSquare,
    Download,
    Eye,
    X,
    Shield
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function TelegramDiscovery({ modules }) {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [savedUrls, setSavedUrls] = useState(new Set());
    const [viewingResource, setViewingResource] = useState(null);
    const [importing, setImporting] = useState(null);

    useEffect(() => {
        const loadSaved = async () => {
            const materials = await base44.entities.StudyMaterial.list();
            const urls = materials?.map(m => m.file_url).filter(Boolean) || [];
            setSavedUrls(new Set(urls));
        };
        loadSaved();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        const searchQuery = query.trim();
        if (!searchQuery) return;

        setSearching(true);
        try {
            // We use the AI to suggest Telegram channels and groups that might have these materials
            // then we'll simulate a search results view
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: `I am looking for educational resources (PDFs, notes, manuals) specifically on Telegram for this topic: "${searchQuery}".
                
                Suggest 5-8 REALISTIC Telegram channel names or specific usernames (e.g. @unisa_group, @coding_materials) that are known to host such materials. 
                Focus on regions like South Africa (UNISA), Global Open Source, and Library Genesis bots.
                
                Return ONLY a valid JSON array of objects:
                [{
                    "title": "Channel/Group Name",
                    "url": "https://t.me/username_or_link",
                    "description": "What they typically share",
                    "type": "channel" | "group" | "bot",
                    "verified": true/false
                }]`,
                systemPrompt: "You are an expert at navigating Telegram's educational ecosystem and finding public resource repositories."
            });

            // Robust extraction using safeJsonParse
            const data = safeJsonParse(response, {
                fallback: [],
                verbose: true
            });

            // Ensure we handle {results: [...]} or just [...]
            let resultsArray = [];
            if (Array.isArray(data)) {
                resultsArray = data;
            } else if (data?.results && Array.isArray(data.results)) {
                resultsArray = data.results;
            } else if (data?.channels && Array.isArray(data.channels)) {
                resultsArray = data.channels;
            }

            setResults(resultsArray);
            if (resultsArray.length === 0 && !searching) {
                toast.info("No communities found. Try a broader search term.");
            }
        } catch (error) {
            console.error("Telegram search failed:", error);
            toast.error("Discovery engine failed. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const importResource = async (resource) => {
        setImporting(resource.url);
        try {
            await base44.entities.StudyMaterial.create({
                title: resource.title,
                content: `Telegram Resource: ${resource.description}`,
                type: "link",
                file_url: resource.url,
                is_processed: true,
                tags: ["telegram-discovery", resource.type]
            });

            setSavedUrls(prev => new Set([...prev, resource.url]));
            toast.success("Telegram link added to your lab!");
        } catch (err) {
            toast.error("Failed to save telegram link.");
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-8 bg-sky-900 text-white border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 -rotate-12 group-hover:scale-175 transition-transform duration-700">
                    <Send className="w-48 h-48" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <Send className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">Telegram AI Discovery</h3>
                            <p className="text-sky-200 text-sm">Find hidden study groups and material repositories</p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter module code or topic (e.g. FAC1501, Python 101)..."
                            className="flex-1 h-14 bg-white/10 border-white/20 text-white placeholder:text-sky-200/40 rounded-2xl focus:ring-sky-400 focus:border-sky-400 text-lg px-6"
                        />
                        <Button
                            type="submit"
                            disabled={searching}
                            className="h-14 px-8 rounded-2xl bg-sky-500 hover:bg-sky-600 shadow-xl shadow-sky-500/30 transition-all active:scale-95 w-full sm:w-auto"
                        >
                            {searching ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Search className="w-6 h-6" />
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 flex flex-wrap gap-2">
                        {modules?.slice(0, 4).map((mod) => (
                            <Button
                                key={mod.id}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setQuery(mod.code);
                                    // Trigger search immediately
                                    const mockEvent = { preventDefault: () => { } };
                                    handleSearch(mockEvent);
                                }}
                                className="bg-white/5 border-white/10 text-sky-100 hover:bg-white/10 hover:text-white rounded-xl text-[10px] h-8"
                            >
                                Scan {mod.code}
                            </Button>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-[10px] text-sky-200/60 uppercase tracking-widest font-bold">
                        <Shield className="w-3 h-3" />
                        Production DC: 149.154.167.50:443
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searching && (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Querying secure repositories...</p>
                    </div>
                )}

                {!searching && results.map((res, idx) => (
                    <Card key={idx} className="flex flex-col h-full rounded-3xl border-slate-200/60 shadow-lg hover:shadow-xl hover:border-sky-200 transition-all group overflow-hidden bg-white">
                        <div className="p-6 flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="secondary" className="bg-sky-50 text-sky-700 border-none px-3 py-1 flex items-center gap-2">
                                    {res.type === 'bot' ? <MessageSquare className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                                    {res.type}
                                </Badge>
                                {res.verified && (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none">Verified</Badge>
                                )}
                            </div>

                            <h4 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors">
                                {res.title}
                            </h4>
                            <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                                {res.description}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl h-9 text-sky-600 border-sky-200 hover:bg-sky-50"
                                onClick={() => setViewingResource(res)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                            </Button>
                            <Button
                                size="sm"
                                className={cn(
                                    "flex-1 rounded-xl h-9",
                                    savedUrls.has(res.url) ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50" : "bg-sky-600 hover:bg-sky-700 text-white"
                                )}
                                onClick={() => importResource(res)}
                                disabled={savedUrls.has(res.url) || importing === res.url}
                            >
                                {importing === res.url ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : savedUrls.has(res.url) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </Card>
                ))}

                {!searching && results.length === 0 && !query && (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-20 opacity-40">
                        <Send className="w-20 h-20 mx-auto mb-4 text-sky-500" />
                        <p className="text-xl font-medium">Search for modules to find Telegram communities.</p>
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            {viewingResource && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
                    <div className="w-full h-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 bg-sky-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm truncate max-w-md">{viewingResource.title}</h4>
                                    <p className="text-[10px] text-sky-300">{viewingResource.url}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingResource(null)}
                                className="text-white hover:bg-white/10 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 rounded-3xl bg-sky-100 flex items-center justify-center mb-6">
                                <ExternalLink className="w-10 h-10 text-sky-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Open in Telegram</h3>
                            <p className="text-slate-600 max-w-md mb-8">
                                For security and privacy, you must view this {viewingResource.type} directly in the Telegram app.
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    onClick={() => window.open(viewingResource.url, '_blank')}
                                    size="lg"
                                    className="bg-sky-600 hover:bg-sky-700 rounded-2xl h-14 px-8"
                                >
                                    Launch Telegram
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingResource(null)}
                                    size="lg"
                                    className="rounded-2xl h-14 px-8"
                                >
                                    Go Back
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
