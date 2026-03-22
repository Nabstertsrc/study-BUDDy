import React from "react";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const priorityStyles = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function UpcomingDeadlines({ assignments, modules }) {
  const getModuleName = (moduleId) => {
    const module = modules?.find(m => m.id === moduleId);
    return module?.code || "Unknown";
  };

  const getTimeLabel = (date) => {
    const d = new Date(date);
    if (isPast(d)) return { text: "Overdue", urgent: true };
    if (isToday(d)) return { text: "Due today", urgent: true };
    if (isTomorrow(d)) return { text: "Due tomorrow", urgent: false };
    return { text: formatDistanceToNow(d, { addSuffix: true }), urgent: false };
  };

  const sortedAssignments = [...(assignments || [])]
    .filter(a => a.status !== "submitted" && a.status !== "graded" && !isPast(new Date(a.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">Upcoming Deadlines</h3>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{sortedAssignments.length} pending</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {sortedAssignments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-black text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="flex flex-nowrap gap-4 overflow-x-auto pencil-scroll scroll-smooth">
            {sortedAssignments.map((assignment) => {
              const timeLabel = getTimeLabel(assignment.due_date);
              return (
                <div
                  key={assignment.id}
                  className="min-w-[280px] p-5 bg-slate-50/50 hover:bg-white rounded-3xl border border-slate-100 hover:border-red-200 transition-all hover:shadow-lg flex-shrink-0 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5",
                        timeLabel.urgent
                          ? "bg-red-500 text-white border-none shadow-lg shadow-red-500/20"
                          : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      {timeLabel.text}
                    </Badge>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      timeLabel.urgent ? "bg-red-500 animate-pulse" : "bg-blue-500"
                    )} />
                  </div>

                  <div className="space-y-1">
                    <p className="font-black text-slate-900 truncate">
                      {assignment.title}
                    </p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      {getModuleName(assignment.module_id)}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">
                        {format(new Date(assignment.due_date), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <AlertCircle className="w-4 h-4 text-slate-200 group-hover:text-red-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}