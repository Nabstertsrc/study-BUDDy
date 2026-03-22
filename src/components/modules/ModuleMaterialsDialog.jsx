import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Upload, FileText, Loader2, Trash2, Sparkles, BookOpen, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ModuleMaterialsDialog({ module, isOpen, onClose }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(null);

  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials", module?.id],
    queryFn: () => base44.entities.StudyMaterial.filter({ module_id: module.id }),
    enabled: !!module?.id && isOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudyMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", module.id] });
      toast.success("Material deleted");
    },
  });

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
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        setTitle(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    if (!module?.id) {
      toast.error("Module not found");
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      if (!uploadResult?.file_url) {
        throw new Error("File upload failed - no URL returned");
      }

      let extractedContent = "";
      try {
        extractedContent = await base44.integrations.Core.InvokeLLM({
          prompt: "Extract all text content from this document. Return only the text, nothing else.",
          file_urls: [uploadResult.file_url],
        });
      } catch (extractError) {
        console.warn("Content extraction skipped:", extractError);
      }

      await base44.entities.StudyMaterial.create({
        title: title,
        module_id: module.id,
        type: file.type?.includes("pdf") ? "pdf" : "notes",
        file_url: uploadResult.file_url,
        content: extractedContent || "",
        is_processed: false,
      });

      queryClient.invalidateQueries({ queryKey: ["materials", module.id] });
      toast.success("Material uploaded successfully!");
      setFile(null);
      setTitle("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const generateQuiz = async (material) => {
    setGeneratingQuiz(material.id);
    try {
      const context = material.content && material.content.length > 50 ? material.content : `Topic: ${material.title}. (Content is brief, generate general questions based on this topic)`;

      const quizData = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a quiz generator.
        
        Generate 5 multiple choice questions based strictly on this context:
        "${context}"
        
        RETURN JSON ONLY. No markdown, no pre-text.
        Structure:
        {
          "questions": [
            {
               "question": "Question text...",
               "options": ["A", "B", "C", "D"],
               "correct_answer": 0, // index of correct option
               "explanation": "Why it is correct"
            }
          ]
        }`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  },
                  correct_answer: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });

      await base44.entities.Quiz.create({
        title: `Quiz: ${material.title}`,
        module_id: module.id,
        material_id: material.id,
        questions: quizData.questions,
        difficulty: "medium",
        attempts: 0,
      });

      toast.success("Quiz generated!");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    } catch (error) {
      toast.error("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const generateSummary = async (material) => {
    setGeneratingSummary(material.id);
    try {
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a concise summary of this content, highlighting the key concepts and important points: "${material.content}"`,
      });

      await base44.entities.StudyMaterial.update(material.id, {
        summary: summary,
        is_processed: true,
      });

      toast.success("Summary generated!");
      queryClient.invalidateQueries({ queryKey: ["materials", module.id] });
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setGeneratingSummary(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {module?.title} - Course Materials
          </DialogTitle>
          <DialogDescription>
            Upload materials and let AI generate quizzes and summaries
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials">Materials ({materials?.length || 0})</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading materials...</div>
            ) : materials?.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No materials yet</p>
                <p className="text-sm text-slate-400 mt-1">Upload your first material to get started</p>
              </div>
            ) : (
              materials?.map((material) => (
                <div
                  key={material.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{material.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {material.type}
                        </Badge>
                        {material.is_processed && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">
                            Processed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(material.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {material.summary && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-700">{material.summary}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {(material.tags?.includes('bot-search') || material.tags?.includes('pdf-search') || material.tags?.includes('global-search')) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                        onClick={() => window['electron']?.openExternalUrl ? window['electron'].openExternalUrl(material.file_url) : window.open(material.file_url, '_blank')}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Open Search Tool
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQuiz(material)}
                          disabled={generatingQuiz === material.id || !material.content}
                          className="flex-1"
                        >
                          {generatingQuiz === material.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Generate Quiz
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSummary(material)}
                          disabled={generatingSummary === material.id || material.is_processed || !material.content}
                          className="flex-1"
                        >
                          {generatingSummary === material.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4 mr-2" />
                          )}
                          {material.is_processed ? "Summary Done" : "Generate Summary"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Material Title</Label>
                <Input
                  placeholder="Lecture 5 - Data Structures"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div>
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-2">Drag and drop your file here</p>
                    <p className="text-sm text-slate-400 mb-4">PDF, images, or text files</p>
                    <Button variant="outline" onClick={() => document.getElementById('file-upload').click()}>
                      Browse Files
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                    />
                  </>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || !title || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Material
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}