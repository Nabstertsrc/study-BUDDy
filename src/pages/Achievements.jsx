import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Star, 
  Zap,
  Crown,
  Target,
  Flame,
  Award,
  TrendingUp,
  Medal,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const badgeIcons = {
  first_quiz: Trophy,
  quiz_master: Crown,
  speed_learner: Zap,
  deep_thinker: Target,
  note_taker: Star,
  streak_keeper: Flame,
  perfect_score: Medal,
  early_bird: Sparkles,
  night_owl: Sparkles,
  module_master: Award
};

const availableBadges = [
  { type: "first_quiz", title: "First Steps", description: "Complete your first quiz", points: 10, color: "from-blue-500 to-cyan-500" },
  { type: "quiz_master", title: "Quiz Master", description: "Complete 10 quizzes", points: 50, color: "from-purple-500 to-pink-500" },
  { type: "speed_learner", title: "Speed Learner", description: "Complete 3 activities in one day", points: 30, color: "from-yellow-500 to-orange-500" },
  { type: "deep_thinker", title: "Deep Thinker", description: "Use Deep Dive 5 times", points: 40, color: "from-emerald-500 to-teal-500" },
  { type: "note_taker", title: "Note Taker", description: "Summarize 5 materials", points: 35, color: "from-indigo-500 to-blue-500" },
  { type: "perfect_score", title: "Perfect Score", description: "Score 100% on a quiz", points: 100, color: "from-amber-500 to-yellow-500" },
  { type: "streak_keeper", title: "Streak Keeper", description: "Study 5 days in a row", points: 75, color: "from-red-500 to-orange-500" },
  { type: "module_master", title: "Module Master", description: "Complete a module 100%", points: 150, color: "from-violet-500 to-purple-500" }
];

export default function Achievements() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [userRank, setUserRank] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => base44.entities.Achievement.list("-earned_date"),
  });

  const { data: activities } = useQuery({
    queryKey: ["learning-activities"],
    queryFn: () => base44.entities.LearningActivity.list("-created_date"),
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      const userPoints = await Promise.all(
        users.map(async (u) => {
          const userAchievements = await base44.entities.Achievement.filter({ created_by: u.email });
          const points = userAchievements.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
          return { ...u, total_points: points };
        })
      );
      return userPoints.sort((a, b) => b.total_points - a.total_points);
    },
  });

  useEffect(() => {
    if (achievements) {
      const points = achievements.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
      setTotalPoints(points);
    }
  }, [achievements]);

  useEffect(() => {
    if (allUsers && user) {
      const rank = allUsers.findIndex(u => u.email === user.email) + 1;
      setUserRank(rank);
    }
  }, [allUsers, user]);

  const earnedBadgeTypes = achievements?.map(a => a.badge_type) || [];
  const earnedBadges = availableBadges.filter(b => earnedBadgeTypes.includes(b.type));
  const lockedBadges = availableBadges.filter(b => !earnedBadgeTypes.includes(b.type));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <Trophy className="w-4 h-4" />
          <span className="text-sm font-medium">Gamification</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Achievements & Leaderboard</h1>
        <p className="text-slate-500 mt-1">Track your progress and compete with others</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-amber-100">Total Points</p>
                <p className="text-3xl font-black">{totalPoints}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-purple-100">Badges Earned</p>
                <p className="text-3xl font-black">{earnedBadges.length}/{availableBadges.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-blue-100">Your Rank</p>
                <p className="text-3xl font-black">#{userRank || "-"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6">
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">🎉 Earned Badges</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedBadges.map((badge) => {
                  const Icon = badgeIcons[badge.type];
                  return (
                    <Card key={badge.type} className="p-6 relative overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white">+{badge.points} pts</Badge>
                      </div>
                      <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg", badge.color)}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{badge.title}</h4>
                      <p className="text-sm text-slate-600">{badge.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">🔒 Locked Badges</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedBadges.map((badge) => {
                  const Icon = badgeIcons[badge.type];
                  return (
                    <Card key={badge.type} className="p-6 relative overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline">{badge.points} pts</Badge>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
                        <Icon className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{badge.title}</h4>
                      <p className="text-sm text-slate-600">{badge.description}</p>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Top Students
            </h3>
            <div className="space-y-3">
              {allUsers?.slice(0, 10).map((u, idx) => (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all",
                    u.email === user?.email ? "bg-blue-50 border-2 border-blue-300" : "bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                    idx === 0 && "bg-gradient-to-br from-amber-400 to-yellow-500 text-white",
                    idx === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white",
                    idx === 2 && "bg-gradient-to-br from-orange-400 to-amber-600 text-white",
                    idx > 2 && "bg-slate-200 text-slate-600"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{u.full_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{u.total_points}</p>
                    <p className="text-xs text-slate-500">points</p>
                  </div>
                  {idx < 3 && (
                    <Crown className={cn(
                      "w-6 h-6",
                      idx === 0 && "text-amber-500",
                      idx === 1 && "text-slate-400",
                      idx === 2 && "text-orange-500"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}