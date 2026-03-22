import React from 'react';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StudyPlanGenerator Component
 * Displays AI-generated weekly study plan
 * Matches the design from user's screenshots
 */
export default function StudyPlanGenerator({ studyPlan, onGenerate }) {
    const isPlaceholder = studyPlan?.isPlaceholder;

    if (!studyPlan || !studyPlan.schedule) {
        return (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100">
                <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">
                        Generate a learning path to get your personalized weekly study plan!
                    </p>
                    {onGenerate && (
                        <button
                            onClick={() => onGenerate(true)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                        >
                            Generate Now
                        </button>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card className={cn(
            "p-6 bg-gradient-to-br border-2 shadow-xl transition-all duration-500",
            isPlaceholder
                ? "from-slate-50 to-slate-100 border-slate-200 opacity-90"
                : "from-purple-50 to-indigo-50 border-purple-200 shadow-purple-500/10"
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                        isPlaceholder ? "bg-slate-400" : "bg-gradient-to-br from-purple-500 to-indigo-600"
                    )}>
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                            Weekly Study Plan 📅
                        </h3>
                        <p className="text-sm text-purple-700 flex items-center gap-1 mt-1 font-bold">
                            <Clock className="w-4 h-4" />
                            {isPlaceholder ? "Planning Required" : `Recommended: ${studyPlan.weeklyHours || '10 hours'}`}
                        </p>
                    </div>
                </div>
                {onGenerate && (
                    <button
                        onClick={() => onGenerate(true)}
                        className={cn(
                            "px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                            isPlaceholder
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 animate-pulse"
                                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        )}
                    >
                        {isPlaceholder ? "Generate AI Plan (1 Credit)" : "Refresh Plan"}
                    </button>
                )}
            </div>

            <div className={cn(
                "rounded-2xl p-6 border-2 transition-all",
                isPlaceholder ? "bg-slate-50/50 border-dashed border-slate-300" : "bg-white border-purple-200 shadow-inner"
            )}>
                <div className="prose prose-sm max-w-none">
                    <p className={cn(
                        "leading-relaxed whitespace-pre-line font-medium",
                        isPlaceholder ? "text-slate-500 italic" : "text-slate-700"
                    )}>
                        {studyPlan.schedule}
                    </p>
                </div>
            </div>

            {!isPlaceholder && (
                <div className="mt-6 grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <div
                            key={day}
                            className={cn(
                                'text-center p-2 rounded-lg text-[10px] font-black uppercase tracking-tighter',
                                index === 6
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
