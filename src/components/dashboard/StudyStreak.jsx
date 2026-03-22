import React from "react";
import { Flame, Trophy, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudyStreak({ sessions }) {
  // Calculate streak from sessions
  const calculateStreak = () => {
    if (!sessions || sessions.length === 0) return 0;
    
    const sortedDates = [...new Set(
      sessions.map(s => s.date)
    )].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const sessionDate = new Date(sortedDates[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();
  const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;
  const totalHours = Math.round(totalMinutes / 60);

  const achievements = [
    { icon: Flame, label: "Day Streak", value: streak, color: "text-orange-500", bg: "bg-orange-50" },
    { icon: Trophy, label: "Total Hours", value: totalHours, color: "text-amber-500", bg: "bg-amber-50" },
    { icon: Target, label: "Sessions", value: sessions?.length || 0, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-orange-500/20">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Study Streak</h3>
          <p className="text-sm text-slate-400">Keep the momentum going!</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {achievements.map((item, index) => (
          <div key={index} className="text-center">
            <div className={cn(
              "w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center",
              item.bg.replace("bg-", "bg-opacity-20 bg-")
            )}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {streak >= 7 && (
        <div className="mt-6 pt-5 border-t border-slate-700">
          <div className="flex items-center gap-2 text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">Awesome! You're on fire! 🔥</span>
          </div>
        </div>
      )}
    </div>
  );
}