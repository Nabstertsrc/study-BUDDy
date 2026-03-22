import React from "react";
import { cn } from "@/lib/utils";

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendUp,
  gradient 
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      gradient || "bg-white border border-slate-200/60"
    )}>
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl",
            gradient ? "bg-white/20" : "bg-slate-100"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              gradient ? "text-white" : "text-slate-600"
            )} />
          </div>
          
          {trend && (
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trendUp 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-red-100 text-red-700"
            )}>
              {trendUp ? "+" : ""}{trend}
            </span>
          )}
        </div>
        
        <h3 className={cn(
          "text-3xl font-bold tracking-tight",
          gradient ? "text-white" : "text-slate-900"
        )}>
          {value}
        </h3>
        
        <p className={cn(
          "text-sm font-medium mt-1",
          gradient ? "text-white/80" : "text-slate-500"
        )}>
          {title}
        </p>
        
        {subtitle && (
          <p className={cn(
            "text-xs mt-2",
            gradient ? "text-white/60" : "text-slate-400"
          )}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}