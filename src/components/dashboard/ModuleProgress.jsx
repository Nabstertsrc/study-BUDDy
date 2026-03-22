import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, ChevronRight, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const colorVariants = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
};

export default function ModuleProgress({ modules }) {
  const colors = Object.values(colorVariants);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Module Progress</h3>
            <p className="text-xs text-slate-500">{modules?.length || 0} enrolled</p>
          </div>
        </div>
        <Link 
          to={createPageUrl("Modules")}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {(!modules || modules.length === 0) ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">No modules yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first module to track progress</p>
          </div>
        ) : (
          modules.slice(0, 4).map((module, index) => (
            <div 
              key={module.id} 
              className="p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm",
                  module.color || colors[index % colors.length]
                )}>
                  {module.code?.slice(0, 2) || "M"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{module.title}</p>
                  <p className="text-xs text-slate-500">{module.code}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {module.progress || 0}%
                </span>
              </div>
              <Progress 
                value={module.progress || 0} 
                className="h-1.5"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}