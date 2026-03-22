import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  GraduationCap,
  Clock,
  User,
  FileText,
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import ModuleMaterialsDialog from "@/components/modules/ModuleMaterialsDialog";

const moduleColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const semesters = ["Fall 2024", "Spring 2025", "Summer 2025", "Fall 2025"];

export default function Modules() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    instructor: "",
    credits: 3,
    semester: "Spring 2025",
    color: moduleColors[0],
    progress: 0,
  });
  const [searchingOnline, setSearchingOnline] = useState(false);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      setSearch(code);
    }
  }, []);

  const { data: modules, isLoading } = useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const list = await base44.entities.Module.list();
      return list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    },
  });

  // @ts-ignore
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Module.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      resetForm();
    },
  });

  // @ts-ignore
  const updateMutation = useMutation({
    mutationFn: (vars) => base44.entities.Module.update(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      resetForm();
    },
  });

  // @ts-ignore
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Module.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modules"] }),
  });

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      description: "",
      instructor: "",
      credits: 3,
      semester: "Spring 2025",
      color: moduleColors[Math.floor(Math.random() * moduleColors.length)],
      progress: 0,
    });
    setEditingModule(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setFormData({
      code: module.code || "",
      title: module.title || "",
      description: module.description || "",
      instructor: module.instructor || "",
      credits: module.credits || 3,
      semester: module.semester || "Spring 2025",
      color: module.color || moduleColors[0],
      progress: module.progress || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingModule) {
      // @ts-ignore
      updateMutation.mutate({
        id: editingModule.id,
        data: formData
      });
    } else {
      // @ts-ignore
      createMutation.mutate(formData);
    }
  };

  const searchModuleOnline = async () => {
    if (!formData.code && !formData.title) {
      alert("Please enter a module code or title first");
      return;
    }

    setSearchingOnline(true);
    try {
      const searchQuery = formData.code || formData.title;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for information about this university course/module: "${searchQuery}". 
        
Find and return:
- Full course title
- Course description
- Instructor name (if publicly available)
- Number of credits
- Any relevant course resources or links

Return only factual information found online. If you cannot find specific information, leave those fields empty.`,
        systemPrompt: "You are an academic researcher finding course details online.",
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            instructor: { type: "string" },
            credits: { type: "number" },
            resources: { type: "string" }
          }
        }
      });

      setFormData({
        ...formData,
        title: result.title || formData.title,
        description: result.description || formData.description,
        instructor: result.instructor || formData.instructor,
        credits: result.credits || formData.credits,
      });

      if (result.resources) {
        setFormData(prev => ({
          ...prev,
          description: prev.description
            ? `${prev.description}\n\nResources:\n${result.resources}`
            : `Resources:\n${result.resources}`
        }));
      }

    } catch (error) {
      alert("Failed to find module information online");
    } finally {
      setSearchingOnline(false);
    }
  };

  const filteredModules = modules?.filter(
    m =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.code?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            My Modules
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your enrolled courses and track progress
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No modules yet</h3>
          <p className="text-slate-500 mt-1 mb-4">Add your first module to get started</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <div
              key={module.id}
              className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedModule(module);
                setMaterialsDialogOpen(true);
              }}
            >
              {/* Color Banner */}
              <div className={cn("h-3", module.color || moduleColors[index % moduleColors.length])} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                    module.color || moduleColors[index % moduleColors.length]
                  )}>
                    {module.code?.slice(0, 2) || "M"}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModule(module);
                        setMaterialsDialogOpen(true);
                      }}>
                        <FileText className="w-4 h-4 mr-2" />
                        Materials
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(module);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(module.id);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-600">
                  {module.code}
                </Badge>
                <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2">
                  {module.title}
                </h3>

                <div className="space-y-2 text-sm text-slate-500 mb-4">
                  {module.instructor && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{module.instructor}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{module.credits || 3} credits</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-900">{module.progress || 0}%</span>
                  </div>
                  <Progress value={module.progress || 0} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Add New Module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">AI-Powered Search</p>
                <p className="text-xs text-blue-700 mt-0.5">Enter a module code or title, then click search to auto-fill details from online sources</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Module Code</Label>
                <Input
                  placeholder="CS301"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={searchModuleOnline}
              disabled={searchingOnline || (!formData.code && !formData.title)}
              className="w-full"
            >
              {searchingOnline ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching online...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Search Module Online
                </>
              )}
            </Button>

            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input
                placeholder="Advanced Algorithms"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Course description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Instructor</Label>
              <Input
                placeholder="Dr. Smith"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData({ ...formData, semester: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {moduleColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-all",
                      color,
                      formData.color === color && "ring-2 ring-offset-2 ring-slate-900"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.code || !formData.title}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingModule ? "Update" : "Create"} Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Materials Dialog */}
      <ModuleMaterialsDialog
        module={selectedModule}
        isOpen={materialsDialogOpen}
        onClose={() => {
          setMaterialsDialogOpen(false);
          setSelectedModule(null);
        }}
      />
    </div>
  );
}