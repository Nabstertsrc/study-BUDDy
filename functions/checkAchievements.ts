import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's achievements and activities
    const achievements = await base44.entities.Achievement.filter({ created_by: user.email });
    const activities = await base44.entities.LearningActivity.filter({ created_by: user.email });
    const quizzes = await base44.entities.Quiz.filter({ created_by: user.email });
    
    const earnedBadges = achievements.map(a => a.badge_type);
    const newBadges = [];

    // Check for new achievements
    const checks = {
      first_quiz: () => quizzes.length >= 1 && !earnedBadges.includes('first_quiz'),
      quiz_master: () => quizzes.length >= 10 && !earnedBadges.includes('quiz_master'),
      perfect_score: () => quizzes.some(q => q.best_score === 100) && !earnedBadges.includes('perfect_score'),
      deep_thinker: () => activities.filter(a => a.activity_type === 'deep_dive').length >= 5 && !earnedBadges.includes('deep_thinker'),
      note_taker: () => activities.filter(a => a.activity_type === 'summary').length >= 5 && !earnedBadges.includes('note_taker'),
      speed_learner: () => {
        if (earnedBadges.includes('speed_learner')) return false;
        const today = new Date().toDateString();
        const todayActivities = activities.filter(a => 
          new Date(a.created_date).toDateString() === today
        );
        return todayActivities.length >= 3;
      }
    };

    const badgeData = {
      first_quiz: { title: "First Steps", description: "Completed first quiz", points: 10, icon: "Trophy" },
      quiz_master: { title: "Quiz Master", description: "Completed 10 quizzes", points: 50, icon: "Crown" },
      perfect_score: { title: "Perfect Score", description: "Scored 100% on a quiz", points: 100, icon: "Medal" },
      deep_thinker: { title: "Deep Thinker", description: "Used Deep Dive 5 times", points: 40, icon: "Target" },
      note_taker: { title: "Note Taker", description: "Summarized 5 materials", points: 35, icon: "Star" },
      speed_learner: { title: "Speed Learner", description: "3 activities in one day", points: 30, icon: "Zap" }
    };

    for (const [badge, checkFn] of Object.entries(checks)) {
      if (checkFn()) {
        const data = badgeData[badge];
        const newAchievement = await base44.entities.Achievement.create({
          badge_type: badge,
          title: data.title,
          description: data.description,
          points_awarded: data.points,
          icon: data.icon,
          earned_date: new Date().toISOString()
        });
        newBadges.push(newAchievement);
      }
    }

    return Response.json({ 
      success: true, 
      newBadges,
      message: newBadges.length > 0 ? `🎉 Earned ${newBadges.length} new badge(s)!` : 'No new badges'
    });

  } catch (error) {
    console.error('Achievement check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});