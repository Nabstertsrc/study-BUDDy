import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader2,
  File,
  Sparkles,
  BookOpen,
  ExternalLink,
  Download,
  BrainCircuit
} from "lucide-react";
import { toast } from "sonner";
import { isPDF, extractTextFromPDF, downloadPDF } from "@/lib/pdfProcessor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function MaterialUploader({ modules, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzingModule, setAnalyzingModule] = useState(false);
  const [prescribedBooks, setPrescribedBooks] = useState(null);
  const [scanningBooks, setScanningBooks] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StudyMaterial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      setFile(null);
      setTitle("");
      setModuleId("");
      onSuccess?.();
    },
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type.includes("text")) {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));

        // Auto-detect module after drop
        if (modules && modules.length > 0) {
          await autoDetectModule(droppedFile);
        }
      }
    }
  }, [title, modules]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));

      // Auto-detect module after file selection
      if (modules && modules.length > 0) {
        await autoDetectModule(selectedFile);
      }
    }
  };

  const autoDetectModule = async (fileToAnalyze) => {
    if (!fileToAnalyze || !modules || modules.length === 0) return;

    setAnalyzingModule(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToAnalyze });

      const modulesList = modules.map(m => `${m.code}: ${m.title}${m.description ? ' - ' + m.description : ''}`).join('\n');
      const moduleCodes = modules.map(m => m.code).join(', ');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SCAN this document carefully and find the module/course code.

**WHERE TO LOOK (check ALL of these):**
1. Top of the first page - header area
2. Title or heading sections
3. Footer with course information
4. Any section labeled "Module", "Course", "Subject", "Code"
5. Study guide headers
6. Watermarks or stamps
7. Inside the document title/filename references

**PATTERNS TO MATCH:**
- Format like: CS301, BIO101, MATH201, ENG102
- May appear as: "Module: CS301" or "Course Code: CS301" or just "CS301"
- Sometimes written as "CS 301" (with space)
- Can be in parentheses or brackets

**Available Module Codes:**
${moduleCodes}

**Full Module List:**
${modulesList}

INSTRUCTIONS:
1. Read the ENTIRE first page carefully
2. Look for ANY of the module codes listed above
3. Check variations with/without spaces
4. Return ONLY the matching code in this exact format: just the code like "CS301"
5. If NO match found, return exactly: "NONE"

