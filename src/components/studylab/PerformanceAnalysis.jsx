import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Brain,
  BookOpen,
  Clock,
  Zap,
  Lightbulb,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { safeJsonParse } from "@/lib/safeJsonParser";

export default function PerformanceAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => base44.entities.Quiz.list("-created_date"),
  });

  const { data: activities } = useQuery({
    queryKey: ["learning-activities"],
    queryFn: () => base44.entities.LearningActivity.list("-created_date", 100),
  });

  const { data: essays } = useQuery({
    queryKey: ["essays"],
    queryFn: () => base44.entities.Essay.list("-submitted_date"),
  });

  const { data: skillGaps } = useQuery({
    queryKey: ["skill-gaps"],
    queryFn: () => base44.entities.SkillGap.filter({ status: "active" }),
  });

  const { data: assignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list(),
  });

  const { data: studySessions } = useQuery({
    queryKey: ["study-sessions"],
    queryFn: () => base44.entities.StudySession.list("-date"),
  });

  const analyzePerformance = async () => {
    setAnalyzing(true);
    try {
      const quizData = quizzes?.map(q => ({
        title: q.title,
        score: q.score,
        created: q.created_date
      })) || [];

      const activityData = activities?.map(a => ({
        type: a.activity_type,
        topic: a.topic,
        score: a.performance_score,
        time: a.time_spent_minutes
      })) || [];

      const essayData = essays?.map(e => ({
        title: e.title,
        scores: e.ai_feedback ? e.ai_feedback : null
      })) || [];

      const assignmentData = assignments?.filter(a => a.grade && a.max_grade)?.map(a => ({
        title: a.title,
        grade: a.grade,
        max: a.max_grade,
        percentage: (a.grade / a.max_grade) * 100
      })) || [];

      const sessionData = studySessions?.slice(0, 50).map(s => ({
        date: s.date,
        duration: s.duration_minutes,
        module: s.module_id,
        path: s.path
      })) || [];

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You're an expert learning analytics AI. Analyze this student's comprehensive performance data and provide granular insights.

**Quiz Performance:**
${JSON.stringify(quizData, null, 2)}

**Learning Activities:**
${JSON.stringify(activityData, null, 2)}

**Essay Assessments:**
${JSON.stringify(essayData, null, 2)}

**Assignment Grades:**
${JSON.stringify(assignmentData, null, 2)}

**Platform Engagement (Study Sessions):**
${JSON.stringify(sessionData, null, 2)}

Provide deep analysis including:
1. **Overall Performance Trends**: Patterns over time in engagement and scores.
2. **Granular Skill Gaps**: Specific skills needing work based on session paths and scores.
3. **Micro-Learning Modules**: 5-7 targeted 10-minute modules to address gaps.
4. **Strengths to Leverage**: How to build on existing strengths.
5. **Study Efficiency Analysis**: Are they spending time on the right things?
6. **Actionable Next Steps**: Concrete actions prioritized by impact.`,
        systemPrompt: "You are a senior educational data analyst. Be precise, encouraging, and data-driven. Always return valid JSON.",
        response_json_schema: {
          type: "object",
          properties: {
            performance_trend: {
              type: "object",
              properties: {
                direction: { type: "string" },
                summary: { type: "string" }
              }
            },
            skill_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill: { type: "string" },
                  severity: { type: "string" },
                  evidence: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            micro_learning_modules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  focus_area: { type: "string" },
                  duration: { type: "string" },
                  description: { type: "string" },
                  activities: { type: "array", items: { type: "string" } }
                }
              }
            },
            strengths: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  strength: { type: "string" },
                  leverage_strategy: { type: "string" }
                }
              }
            },
            efficiency_insights: {
              type: "object",
              properties: {
                average_study_time: { type: "string" },
                productivity_pattern: { type: "string" },
                optimization_tips: { type: "array", items: { type: "string" } }
              }
            },
            next_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string" },
                  expected_impact: { type: "string" },
                  time_required: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Robust extraction using safeJsonParse
      const parsedResponse = safeJsonParse(response, {
        fallback: response,
        verbose: true
      });

      setAnalysis(parsedResponse);
      toast.success("Intelligence sync complete! Personalized insights loaded.");
    } catch (error) {
      console.error("Error analyzing performance:", error);
      toast.error("Failed to synchronize intelligence data. The data set might be too large or the AI keys are invalid.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    const s = severity?.toLowerCase();
    if (s === "high" || s === "significant") return "bg-red-100 text-red-700";
    if (s === "medium" || s === "moderate") return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">AI Performance Analysis 📊</h3>
        <p className="text-slate-600">
          Sync your local study data with AI to identify gaps and get personalized growth plans.
        </p>
      </div>

      {/* Existing Skill Gaps */}
      {skillGaps && skillGaps.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-slate-900">Actively Tracking Gaps</h4>
          </div>
          <div className="grid gap-3">
            {skillGaps.map((gap) => (
              <div key={gap.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-slate-900">{gap.skill_name}</h5>
                    <p className="text-sm text-slate-600 mt-1">{gap.description}</p>
                  </div>
                  <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!analysis ? (
        <Card className="p-12 text-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            Generate Data-Driven Insights
          </h3>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Analyze your {quizzes?.length || 0} quizzes, {studySessions?.length || 0} study sessions, and {assignments?.length || 0} assignments
            to see exactly where you stand and how to optimize your learning.
          </p>
          <Button
            onClick={analyzePerformance}
            disabled={analyzing}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Data...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Run Full Sync Analysis
              </>
            )}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {typeof analysis === 'string' && (
            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div>
                <h5 className="font-bold text-amber-900 text-lg">Analysis Generation Insight</h5>
                <p className="text-amber-700 font-medium">
                  We've successfully analyzed your data, but the AI provided a narrative summary instead of a structured report.
                  View the full analysis below.
                </p>
                <div className="mt-4 p-6 bg-white rounded-xl border border-amber-100 prose prose-slate max-w-none">
                  {analysis}
                </div>
              </div>
            </div>
          )}

          {typeof analysis === 'object' && analysis !== null && (
            <>
              {/* Performance Trend */}
              <Card className={cn(
                "p-6 border-2",
                analysis.performance_trend?.direction === "improving" ? "bg-green-50 border-green-200" :
                  analysis.performance_trend?.direction === "stable" ? "bg-blue-50 border-blue-200" :
                    "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-slate-700" />
                  <h4 className="font-bold text-lg text-slate-900">Learning Vector</h4>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">{analysis.performance_trend?.summary}</p>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Granular Skill Gaps */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-red-600" />
                    <h4 className="font-bold text-lg text-slate-900">Identified Gaps</h4>
                  </div>
                  <div className="space-y-4">
                    {analysis.skill_gaps?.map((gap, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-semibold text-slate-900">{gap.skill}</h5>
                          <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-1 italic">"{gap.evidence}"</p>
                        <p className="text-sm text-slate-700"><strong>Impact:</strong> {gap.impact}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Strengths to Leverage */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h4 className="font-bold text-lg text-slate-900">Strengths</h4>
                  </div>
                  <div className="space-y-3">
                    {analysis.strengths?.map((item, idx) => (
                      <div key={idx} className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-1">{item.strength}</h5>
                        <p className="text-sm text-green-700">{item.leverage_strategy}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Micro-Learning Modules */}
              <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Brain className="w-32 h-32" />
                </div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <h4 className="font-bold text-xl">Targeted Learning Modules 🎯</h4>
                  </div>
                  <div className="grid gap-4">
                    {analysis.micro_learning_modules?.map((module, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-white">{module.title}</h5>
                          <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                            <Clock className="w-3 h-3 mr-1" />
                            {module.duration}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{module.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {module.activities?.map((activity, aIdx) => (
                            <Badge key={aIdx} variant="outline" className="text-[10px] py-0 border-white/30 text-white/70">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Efficiency & Next Steps */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-blue-600" />
                    <h4 className="font-bold text-lg text-slate-900">Efficiency Insights</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50/50 rounded-lg">
                      <p className="text-sm text-slate-700 mb-1"><strong>Productivity Pattern:</strong></p>
                      <p className="text-sm font-medium text-blue-900">{analysis.efficiency_insights?.productivity_pattern}</p>
                    </div>
                    <ul className="space-y-2">
                      {analysis.efficiency_insights?.optimization_tips?.map((tip, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>

                <Card className="p-6 border-indigo-200 bg-indigo-50/20">
                  <div className="flex items-center gap-3 mb-6">
                    <ArrowRight className="w-6 h-6 text-indigo-600" />
                    <h4 className="font-bold text-lg text-slate-900">Priority Roadmap 🚀</h4>
                  </div>
                  <div className="space-y-3">
                    {analysis.next_steps?.map((step, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-white border border-indigo-100 rounded-xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-bold text-slate-900">{step.action}</h5>
                            <Badge className={step.priority?.toLowerCase() === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'} variant="outline">
                              {step.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">{step.expected_impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <Button
                onClick={() => setAnalysis(null)}
                variant="outline"
                className="w-full h-12 border-2 border-slate-200 rounded-xl"
              >
                Reset Analysis View
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Helper icons missing imported
function ArrowRight({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  );
}