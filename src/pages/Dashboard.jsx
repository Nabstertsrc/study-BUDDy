import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardList,
  Brain,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  Trash2,
  Zap,
} from "lucide-react";
import { isPast } from "date-fns";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import ModuleProgress from "@/components/dashboard/ModuleProgress";
import StudyStreak from "@/components/dashboard/StudyStreak";
import QuickActions from "@/components/dashboard/QuickActions";
import AIAutoOrganizer from "@/components/dashboard/AIAutoOrganizer";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { getAIStatus } from "@/lib/ai";
import { db } from "@/lib/db";
import { generateRecommendations } from "@/lib/recommendationEngine";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/NotificationContext";
import OnboardingModal from "@/components/OnboardingModal";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [aiStatus, setAiStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { checkForNotifications } = useNotifications();

  const namingPref = localStorage.getItem('naming_pref') || 'Modules';
  const singleTerm = namingPref === 'Subjects' ? 'Subject' : 'Module';

  useEffect(() => {
    getAIStatus().then(setAiStatus);

    // Check if onboarding is needed
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding_v2');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["modules"],
    // @ts-ignore
    queryFn: async () => {
      const list = await base44.entities.Module.list();
      return list.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
    },
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["assignments"],
    // @ts-ignore
    queryFn: () => base44.entities.Assignment.list("due_date"), // Ascending by date
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    // @ts-ignore
    queryFn: () => base44.entities.StudyMaterial.list(),
  });

  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ["recommendations", modules?.length, assignments?.length],
    queryFn: () => generateRecommendations(modules || [], assignments || [], materials || []),
    enabled: !!modules,
  });

  // Check for notifications when assignments change
  useEffect(() => {
    if (assignments && assignments.length > 0) {
      checkForNotifications(assignments);
    }
  }, [assignments, checkForNotifications]);

  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ["quizzes"],
    // @ts-ignore
    queryFn: () => base44.entities.Quiz.list(),
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    // @ts-ignore
    queryFn: () => base44.entities.StudySession.list(),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    await getAIStatus().then(setAiStatus);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to DELETE ALL DATA? This cannot be undone.")) {
      await db.delete();
      window.location.reload();
    }
  };

  const isLoading = modulesLoading || assignmentsLoading || quizzesLoading || sessionsLoading;

  const pendingAssignments = assignments?.filter(
    a => a.status !== "submitted" && a.status !== "graded" && !isPast(new Date(a.due_date))
  ).length || 0;

  const totalStudyMinutes = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;
  const studyHours = Math.round(totalStudyMinutes / 60);

  const avgQuizScore = quizzes?.length
    ? Math.round(quizzes.reduce((acc, q) => acc + (q.best_score || 0), 0) / quizzes.length)
    : 0;

  const isAIOnline = aiStatus && Object.values(aiStatus).some(Boolean);

  const sortedInsights = recs?.insights
    ? [...recs.insights].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    : [];

  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Learning</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Study Buddy Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Track your progress and access AI study tools
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`gap-2 border-slate-200 ${isAIOnline ? 'text-green-600 bg-green-50' : 'text-slate-500'}`}>
                <Zap className="w-4 h-4 fill-current" />
                {isAIOnline ? "AI Online" : "AI Offline"}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            {/* @ts-ignore */}
            <DropdownMenuContent align="end" className="w-64">
              {/* @ts-ignore */}
              <DropdownMenuLabel>Active AI Models</DropdownMenuLabel>
              {/* @ts-ignore */}
              <DropdownMenuSeparator />
              {aiStatus?.details && Object.entries(aiStatus.details).map(([provider, info]) => (
                /* @ts-ignore */
                <DropdownMenuItem key={provider} className="flex justify-between cursor-default py-2">
                  <div className="flex flex-col">
                    <span className="capitalize font-medium text-sm">{provider}</span>
                    <span className="text-xs text-slate-500">
                      {info.status ? info.model : (info.error ? "Connection Failed" : "Key Missing")}
                    </span>
                  </div>
                  {info.status ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className={isRefreshing ? "animate-spin" : ""}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Hard Reset Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearData}
            title="Delete All Data"
            className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))
        ) : (
          <>
            <StatsCard
              title={`Enrolled ${namingPref}`}
              value={modules?.length || 0}
              icon={BookOpen}
              gradient={null}
              className="dark-motion-card text-white hover:animate-dark-glow transition-all"
              subtitle="Active courses"
              trend={null}
              trendUp={false}
            />
            <StatsCard
              title="Pending Tasks"
              value={pendingAssignments}
              icon={ClipboardList}
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              subtitle="Due soon"
              trend={null}
              trendUp={false}
            />
            <StatsCard
              title="Quizzes Completed"
              value={quizzes?.length || 0}
              icon={Brain}
              trend={avgQuizScore > 0 ? `${avgQuizScore}% avg` : null}
              trendUp={avgQuizScore >= 70}
              subtitle="Active recall practice"
              gradient={null}
            />
            <StatsCard
              title="Study Hours"
              value={studyHours}
              icon={Clock}
              trend="+12%"
              trendUp={true}
              subtitle="This semester"
              gradient={null}
            />
          </>
        )}
      </div>

      {/* Full Width Section: Deadlines */}
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <UpcomingDeadlines
          assignments={assignments}
          modules={modules}
        />
      </div>

      {/* Full Width Section: AI Study Tools (The Slider) */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 tracking-tight">AI Study Tools</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Slide to explore</p>
            </div>
          </div>
        </div>
        <QuickActions />
      </div>

      {/* Bottom Sections: Wide Grids */}
      <div className="space-y-12 pb-12">
        {/* Progress Tracker (Full Width) */}
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="p-2 rounded-xl bg-slate-900 shadow-xl shadow-indigo-900/10">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 tracking-tight">{singleTerm} Progress</h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Academic Tracking</p>
            </div>
          </div>
          <ModuleProgress modules={modules} />
        </div>

        {/* Secondary Insights Grid (Horizontal Row) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          {/* Auto Organizer Card */}
          <div className="xl:col-span-1">
            <AIAutoOrganizer />
          </div>

          {/* Streak & Insights */}
          <div className="xl:col-span-1">
            <StudyStreak sessions={sessions} />
          </div>

          <div className="xl:col-span-1">
            {recs?.insights && recs.insights.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="p-2 rounded-xl bg-amber-50">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 tracking-tight">AI Insights</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Smart Recommendations</p>
                  </div>
                </div>
                <InsightsPanel insights={sortedInsights.slice(0, 3)} />
              </div>
            ) : (
              <div className="h-full min-h-[200px] bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-center flex-col items-center justify-center p-8 text-center">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Insights Yet</p>
                <p className="text-slate-400 text-[10px] mt-1">Study more to unlock AI tips</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}