import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from "date-fns";
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Edit,
  ChevronDown,
  Upload,
  FileText,
  Loader2,
  X,
  Send,
  Sparkles,
  ArrowUpDown,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/NotificationContext";

const statusConfig = {
  not_started: { label: "Not Started", icon: Circle, color: "text-slate-400", bg: "bg-slate-100" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-500", bg: "bg-blue-100" },
  submitted: { label: "Submitted", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-100" },
  graded: { label: "Graded", icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-100" },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function Assignments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [sortBy, setSortBy] = useState("due_date_asc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [aiHelperDialogOpen, setAiHelperDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionContent, setSubmissionContent] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiIdeas, setAiIdeas] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    module_id: "",
    description: "",
    due_date: "",
    status: "not_started",
    priority: "medium",
    weight: 10,
  });

  const queryClient = useQueryClient();
  const { refreshNotifications } = useNotifications();

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-due_date"),
  });

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list(),
  });

  // @ts-ignore
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      await refreshNotifications();
      resetForm();
    },
  });

  // @ts-ignore
  const updateMutation = useMutation({
    // @ts-ignore
    mutationFn: (vars) => base44.entities.Assignment.update(vars.id, vars.data),
    onSuccess: async (updatedAssignment, vars) => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });

      // If assignment was just graded, create notification
      // @ts-ignore
      if (vars.data.status === 'graded' && vars.data.grade !== undefined) {
        const notificationService = await import('@/lib/notificationService');
        // @ts-ignore
        const assignment = assignments?.find(a => a.id === updatedAssignment?.id) || updatedAssignment || { ...vars.data, id: vars.id };
        // @ts-ignore
        await notificationService.default.createGradedNotification(assignment, vars.data.grade);
      }

      await refreshNotifications();
      resetForm();
    },
  });

  // @ts-ignore
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Assignment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      refreshNotifications();
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      module_id: "",
      description: "",
      due_date: "",
      status: "not_started",
      priority: "medium",
      weight: 10,
    });
    setEditingAssignment(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title || "",
      module_id: assignment.module_id || "",
      description: assignment.description || "",
      due_date: assignment.due_date ? format(new Date(assignment.due_date), "yyyy-MM-dd'T'HH:mm") : "",
      status: assignment.status || "not_started",
      priority: assignment.priority || "medium",
      weight: assignment.weight || 10,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingAssignment) {
      // @ts-ignore
      updateMutation.mutate({ id: editingAssignment.id, data: formData });
    } else {
      // @ts-ignore
      createMutation.mutate(formData);
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

  const handleCalendarUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const fileExtension = file.name.split('.').pop().toLowerCase();
      let result;

      // For structured data files (xlsx, ics, csv), try ExtractDataFromUploadedFile first
      if (['xlsx', 'xls', 'csv', 'ics'].includes(fileExtension)) {
        try {
          const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
            file_url: file_url,
            json_schema: {
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
                      description: { type: "string" },
                      priority: { type: "string" },
                      weight: { type: "number" }
                    }
                  }
                }
              }
            }
          });

          if (extractResult.status === 'success' && extractResult.output) {
            result = extractResult.output;
          }
        } catch (extractError) {
          console.log('ExtractData failed, falling back to LLM:', extractError);
        }
      }

      // Fallback to LLM for all file types or if extraction failed
      if (!result) {
        result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are analyzing an academic calendar/schedule document that may be in various formats (Excel/XLSX, ICS calendar, PDF, Word, or image).

CRITICAL INSTRUCTIONS:
- For XLSX/Excel files: Read all sheets and extract course codes, titles, instructors, assignment names, and due dates
- For ICS calendar files: Parse all calendar events, treating them as assignments with due dates
- For PDF/Word/Images: Extract all visible text about courses and assignments
- Look for patterns like: course codes (CS101, MATH201), assignment titles (Homework 1, Project 2), due dates, instructor names
- Extract EVERY assignment you can find with its due date

Return a JSON object with this EXACT structure:
{
  "modules": [
    {
      "code": "Course code (e.g., CS301)",
      "title": "Full course title",
      "instructor": "Professor name (or empty string)",
      "credits": 3,
      "semester": "Spring 2025"
    }
  ],
  "assignments": [
    {
      "title": "Assignment title",
      "module_code": "Associated course code",
      "due_date": "ISO format YYYY-MM-DDTHH:MM:SS",
      "description": "Details if available",
      "priority": "medium",
      "weight": 10
    }
  ]
}

If you find calendar events without clear course associations, create a generic module called "General" with code "GEN".
Extract ALL assignments and courses you can identify. Be thorough.`,
          systemPrompt: "You are an expert academic advisor who extracts structured data from documents.",
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
                    description: { type: "string" },
                    priority: { type: "string" },
                    weight: { type: "number" }
                  }
                }
              }
            }
          }
        });
      }

      if (result?.modules?.length > 0) {
        const createdModules = [];
        for (const module of result.modules) {
          try {
            const created = await base44.entities.Module.create({
              code: module.code || "N/A",
              title: module.title || "Untitled",
              instructor: module.instructor || "",
              credits: module.credits || 3,
              semester: module.semester || "Spring 2025",
              progress: 0
            });
            createdModules.push(created);
          } catch (err) {
            console.error("Module creation error:", err);
          }
        }

        if (result?.assignments?.length > 0) {
          const existingAssignments = await base44.entities.Assignment.list();

          for (const assignment of result.assignments) {
            try {
              const module = createdModules.find(m => m.code === assignment.module_code);
              if (module) {
                // Check if assignment with same title and due date already exists
                const duplicate = existingAssignments.find(existing =>
                  existing.title === assignment.title &&
                  existing.due_date === assignment.due_date
                );

                if (!duplicate) {
                  await base44.entities.Assignment.create({
                    title: assignment.title || "Untitled Assignment",
                    module_id: module.id,
                    description: assignment.description || "",
                    due_date: assignment.due_date,
                    status: "not_started",
                    priority: assignment.priority || "medium",
                    weight: assignment.weight || 10
                  });
                }
              }
            } catch (err) {
              console.error("Assignment creation error:", err);
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["assignments"] });
        queryClient.invalidateQueries({ queryKey: ["modules"] });
        alert(`Imported ${createdModules.length} modules and ${result.assignments?.length || 0} assignments!`);
        setUploadDialogOpen(false);
        setFile(null);
      } else {
        alert("No data found in document");
      }
    } catch (error) {
      alert(error?.message || "Failed to process calendar");
    } finally {
      setUploading(false);
    }
  };

  const getModuleName = (moduleId) => {
    const module = modules?.find(m => m.id === moduleId);
    return module?.code || "Unknown";
  };

  const getTimeLabel = (date) => {
    if (!date) return { text: "Undated", urgent: false };
    const d = new Date(date);
    if (isNaN(d.getTime())) return { text: "Invalid date", urgent: false };
    if (isPast(d)) return { text: "Overdue", urgent: true };
    if (isToday(d)) return { text: "Due today", urgent: true };
    if (isTomorrow(d)) return { text: "Due tomorrow", urgent: false };
    return { text: formatDistanceToNow(d, { addSuffix: true }), urgent: false };
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      let fileUrl = submissionUrl;

      if (submissionFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: submissionFile });
        fileUrl = uploadResult.file_url;
      }

      // Generate AI summary if content is provided
      let aiSummary = "";
      if (submissionContent) {
        aiSummary = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this student's assignment submission and provide:

Assignment: ${selectedAssignment.title}
Student's Work:
${submissionContent}

Provide:
1. A brief summary of what the student submitted (2-3 sentences)
2. Key strengths in their approach
3. Areas that could be improved or expanded
4. Overall assessment of completeness

Keep it constructive and helpful.`
        });
      }

      // @ts-ignore
      await updateMutation.mutateAsync({
        id: selectedAssignment.id,
        data: {
          status: "submitted",
          submission_url: fileUrl,
          description: submissionContent ? `${selectedAssignment.description || ''}\n\n--- SUBMISSION ---\n${submissionContent}\n\n--- AI ANALYSIS ---\n${aiSummary}` : selectedAssignment.description
        }
      });

      if (aiSummary) {
        alert("Assignment submitted! AI has analyzed your work - check the assignment description for feedback.");
      }

      setSubmitDialogOpen(false);
      setSelectedAssignment(null);
      setSubmissionFile(null);
      setSubmissionUrl("");
      setSubmissionContent("");
    } catch (error) {
      alert(error?.message || "Failed to submit assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetAiIdeas = async () => {
    if (!selectedAssignment) return;

    setAiGenerating(true);
    try {
      const module = modules?.find(m => m.id === selectedAssignment.module_id);

      const ideas = await base44.integrations.Core.InvokeLLM({
        prompt: `Help a student brainstorm ideas and approaches for completing this assignment:

Assignment: ${selectedAssignment.title}
Course: ${module?.title || 'Unknown'} (${module?.code || ''})
Description: ${selectedAssignment.description || 'No description provided'}
Due Date: ${format(new Date(selectedAssignment.due_date), 'PPP')}
Weight: ${selectedAssignment.weight}% of grade

Provide:
1. 3-5 key approaches or strategies to tackle this assignment
2. Important topics or concepts to focus on
3. Suggested timeline/breakdown of tasks
4. Resources or study materials that might help
5. Common pitfalls to avoid

Format your response in a clear, organized manner with bullet points and sections.`
      });

      setAiIdeas(ideas);
    } catch (error) {
      alert(error?.message || "Failed to generate ideas");
    } finally {
      setAiGenerating(false);
    }
  };

  const filteredAssignments = assignments?.filter(a => {
    const matchesSearch = a.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Safe date parsing to prevent crashes
    const dateA = a.due_date ? new Date(a.due_date) : new Date(0);
    const dateB = b.due_date ? new Date(b.due_date) : new Date(0);

    // Ensure dates are valid
    const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
    const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();

    switch (sortBy) {
      case "due_date_asc":
        return timeA - timeB;
      case "due_date_desc":
        return timeB - timeA;
      case "priority":
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  }) || [];

  // Group by status and date
  const groupedAssignments = {
    pending: filteredAssignments.filter(a => ["not_started", "in_progress"].includes(a.status) && !isPast(new Date(a.due_date))),
    overdue: filteredAssignments.filter(a => ["not_started", "in_progress"].includes(a.status) && isPast(new Date(a.due_date))),
    completed: filteredAssignments.filter(a => ["submitted", "graded"].includes(a.status)),
  };

  const displayAssignments = activeTab === "upcoming"
    ? [...groupedAssignments.pending, ...groupedAssignments.completed]
    : groupedAssignments.overdue;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Assignments
          </h1>
          <p className="text-slate-500 mt-1">
            Track deadlines and manage your coursework
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setUploadDialogOpen(true)}
            variant="outline"
            className="shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Calendar
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white">
            <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date_asc">Due Date (Soonest)</SelectItem>
            <SelectItem value="due_date_desc">Due Date (Latest)</SelectItem>
            <SelectItem value="priority">Priority (Highest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "upcoming"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming & Completed
            {groupedAssignments.pending.length > 0 && (
              <Badge className="ml-1 bg-blue-100 text-blue-700 hover:bg-blue-100 h-5 px-1.5 min-w-[20px] justify-center">
                {groupedAssignments.pending.length}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("overdue")}
          className={cn(
            "px-6 py-3 text-sm font-semibold transition-all border-b-2",
            activeTab === "overdue"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Passed Due Events
            {groupedAssignments.overdue.length > 0 && (
              <Badge className="ml-1 bg-red-100 text-red-700 hover:bg-red-100 h-5 px-1.5 min-w-[20px] justify-center">
                {groupedAssignments.overdue.length}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Assignments List */}
      {assignmentsLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : displayAssignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            {activeTab === "upcoming" ? <ClipboardList className="w-8 h-8 text-slate-400" /> : <History className="w-8 h-8 text-slate-400" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            {activeTab === "upcoming" ? "No upcoming assignments" : "No passed due events"}
          </h3>
          <p className="text-slate-500 mt-1 mb-4">
            {activeTab === "upcoming" ? "Add your first assignment to track" : "Great job! You don't have any overdue tasks."}
          </p>
          {activeTab === "upcoming" && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Passed Due (Only shown in Overdue tab) */}
          {activeTab === "overdue" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Overdue Tasks ({groupedAssignments.overdue.length})
              </h2>
              <div className="space-y-3">
                {groupedAssignments.overdue.map((assignment) => {
                  const status = statusConfig[assignment.status] || statusConfig.not_started;
                  const priority = priorityConfig[assignment.priority] || priorityConfig.low;
                  const timeLabel = getTimeLabel(assignment.due_date);
                  const StatusIcon = status.icon || Circle;

                  return (
                    <div
                      key={assignment.id}
                      className="group bg-red-50/50 rounded-xl border border-red-200 p-5 hover:shadow-lg hover:bg-red-50 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => {
                            // @ts-ignore
                            updateMutation.mutate({
                              id: assignment.id,
                              data: { status: "in_progress" }
                            });
                          }}
                          className={cn("mt-0.5 transition-colors", status.color)}
                        >
                          <StatusIcon className="w-5 h-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                              <p className="text-sm text-slate-500 mt-0.5">
                                {getModuleName(assignment.module_id)}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(assignment.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="outline" className={priority.color}>
                              {priority.label}
                            </Badge>
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {timeLabel.text}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming & Completed (Only shown in Upcoming tab) */}
          {activeTab === "upcoming" && (
            <>
              {/* Pending */}
              {groupedAssignments.pending.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Pending ({groupedAssignments.pending.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedAssignments.pending.map((assignment) => {
                      const status = statusConfig[assignment.status] || statusConfig.not_started;
                      const priority = priorityConfig[assignment.priority] || priorityConfig.low;
                      const timeLabel = getTimeLabel(assignment.due_date);
                      const StatusIcon = status.icon || Circle;

                      return (
                        <div
                          key={assignment.id}
                          className="group bg-white rounded-xl border border-slate-200/60 p-5 hover:shadow-lg hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => {
                                // @ts-ignore
                                updateMutation.mutate({
                                  id: assignment.id,
                                  data: { status: assignment.status === "not_started" ? "in_progress" : "submitted" }
                                });
                              }}
                              className={cn("mt-0.5 transition-colors", status.color)}
                            >
                              <StatusIcon className="w-5 h-5" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {getModuleName(assignment.module_id)}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setAiHelperDialogOpen(true);
                                    }}>
                                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                                      AI Helper
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setSubmitDialogOpen(true);
                                    }}>
                                      <Send className="w-4 h-4 mr-2 text-blue-600" />
                                      Submit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(assignment)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteMutation.mutate(assignment.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                <Badge variant="outline" className={priority.color}>
                                  {priority.label}
                                </Badge>
                                <Badge variant="outline" className={cn(
                                  timeLabel.urgent
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-slate-50 text-slate-600"
                                )}>
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {timeLabel.text}
                                </Badge>
                                {assignment.weight && (
                                  <Badge variant="outline" className="bg-slate-50">
                                    {assignment.weight}% weight
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed */}
              {groupedAssignments.completed.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pt-4 border-t border-slate-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Completed ({groupedAssignments.completed.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedAssignments.completed.map((assignment) => {
                      const status = statusConfig[assignment.status] || statusConfig.submitted;
                      const priority = priorityConfig[assignment.priority] || priorityConfig.low;
                      const StatusIcon = status.icon || CheckCircle2;

                      return (
                        <div
                          key={assignment.id}
                          className="group bg-slate-50 rounded-xl border border-slate-200/60 p-5 opacity-70 hover:opacity-100 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <StatusIcon className={cn("w-5 h-5 mt-0.5", status.color)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-slate-700 line-through">
                                    {assignment.title}
                                  </h3>
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {getModuleName(assignment.module_id)}
                                  </p>
                                </div>
                                {assignment.grade !== undefined && (
                                  <Badge className="bg-purple-100 text-purple-700">
                                    {assignment.grade}/{assignment.max_grade || 100}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Submit Assignment Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Submit Assignment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold text-slate-900">{selectedAssignment?.title}</h3>
              <p className="text-sm text-slate-500">
                {modules?.find(m => m.id === selectedAssignment?.module_id)?.code}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Work / Content</Label>
              <Textarea
                placeholder="Write or paste your assignment content here... AI will analyze it and provide feedback."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                <Sparkles className="w-3 h-3 inline mr-1" />
                AI will analyze your submission and provide constructive feedback
              </p>
            </div>

            <div className="space-y-2">
              <Label>Attachment (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {submissionFile ? (
                  <div>
                    <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">{submissionFile.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSubmissionFile(null)}
                      className="mt-2"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('submission-upload').click()}
                    >
                      Choose File
                    </Button>
                    <input
                      id="submission-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setSubmissionFile(e.target.files?.[0])}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or Link (Optional)</Label>
              <Input
                placeholder="https://..."
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={submitting || (!submissionContent && !submissionFile && !submissionUrl)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {submissionContent ? 'Analyzing & Submitting...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Helper Dialog */}
      <Dialog open={aiHelperDialogOpen} onOpenChange={setAiHelperDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assignment Helper
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900">{selectedAssignment?.title}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {modules?.find(m => m.id === selectedAssignment?.module_id)?.code} •
                Due {selectedAssignment?.due_date && format(new Date(selectedAssignment.due_date), 'PPP')}
              </p>
              {selectedAssignment?.description && (
                <p className="text-sm text-slate-600 mt-2">{selectedAssignment.description}</p>
              )}
            </div>

            {!aiIdeas ? (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  Get AI-powered suggestions on how to approach this assignment
                </p>
                <Button
                  onClick={handleGetAiIdeas}
                  disabled={aiGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Ideas
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="bg-white rounded-lg border border-slate-200 p-4 whitespace-pre-wrap">
                  {aiIdeas}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAiIdeas("");
                    handleGetAiIdeas();
                  }}
                  className="mt-4"
                  disabled={aiGenerating}
                >
                  Regenerate Ideas
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Calendar Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Import Academic Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Upload your school calendar in Excel, Word, PDF, ICS, or image format.
              AI will extract modules and assignments automatically.
            </p>

            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300",
                file && "border-emerald-500 bg-emerald-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div>
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">Drag and drop your calendar</p>
                  <p className="text-sm text-slate-400 mb-4">
                    Supports Excel, Word, PDF, Images, ICS
                  </p>
                  <Button variant="outline" onClick={() => document.getElementById('calendar-upload').click()}>
                    Browse Files
                  </Button>
                  <input
                    id="calendar-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.ics"
                  />
                </>
              )}
            </div>

            <Button
              onClick={handleCalendarUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Calendar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Assignment" : "Add New Assignment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Assignment title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => setFormData({ ...formData, module_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
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

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Assignment details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weight (%)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.module_id}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingAssignment ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}