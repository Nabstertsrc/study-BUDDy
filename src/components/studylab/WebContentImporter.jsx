import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Loader2, Link as LinkIcon, CheckCircle, BookOpen, FileText, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safeJsonParser";

const createMaterial = async (data) => {
  return await base44.entities.StudyMaterial.create(data);
};

export default function WebContentImporter({ modules }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [viewing, setViewing] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Study material added successfully!");
      setImported(true);
      setTimeout(() => {
        setUrl("");
        setTitle("");
        setModuleId("");
        setImported(false);
      }, 2000);
    },
  });

  const handleImport = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setImporting(true);
    const isPdf = url.toLowerCase().endsWith('.pdf');

    try {
      if (isPdf && window['electron']?.downloadUrl) {
        toast.loading("Downloading PDF...");
        const fileName = `${(title || "imported_doc").replace(/[^a-z0-9]/gi, '_')}.pdf`;
        const download = await window['electron'].downloadUrl({ url, name: fileName });

        await createMutation.mutateAsync({
          title: title || "Imported PDF",
          content: "Downloaded from: " + url,
          type: "pdf",
          file_url: url,
          local_file_name: download.name,
          module_id: moduleId || undefined,
          is_processed: false,
          tags: ["pdf-import"]
        });
      } else {
        // Fetch webpage content logic
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract the main educational content from this webpage. Focus on:
- Main text content (exclude navigation, ads, footers)
- Key concepts and explanations
- Any formulas, definitions, or examples
- Remove any HTML tags and formatting

Keep the content clean and readable for studying.

URL: ${url}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              content: { type: "string" },
              suggested_title: { type: "string" },
              summary: { type: "string" }
            }
          }
        });

        // Robust extraction using safeJsonParse
        const parsedResponse = safeJsonParse(response, {
          fallback: {},
          verbose: true
        });

        if (!parsedResponse?.content) {
          toast.error("Could not extract content from URL. The AI might be having trouble with this site.");
          return;
        }

        // Create the study material
        await createMutation.mutateAsync({
          title: title || parsedResponse.suggested_title || "Web Content",
          content: parsedResponse.content,
          summary: parsedResponse.summary,
          type: "link",
          file_url: url,
          module_id: moduleId || undefined,
          is_processed: true,
          tags: ["web-import"]
        });
      }

    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import content. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5" />
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl border-2 border-blue-200/60 shadow-xl shadow-blue-500/10 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Import from Web
            </h3>
            <p className="text-sm text-slate-600">Grab study materials from any website</p>
          </div>
        </div>

        {imported ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Content Imported! 🎉</h4>
            <p className="text-slate-600">Your study material has been added</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/study-notes"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">
                📚 Try: old exam papers, textbook pages, study guides, Wikipedia articles
              </p>
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Material title (auto-generated if empty)"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Module (optional)</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Select value={moduleId} onValueChange={setModuleId}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No module</SelectItem>
                    {modules?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.code} - {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setViewing(true)}
                disabled={!url}
                variant="outline"
                size="lg"
                className="flex-1 rounded-xl border-2"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview in App
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || !url}
                size="lg"
                className="flex-[2] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2" />
                    Import Now
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 Pro Tips:</p>
              <ul className="text-xs text-blue-800 space-y-1.5 list-disc pl-5">
                <li>Works with most educational websites and articles</li>
                <li>Great for importing exam papers, study guides, and notes</li>
                <li>AI extracts the main content automatically</li>
                <li>Use for Wikipedia, Khan Academy, textbook sites, etc.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          <div className="w-full h-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate max-w-md">{url}</h4>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 h-9 rounded-xl"
                  onClick={() => {
                    setViewing(false);
                    handleImport();
                  }}
                  disabled={importing}
                >
                  Import this Site
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewing(false)}
                  className="text-white hover:bg-white/10 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={url}
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