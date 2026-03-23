import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Scan, User, GraduationCap, CheckCircle, Loader2, FileText, Brain, Users } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function Welcome() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // User details
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");

  // Document upload
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleUserDetailsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await base44.auth.updateMe({
        student_id: studentId,
        major: major,
        year: year,
        onboarded: true
      });

      toast.success("Profile updated!");
      setStep(2);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDocumentScan = async () => {
    if (!file) {
      toast.error("Please select a document first");
      return;
    }

    setExtracting(true);

    try {
      // Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Use LLM to extract data with more context
      const extractionPrompt = `Extract course modules and assignments from this document. 
      
Return a JSON object with this structure:
{
  "modules": [
    {
      "code": "Course code (e.g., CS301)",
      "title": "Full course title",
      "instructor": "Professor name if available",
      "credits": number of credits (as a number),
      "semester": "Current or upcoming semester"
    }
  ],
  "assignments": [
    {
      "title": "Assignment title",
      "module_code": "Associated course code",
      "due_date": "Due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)",
      "description": "Assignment description if available"
    }
  ]
}

Extract all modules and assignments you can find. If some fields are missing, use reasonable defaults.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: extractionPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  title: { type: "string" },
                  instructor: { type: "string" },
                  credits: { type: "number" },
                  semester: { type: "string" }
                }
              }
            },
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  module_code: { type: "string" },
                  due_date: { type: "string" },
                  description: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result && result.modules) {
        const { modules, assignments } = result;

        // Create modules first
        const createdModules = [];
        if (modules && modules.length > 0) {
          for (const module of modules) {
            try {
              const created = await base44.entities.Module.create({
                code: module.code || "N/A",
                title: module.title || "Untitled Module",
                instructor: module.instructor || "TBA",
                credits: module.credits || 3,
                semester: module.semester || "Spring 2025",
                progress: 0
              });
              createdModules.push(created);
            } catch (err) {
              console.error("Failed to create module:", err);
            }
          }
        }

        // Create assignments and link to modules
        if (assignments && assignments.length > 0) {
          for (const assignment of assignments) {
            try {
              const module = createdModules.find(m => m.code === assignment.module_code);
              if (module) {
                await base44.entities.Assignment.create({
                  title: assignment.title || "Untitled Assignment",
                  module_id: module.id,
                  description: assignment.description || "",
                  due_date: assignment.due_date,
                  status: "not_started",
                  priority: "medium"
                });
              }
            } catch (err) {
              console.error("Failed to create assignment:", err);
            }
          }
        }

        toast.success(`Imported ${createdModules.length} modules and ${assignments?.length || 0} assignments!`);
        navigate(createPageUrl("Dashboard"));
      } else {
        toast.error("No data found in document");
      }
    } catch (error) {
      toast.error(error.message || "Failed to process document");
      console.error(error);
    } finally {
      setExtracting(false);
    }
  };

  const skipToApp = () => {
    navigate(createPageUrl("Dashboard"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 bg-white rounded-3xl shadow-lg border border-slate-100 p-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors"></div>
            <img src={logo} alt="Study Buddy" className="w-full h-full object-contain relative z-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 mb-4 tracking-tight">
            Study Buddy
          </h1>
          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
            Your intelligent academic companion. Centralize your modules, organize your assignments, consult your AI tutor, and share resources with the <strong className="text-indigo-600">Student Community Hub</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all bg-blue-600" onClick={() => navigate('/Signup')}>
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 hover:-translate-y-1 transition-all" onClick={() => navigate('/Login')}>
              Sign In
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full text-slate-400 hover:text-slate-600 text-xs mt-2 w-full sm:w-auto" onClick={() => navigate(createPageUrl("Dashboard"))}>
              Skip to app (Local Demo)
            </Button>
          </div>
        </div>

        {/* Feature Explainer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in slide-in-from-bottom-10 fade-in duration-1000">
          <Card className="border-0 shadow-xl shadow-blue-900/5 bg-white/60 backdrop-blur-sm overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <CardHeader>
              <Users className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Community Hub</CardTitle>
              <CardDescription>Share and discover public resources.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Struggling with <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded">GGH1501</span>? Simply search the Community Hub to download public summaries, past papers, and study notes uploaded by your peers. Give back by uploading your own resources!
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-purple-900/5 bg-white/60 backdrop-blur-sm overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
            <CardHeader>
              <Brain className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>AI Study Lab</CardTitle>
              <CardDescription>Chat directly with your documents.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Upload your massive prescribed textbooks. Ask the AI to summarize chapter 4, generate 10 flashcards, or create a mock exam. Study smarter, not harder.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-emerald-900/5 bg-white/60 backdrop-blur-sm overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <CardHeader>
              <Scan className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Auto Schedule Extractor</CardTitle>
              <CardDescription>Never miss a deadline.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Drop your university tutorial letter (PDF/Image) here, and our AI will automatically extract all your module codes, assignment due dates, and build your entire semester calendar instantly.
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-amber-900/5 bg-white/60 backdrop-blur-sm overflow-hidden group">
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <CardHeader>
              <GraduationCap className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Personalized Learning Paths</CardTitle>
              <CardDescription>Your roadmap to success.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Our recommendation engine tracks your module priorities, pending tasks, and study streak to dynamically generate daily goals telling you exactly what to focus on right now.
            </CardContent>
          </Card>
        </div>

        {/* Separator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or import manually below</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Your Details</span>
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Import Data</span>
          </div>
        </div>

        {/* Step 1: User Details */}
        {step === 1 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Your Details
              </CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserDetailsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g., 2024001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="major">Major / Field of Study</Label>
                  <Input
                    id="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Academic Year</Label>
                  <Input
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g., 3rd Year"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                  </Button>
                  <Button type="button" variant="outline" onClick={skipToApp}>
                    Skip
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Document Scanner */}
        {step === 2 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-blue-600" />
                Import Your Schedule
              </CardTitle>
              <CardDescription>
                Upload a document with your modules and assignments (PDF, image, or text)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-3">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-2">
                      Drag and drop your document here
                    </p>
                    <p className="text-sm text-slate-400 mb-4">or</p>
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                    />
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDocumentScan}
                  className="flex-1"
                  disabled={!file || extracting}
                >
                  {extracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan & Import
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={skipToApp}>
                  Skip for now
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Upload your course registration document or assignment schedule.
                  Our AI will automatically extract modules, assignments, and deadlines.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}