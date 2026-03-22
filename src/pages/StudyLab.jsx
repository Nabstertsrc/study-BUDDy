import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  FileText,
  Lightbulb,
  Upload,
  Sparkles,
  FolderOpen,
  Globe,
  TrendingUp,
  PenTool,
  Youtube,
  ExternalLink,
  Download,
  Eye,
  Send,
  Clock,
  MessageSquareText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import MaterialUploader from "@/components/studylab/MaterialUploader";
import QuizGenerator from "@/components/studylab/QuizGenerator";
import NoteSummarizer from "@/components/studylab/NoteSummarizer";
import DeepDive from "@/components/studylab/DeepDive";
import WebContentImporter from "@/components/studylab/WebContentImporter";
import EssayAssessment from "@/components/studylab/EssayAssessment";
import PerformanceAnalysis from "@/components/studylab/PerformanceAnalysis";
import ResourceSearch from "@/components/studylab/ResourceSearch";
import TelegramDiscovery from "../components/studylab/TelegramDiscovery";
import DocumentChat from "@/components/studylab/DocumentChat";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ProfessionalAIContent } from "@/components/ui/ProfessionalAIContent";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";

const tabs = [
  { id: "quiz", label: "Quiz Generator", icon: Brain, color: "text-violet-600", bg: "bg-violet-100" },
  { id: "docchat", label: "Chat with Doc", icon: MessageSquareText, color: "text-cyan-600", bg: "bg-cyan-100" },
  { id: "notes", label: "Summarize Notes", icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
  { id: "deepdive", label: "Deep Dive", icon: Lightbulb, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: "essay", label: "Essay Grader", icon: PenTool, color: "text-rose-600", bg: "bg-rose-100" },
  { id: "analysis", label: "Performance Analysis", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  { id: "webdiscovery", label: "Web Discovery", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-100" },
  { id: "webimport", label: "Import URL", icon: Globe, color: "text-slate-600", bg: "bg-slate-100" },
  { id: "telegram", label: "Telegram Discovery", icon: Sparkles, color: "text-sky-500", bg: "bg-sky-50" },
  { id: "materials", label: "Materials", icon: FolderOpen, color: "text-orange-600", bg: "bg-orange-100" },
];

export default function StudyLab() {
  const [activeTab, setActiveTab] = useState("quiz");
  const [noteSummary, setNoteSummary] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: () => base44.entities.StudyMaterial.list("-created_date"),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-violet-600 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Powered</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Study Lab
        </h1>
        <p className="text-slate-500 mt-1">
          Generate quizzes, summarize notes, and get in-depth explanations
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200/60 p-1 h-auto flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "data-[state=active]:bg-slate-900 data-[state=active]:text-white",
                "flex items-center gap-2 px-4 py-2.5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="quiz" className="mt-0">
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl p-6 border border-violet-200/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Active Recall</h3>
                  <p className="text-sm text-slate-600">Quiz yourself to strengthen memory retention. Studies show active recall improves learning by up to 50%.</p>
                </div>
              </div>

              <QuizGenerator modules={modules} materials={materials} />
            </div>
          </TabsContent>

          <TabsContent value="docchat" className="mt-0">
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-200/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                  <MessageSquareText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Chat with Document</h3>
                  <p className="text-sm text-slate-600">Upload your study materials and talk to an AI tutor about the content. Use Voice Tutor mode for immersive audio learning!</p>
                </div>
              </div>
              <DocumentChat materials={materials} />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-200/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Smart Summaries</h3>
                  <p className="text-sm text-slate-600">Transform lengthy lectures into structured, easy-to-review notes using AI-powered summarization.</p>
                </div>
              </div>

              <NoteSummarizer materials={materials} onGenerate={setNoteSummary} />

              {noteSummary && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-5 duration-500">
                  <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-blue-200/60 shadow-2xl shadow-blue-500/10 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-xl text-white">Your Beautiful Notes</h4>
                      </div>
                    </div>
                    <div className="p-8">
                      <ProfessionalAIContent content={noteSummary} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="deepdive" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DeepDive />
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                  <Lightbulb className="w-8 h-8 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Feynman Technique</h3>
                  <p className="text-sm text-emerald-100">
                    "If you can't explain it simply, you don't understand it well enough."
                    Get concepts broken down into simple, clear explanations.
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Try Asking About:</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Thermodynamics", "Machine Learning", "Gravity Storage", "Neural Networks", "Blockchain"].map((topic) => (
                      <Badge key={topic} variant="secondary" className="bg-slate-100">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="essay" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EssayAssessment />
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white">
                  <PenTool className="w-8 h-8 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">AI Essay Feedback</h3>
                  <p className="text-sm text-rose-100">
                    Get detailed, constructive feedback on content, structure, clarity,
                    and grammar. Improve your writing with AI-powered analysis.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PerformanceAnalysis />
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white">
                  <TrendingUp className="w-8 h-8 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Deep Insights</h3>
                  <p className="text-sm text-purple-100">
                    Identify granular skill gaps and get targeted micro-learning
                    modules tailored to your needs. Data-driven learning optimization.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webdiscovery" className="mt-0">
            <ResourceSearch modules={modules} />
          </TabsContent>

          <TabsContent value="telegram" className="mt-0">
            <TelegramDiscovery modules={modules} />
          </TabsContent>

          <TabsContent value="webimport" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WebContentImporter modules={modules} />
              </div>
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
                  <Globe className="w-8 h-8 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Learn from the Web</h3>
                  <p className="text-sm text-indigo-100">
                    Import study materials from Wikipedia, Khan Academy, past papers,
                    textbooks online, and educational websites!
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Try These Resources:</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div>📚 Wikipedia articles</div>
                    <div>📝 Past exam papers online</div>
                    <div>🎓 OpenStax textbooks</div>
                    <div>🧮 Khan Academy lessons</div>
                    <div>🔬 Study guides & tutorials</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div>
                <MaterialUploader modules={modules} onSuccess={() => { }} />
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200/60">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Your Materials</h3>
                    <p className="text-sm text-slate-500">
                      {materials?.length || 0} uploaded files
                    </p>
                  </div>

                  {(!materials || materials.length === 0) ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="font-medium text-slate-900 mb-1">No materials yet</h4>
                      <p className="text-sm text-slate-500">
                        Upload PDFs or notes to generate quizzes and summaries
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {materials.map((material) => {
                        const module = modules?.find(m => m.id === material.module_id);
                        const isTelegram = material.tags?.includes('telegram');
                        const isAuto = material.tags?.includes('auto-discovered');

                        const handleAction = async (action, mat) => {
                          if (action === 'view' || action === 'open') {
                            if (window['electron']?.openExternalUrl) {
                              window['electron'].openExternalUrl(mat.file_url);
                            } else {
                              window.open(mat.file_url, '_blank');
                            }
                          } else if (action === 'download' && mat.type === 'pdf') {
                            if (window['electron']?.downloadUrl) {
                              const fileName = `${mat.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                              toast.loading("Starting download...");
                              try {
                                await window['electron'].downloadUrl({ url: mat.file_url, name: fileName });
                                toast.success("Download complete! File saved in your lab storage.");
                              } catch (err) {
                                toast.error("Download failed.");
                              }
                            }
                          }
                        };

                        return (
                          <div key={material.id} className="p-5 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                isTelegram ? "bg-sky-100 text-sky-600 border border-sky-200" :
                                  material.type === "pdf" ? "bg-red-50 text-red-600 border border-red-100" :
                                    material.type === "link" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                                      material.type === "video" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                              )}>
                                {isTelegram ? <Send className="w-6 h-6" /> :
                                  material.type === "pdf" ? <FileText className="w-6 h-6" /> :
                                    material.type === "link" ? <Globe className="w-6 h-6" /> :
                                      material.type === "video" ? <Youtube className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />
                                }
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                    {material.title}
                                  </p>
                                  {isAuto && (
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-200 bg-emerald-50 text-emerald-600 uppercase font-extrabold tracking-tight">
                                      AI Auto
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {module ? (
                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold">
                                      {module.code}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">
                                      Unassigned
                                    </Badge>
                                  )}

                                  {material.tags?.filter(t => t !== 'auto-discovered' && t !== material.type)?.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[10px] text-slate-500 bg-slate-100/30 border-slate-200/60 px-1.5 h-5 rounded-md capitalize">
                                      {tag}
                                    </Badge>
                                  ))}

                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 ml-auto">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(material.created_date), "MMM d")}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {(material.type === 'pdf' || material.local_file_name) && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-9 px-3 rounded-xl border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                                      onClick={() => handleAction('view', material)}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </Button>
                                    {!material.local_file_name && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 px-3 rounded-xl border-slate-200 hover:bg-white hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                                        onClick={() => handleAction('download', material)}
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </>
                                )}

                                {(material.type === 'link' || material.type === 'video') && (
                                  <Button
                                    size="sm"
                                    className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 transition-all font-semibold"
                                    onClick={() => handleAction('open', material)}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    {isTelegram ? 'Join Community' : 'Open Link'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}