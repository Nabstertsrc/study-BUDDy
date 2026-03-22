
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  Brain,
  Target,
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Zap,
  Trophy,
  Clock,
  Plus,
  X,
  ExternalLink,
  PlayCircle,
  FileText,
  Calendar,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import StudyPlanGenerator from "@/components/dashboard/StudyPlanGenerator";
import RecommendationsPanel from "@/components/dashboard/RecommendationsPanel";
import { generateRecommendations } from "@/lib/recommendationEngine";

export default function LearningPath() {
  const [generating, setGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ goal: "", goal_type: "other", target_modules: [], deadline: "" });
  const [generatingTutorial, setGeneratingTutorial] = useState(null);
  const [tutorials, setTutorials] = useState({});

  const queryClient = useQueryClient();

  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => base44.entities.Module.list(),
  });

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => base44.entities.Quiz.list("-last_attempted"),
  });

  const { data: activities } = useQuery({
    queryKey: ["learning-activities"],
    queryFn: () => base44.entities.LearningActivity.list("-created_date", 50),
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: () => base44.entities.StudyMaterial.list(),
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: goals } = useQuery({
    queryKey: ["learning-goals"],
    queryFn: () => base44.entities.LearningGoal.filter({ status: "active" }),
  });

  const { data: studySessions } = useQuery({
    queryKey: ["study-sessions"],
    queryFn: () => base44.entities.StudySession.list("-date"),
  });


  const createGoalMutation = useMutation({
    mutationFn: async (goalData) => {
      return await base44.entities.LearningGoal.create(goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-goals"] });
      setShowGoalDialog(false);
      setNewGoal({ goal: "", goal_type: "other", target_modules: [], deadline: "" });
    }
  });

  const handleCreateGoal = () => {
    // @ts-ignore - TypeScript incorrectly infers mutation signature  
    createGoalMutation.mutate(newGoal);
  };

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.LearningGoal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-goals"] }),
  });

  const { data: recommendationsData, isLoading: recsLoading, refetch: refetchRecs, isFetching: recsFetching } = useQuery({
    queryKey: ["recommendations", modules?.length, assignments?.length],
    queryFn: () => generateRecommendations(modules || [], assignments || [], materials || []),
    enabled: !!modules,
    staleTime: 600000, // 10 minutes cache
  });

  const handleManualGeneratePlan = async (force = false) => {
    if (force) {
      toast.loading("AI Advisor: Creating your weekly plan...", { id: "gen-plan" });
      try {
        const { generateWeeklyPlan } = await import("@/lib/recommendationEngine");
        const newPlan = await generateWeeklyPlan(assignments || [], [], [], modules || [], true);

        // Refresh the whole recommendations set with the new plan
        queryClient.setQueryData(["recommendations", modules?.length, assignments?.length], (old) =>
          Object.assign({}, old || {}, { studyPlan: newPlan })
        );

        toast.success("AI Study Plan generated!", { id: "gen-plan" });
      } catch (err) {
        toast.error("Failed to generate plan. Check your credits.", { id: "gen-plan" });
      }
    } else {
      refetchRecs();
    }
  };

  const handleRefresh = () => {
    handleManualGeneratePlan(false);
  };

  const generateLearningPath = handleRefresh;

  const generateTutorial = async (topic, reason) => {
    if (tutorials[topic]) {
      toast.info(`Tutorial for "${topic}" is ready below.`);
      return;
    }

    setGeneratingTutorial(topic);
    toast.loading(`Synthesizing tutorial for "${topic}"...`, { id: "gen-tut" });

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging, easy-to-understand tutorial for high school students on: "${topic}"
Context: ${reason}
Structure the tutorial with:
1. **Quick Overview** - What this topic is about in simple terms
2. **Why It Matters** - Real-world applications
3. **Step-by-Step Explanation** - Break it down with examples
4. **Common Mistakes** - What to watch out for
5. **Practice Tips** - How to master this

Use conversational language, analogies, and examples. Make it fun and relatable!`,
        systemPrompt: "You are a master teacher who explains complex topics simply and effectively.",
        response_json_schema: null // Returning text for tutorial
      });

      setTutorials(prev => ({ ...prev, [topic]: response }));
      toast.success(`Tutorial for "${topic}" created successfully!`, { id: "gen-tut" });

      // Scroll to custom tutorials section
      setTimeout(() => {
        const section = document.getElementById('custom-tutorials-section');
        section?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (error) {
      console.error("Error generating tutorial:", error);
      toast.error("Failed to generate tutorial. Please try again.", { id: "gen-tut" });
    }
    setGeneratingTutorial(null);
  };

  const isLoading = recsLoading || generating;
  const hasData = recommendationsData && (recommendationsData?.insights?.length > 0 || recommendationsData?.studyPlan || recommendationsData?.complexTopics?.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Your Learning Path</h1>
          <p className="text-slate-500 mt-1">
            Personalized recommendations based on your progress & goals
          </p>
        </div>
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a Learning Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Goal Description</Label>
                <Textarea
                  placeholder="E.g., Prepare for final exam, Master calculus, Improve essay writing..."
                  value={newGoal.goal}
                  onChange={(e) => setNewGoal({ ...newGoal, goal: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Goal Type</Label>
                <Select value={newGoal.goal_type} onValueChange={(v) => setNewGoal({ ...newGoal, goal_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exam_prep">Exam Preparation</SelectItem>
                    <SelectItem value="topic_mastery">Topic Mastery</SelectItem>
                    <SelectItem value="skill_building">Skill Building</SelectItem>
                    <SelectItem value="grade_improvement">Grade Improvement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCreateGoal}
                disabled={!newGoal.goal || createGoalMutation.isPending}
                className="w-full"
              >
                {createGoalMutation.isPending ? "Setting Goal..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {goals && goals.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{goal.goal}</h4>
                    <Badge variant="outline" className="mt-1 text-xs">{goal.goal_type.replace('_', ' ')}</Badge>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteGoalMutation.mutate(goal.id)}
                  className="h-8 w-8"
                  disabled={deleteGoalMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {goal.deadline && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!hasData ? (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
          <div className="relative p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Ready to Level Up Your Learning? 🚀
            </h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Let AI analyze your quiz scores, study patterns, goals, and progress to create
              a personalized learning path just for you! Get tailored recommendations,
              identify areas to focus on, and achieve your goals faster.
            </p>
            <Button
              onClick={handleRefresh}
              disabled={isLoading || recsFetching}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/30"
            >
              {isLoading || recsFetching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Your Progress...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Learning Path
                </>
              )}
            </Button>

            <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
              {[
                { icon: Target, title: "Identify Goals", desc: "Know what to focus on" },
                { icon: Lightbulb, title: "Smart Tips", desc: "Get personalized advice" },
                { icon: Trophy, title: "Track Progress", desc: "See your growth" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Recommendations & Tutorials */}
          <div className="lg:col-span-2 space-y-8">
            <RecommendationsPanel
              complexTopics={recommendationsData?.complexTopics || []}
              recommendedMaterials={recommendationsData?.recommendedMaterials || []}
              externalResources={recommendationsData?.externalResources || []}
              modules={modules || []}
              onGenerateTutorial={generateTutorial}
              generatingTutorial={generatingTutorial}
              tutorials={tutorials}
            />

            {/* Generated Tutorials */}
            {Object.keys(tutorials).length > 0 && (
              <div id="custom-tutorials-section" className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Your Custom Tutorials
                </h3>
                {Object.entries(tutorials).map(([topic, content]) => (
                  <Card key={topic} className="p-6 border-2 border-amber-200 bg-amber-50/30">
                    <h4 className="font-bold text-lg mb-4 text-amber-900">{topic}</h4>
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
                      {content}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Insights & Study Plan */}
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Performance Insights
              </h3>
              <InsightsPanel insights={recommendationsData?.insights || []} />
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Study Schedule
              </h3>
              <StudyPlanGenerator
                studyPlan={recommendationsData?.studyPlan}
                onGenerate={handleManualGeneratePlan}
              />
            </section>

            {/* Motivation */}
            <Card className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white border-none shadow-lg">
              <Sparkles className="w-8 h-8 mb-4 text-pink-200" />
              <h3 className="font-bold text-lg mb-2">Architect's Advice 🌟</h3>
              <p className="text-pink-50 text-sm leading-relaxed">
                Consistency is more important than intensity. Even 15 minutes of focused study is better than zero. You've got this!
              </p>
            </Card>

            <Button
              onClick={handleRefresh}
              disabled={isLoading || recsFetching}
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50 text-blue-600 py-6"
            >
              {recsFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Recommendations
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
