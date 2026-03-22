import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Brain,
  FileText,
  Upload,
  Sparkles,
  ChevronRight,
  Lock,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { localApi } from "@/api/localApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const actions = [
  {
    title: "Generate Quiz",
    description: "Create active recall questions",
    icon: Brain,
    page: "StudyLab",
    params: "?tab=quiz",
    gradient: "from-violet-500 to-purple-600",
    isAi: true
  },
  {
    title: "Summarize Notes",
    description: "AI-powered summaries",
    icon: FileText,
    page: "StudyLab",
    params: "?tab=notes",
    gradient: "from-blue-500 to-cyan-500",
    isAi: true
  },
  {
    title: "Deep Dive",
    description: "Feynman technique explanations",
    icon: Sparkles,
    page: "StudyLab",
    params: "?tab=deepdive",
    gradient: "from-emerald-500 to-teal-600",
    isAi: true
  },
  {
    title: "Upload Material",
    description: "Add PDFs or notes",
    icon: Upload,
    page: "StudyLab",
    params: "?tab=materials",
    gradient: "from-orange-500 to-red-500",
  },
];

export default function QuickActions() {
  const [balance, setBalance] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    localApi.wallet.getBalance().then(setBalance);
    const interval = setInterval(() => {
      localApi.wallet.getBalance().then(setBalance);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (value) => {
    const action = actions.find(a => a.title === value);
    if (!action) return;

    const isLocked = action.isAi && balance < 1;
    if (isLocked) {
      navigate(createPageUrl("Payment"));
    } else {
      navigate(createPageUrl(action.page) + action.params);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile Dropdown */}
      <div className="block lg:hidden">
        <Select onValueChange={handleAction}>
          <SelectTrigger className="w-full h-14 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700">
            <div className="flex items-center gap-2 text-slate-900">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <SelectValue placeholder="Quick Access Tools..." />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-200">
            {actions.map((action, index) => (
              <SelectItem key={index} value={action.title} className="py-3 font-medium">
                <div className="flex items-center gap-3">
                  <div className={cn("p-1.5 rounded-lg bg-gradient-to-br text-white", action.gradient)}>
                    <action.icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{action.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Horizontal Slider */}
      <div className="flex flex-nowrap gap-6 overflow-x-auto pb-8 pt-2 -mx-2 px-2 pencil-scroll scroll-smooth lg:flex hidden">
        {actions.map((action, index) => {
          const isLocked = action.isAi && balance < 1;

          return (
            <Link
              key={index}
              to={isLocked ? createPageUrl("Payment") : createPageUrl(action.page) + action.params}
              className={cn(
                "group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border min-w-[340px] flex-shrink-0",
                isLocked
                  ? "bg-slate-50/80 border-slate-200 grayscale-[0.8]"
                  : "bg-white border-slate-100 hover:border-blue-400 shadow-xl shadow-slate-200/20"
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                action.gradient
              )} />

              {/* Internal Horizontal Layout */}
              <div className="relative flex items-center gap-5">
                <div className={cn(
                  "w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transform transition-transform group-hover:rotate-6 flex-shrink-0",
                  isLocked ? "from-slate-400 to-slate-500" : action.gradient
                )}>
                  {isLocked ? (
                    <Lock className="w-8 h-8 text-white" />
                  ) : (
                    <action.icon className="w-8 h-8 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-black text-slate-900 text-lg tracking-tight truncate">{action.title}</h4>
                    {isLocked && (
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded-full uppercase tracking-tighter">Locked</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-tight">
                    {isLocked ? "Upgrade to unlock AI features" : action.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className={cn("w-3 h-3 fill-current", isLocked ? "text-slate-300" : "text-amber-500")} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">1 Credit</span>
                    </div>
                    {!isLocked && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