DO NOT explain, DO NOT add extra text. Return ONLY the code or "NONE".`,
        file_urls: [file_url],
        isBackground: true
      });

      const matchedCode = result.trim().toUpperCase().replace(/\s+/g, '');
      const matchedModule = modules.find(m => {
        const cleanCode = m.code.toUpperCase().replace(/\s+/g, '');
        return cleanCode === matchedCode || matchedCode.includes(cleanCode);
      });

      if (matchedModule) {
        setModuleId(matchedModule.id);
      }
    } catch (error) {
      console.error("Module analysis error:", error);
    } finally {
      setAnalyzingModule(false);
    }
  };



  const scanForPrescribedBooks = async (fileUrl) => {
    setScanningBooks(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this document and extract ALL prescribed/recommended books, textbooks, or reference materials mentioned.

Look for sections like:
- Prescribed textbooks
- Recommended reading
- Reference books
- Required materials
- Bibliography

For EACH book found, extract:
- Title
- Author(s)
- Edition (if mentioned)

Return a list of books.`,
        file_urls: [fileUrl],
        isBackground: true,
        response_json_schema: {
          type: "object",
          properties: {
            books: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  edition: { type: "string" }
                }
              }
            }
          }
        }
      });

      const result = safeJsonParse(response, {
        fallback: { books: [] },
        verbose: true
      });

      if (result && result.books && result.books.length > 0) {
        // Search web for each book
        const selectedModule = modules?.find(m => m.id === moduleId);

        const booksWithUrls = await Promise.all(
          result.books.map(async (book) => {
            const searchQuery = `${book.title} ${book.author} ${book.edition || ''} pdf free download`;

            const webResponse = await base44.integrations.Core.InvokeLLM({
              prompt: `Find free online resources (PDFs, ebooks, or web content) for this book:
Title: ${book.title}
Author: ${book.author}
Edition: ${book.edition || 'Any'}

Search for legitimate free sources like:
- OpenStax
- Project Gutenberg  
- University open courseware
- Author's official website
- Archive.org
- Google Books preview
- Academic repositories

Return the BEST 2-3 direct URLs to access this content.`,
              add_context_from_internet: true,
              isBackground: true,
              response_json_schema: {
                type: "object",
                properties: {
                  urls: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        source: { type: "string" },
                        description: { type: "string" }
                      }
                    }
                  }
                }
              }
            });

            const webResult = safeJsonParse(webResponse, {
              fallback: { urls: [] },
              verbose: true
            });

            return {
              ...book,
              resources: (webResult && webResult.urls) || [],
              module_id: moduleId,
              module_code: selectedModule?.code
            };
          })
        );

        // Save books to database
        for (const book of booksWithUrls) {
          await base44.entities.PrescribedBook.create({
            title: book.title,
            author: book.author,
            edition: book.edition || '',
            module_id: book.module_id,
            resources: book.resources,
            source_document: title
          });
        }

        queryClient.invalidateQueries({ queryKey: ["prescribed-books"] });
        setPrescribedBooks(booksWithUrls);
      }
    } catch (error) {
      console.error("Error scanning books:", error);
    } finally {
      setScanningBooks(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return;

    setUploading(true);
    let extractedContent = "";

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // OCR Processing if it's a PDF
      if (isPDF(file)) {
        try {
          extractedContent = await extractTextFromPDF(file);
          toast.success("OCR: Text extracted from PDF successfully!");
        } catch (ocrError) {
          console.error("OCR extraction failed:", ocrError);
        }
      }

      // @ts-ignore - Suppress false positive type error
      await createMutation.mutateAsync({
        title,
        content: extractedContent || undefined,
        module_id: moduleId || undefined,
        type: file.type === "application/pdf" ? "pdf" : "notes",
        file_url,
        is_processed: !!extractedContent,
      });

      // Scan for prescribed books after upload
      await scanForPrescribedBooks(file_url);
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);
      toast.error("Failed to upload material");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" />
        Upload Study Material
      </h3>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-200 hover:border-slate-300",
          file && "border-emerald-500 bg-emerald-50"
        )}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              className="ml-2"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadPDF({ file_url: URL.createObjectURL(file), title: file.name })}
              className="ml-2 gap-2 text-xs"
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <File className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900 mb-1">
              Drag & drop your file here
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports PDF and text files
            </p>
            <label className="cursor-pointer group">
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold bg-white border border-slate-200 text-slate-900 group-hover:bg-slate-50 group-hover:border-slate-300 transition-all shadow-sm">
                Browse Files
              </div>
            </label>
          </>
        )}
      </div>

      {file && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Module</Label>
              {analyzingModule && (
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-detecting...
                </div>
              )}
            </div>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {modules?.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.code} - {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !title}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {scanningBooks ? "Scanning for books..." : "Uploading..."}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Material
              </>
            )}
          </Button>
        </div>
      )}

      {/* Prescribed Books Results */}
      {prescribedBooks && prescribedBooks.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-slate-900">Prescribed Books Found 📚</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            {prescribedBooks.length} book(s) saved to Prescribed Books page • Module: {prescribedBooks[0]?.module_code || 'N/A'}
          </p>
          <div className="space-y-3">
            {prescribedBooks.map((book, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                <h5 className="font-semibold text-slate-900 text-sm">{book.title}</h5>
                <p className="text-xs text-slate-600 mt-1">
                  {book.author} {book.edition && `• ${book.edition}`}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {book.resources?.length || 0} resource(s) found
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}