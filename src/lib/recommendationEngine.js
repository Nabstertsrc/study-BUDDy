import { base44 } from '@/api/base44Client';
import {
    getUserActivitySummary,
    getModuleEngagement,
    getPerformanceTrends,
    getWeakTopics,
    getDeepDiveTopics
} from './db';

/**
 * Intelligent Recommendation Engine
 * Analyzes user activity and generates personalized recommendations
 */

/**
 * Generate comprehensive recommendations based on user activity
 * @param {Array} modules - User's enrolled modules
 * @param {Array} assignments - All assignments
 * @param {Array} materials - Available study materials
 * @returns {Promise<Object>} Recommendations object
 */
export async function generateRecommendations(modules = [], assignments = [], materials = []) {
    try {
        // Gather all activity data
        const activitySummary = await getUserActivitySummary();
        const moduleEngagement = await getModuleEngagement();
        const performanceTrends = await getPerformanceTrends();
        const weakTopics = await getWeakTopics();
        const deepDiveTopics = await getDeepDiveTopics();

        // Generate insights
        const insights = await generateInsights(activitySummary, moduleEngagement, performanceTrends, weakTopics, modules);

        // Generate complex topics that need tutorials
        const complexTopics = identifyComplexTopics(weakTopics, deepDiveTopics, modules);

        // Generate recommended materials
        const recommendedMaterials = selectRecommendedMaterials(materials, weakTopics, moduleEngagement);

        // Generate weekly study plan
        const studyPlan = await generateWeeklyPlan(assignments, moduleEngagement, weakTopics, modules);

        // Generate action plan
        const actionPlan = generateActionPlan(insights, weakTopics, assignments);

        // Mock external resources (could be an LLM call or API search)
        const externalResources = weakTopics.length > 0 ? [
            {
                title: `${weakTopics[0].topic} Mastery - Khan Academy`,
                url: "https://www.khanacademy.org",
                type: "video",
                description: "Master the fundamentals of this topic with step-by-step videos."
            },
            {
                title: `Advanced ${weakTopics[0].topic} Guide`,
                url: "https://en.wikipedia.org",
                type: "article",
                description: "Deep dive into the theory and complex applications."
            }
        ] : [];

        return {
            insights,
            complexTopics,
            recommendedMaterials,
            externalResources,
            studyPlan,
            actionPlan,
            activitySummary,
            performanceTrends
        };
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return {
            insights: [],
            complexTopics: [],
            recommendedMaterials: [],
            studyPlan: null,
            actionPlan: [],
            error: error.message
        };
    }
}

/**
 * Generate prioritized insights
 * @returns {Promise<Array>} Array of insight objects with priority levels
 */
async function generateInsights(activitySummary, moduleEngagement, performanceTrends, weakTopics, modules = []) {
    const insights = [];

    // Insight 1: Deep Dive Performance
    const deepDiveActivities = activitySummary.activities.filter(a => a.activity_type === 'deep_dive');
    if (deepDiveActivities.length > 0) {
        const avgScore = deepDiveActivities.reduce((sum, a) => sum + (a.performance_score || 0), 0) / deepDiveActivities.length;

        insights.push({
            title: 'Deep Dive Topics',
            description: avgScore >= 70
                ? `Your performance of ${Math.round(avgScore)} on deep dive topics indicates you engage well with complex issues. Keep up the analytical thinking!`
                : `Your average score of ${Math.round(avgScore)} on deep dive questions suggests more practice with critical analysis could help.`,
            priority: avgScore >= 70 ? 'low' : 'medium',
            type: 'performance',
            icon: 'brain'
        });
    }

    // Insight 2: Initial Attempts
    if (activitySummary.totalQuizzes > 0 || activitySummary.totalActivities > 0) {
        insights.push({
            title: 'Initial Attempts',
            description: `You've attempted ${activitySummary.totalQuizzes} quizzes and ${activitySummary.totalActivities} learning activities, which is a fantastic first step in your learning process!`,
            priority: 'low',
            type: 'encouragement',
            icon: 'checkCircle'
        });
    }

    // Insight 3: Module Progress
    const activeModules = moduleEngagement.filter(m => m.totalMinutes > 0);
    if (modules.length > 0 && activeModules.length === 0) {
        insights.push({
            title: 'Module Progress',
            description: 'All modules show minimal progress, indicating you might need a more structured approach to engage with them regularly.',
            priority: 'high',
            type: 'warning',
            icon: 'alertCircle'
        });
    } else if (activeModules.length < modules.length * 0.5) {
        insights.push({
            title: 'Module Progress',
            description: `You're actively working on ${activeModules.length} of ${modules.length} modules. Consider dedicating time to neglected modules to maintain balanced progress.`,
            priority: 'medium',
            type: 'suggestion',
            icon: 'bookOpen'
        });
    }

    // Insight 4: Unanswered Deep Dive Questions
    const incompleteDives = deepDiveActivities.filter(a => !a.completed || a.performance_score === null);
    if (incompleteDives.length > 0) {
        insights.push({
            title: 'Answering Deep Dive Questions',
            description: `You have ${incompleteDives.length} deep dive topic${incompleteDives.length > 1 ? 's' : ''} with no performance data. Actively engaging with these can improve your critical analysis skills.`,
            priority: 'medium',
            type: 'action',
            icon: 'target'
        });
    }

    // Insight 5: Performance Trend
    if (performanceTrends.trend === 'improving') {
        insights.push({
            title: 'Performance Trend',
            description: `Your scores are improving! Average increased from ${Math.round(performanceTrends.firstHalfAvg)} to ${Math.round(performanceTrends.secondHalfAvg)}. Your study methods are working!`,
            priority: 'low',
            type: 'success',
            icon: 'trendingUp'
        });
    } else if (performanceTrends.trend === 'declining') {
        insights.push({
            title: 'Performance Trend',
            description: `Scores have dipped from ${Math.round(performanceTrends.firstHalfAvg)} to ${Math.round(performanceTrends.secondHalfAvg)}. Consider reviewing weak topics and adjusting study techniques.`,
            priority: 'high',
            type: 'warning',
            icon: 'alertTriangle'
        });
    }

    return insights.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Identify complex topics that need AI tutorials
 */
function identifyComplexTopics(weakTopics, deepDiveTopics, modules) {
    const complex = [];
    const seen = new Set();

    // From weak topics
    weakTopics.slice(0, 3).forEach(weak => {
        if (!seen.has(weak.topic)) {
            const module = modules?.find(m => m.id === weak.moduleId);
            complex.push({
                topic: weak.topic,
                reason: `You scored ${weak.score}% on this topic. An AI-generated tutorial can help clarify key concepts.`,
                moduleCode: module?.code || null
            });
            seen.add(weak.topic);
        }
    });

    return complex.slice(0, 5); // Max 5 complex topics
}

/**
 * Select recommended study materials
 */
function selectRecommendedMaterials(materials, weakTopics, moduleEngagement) {
    const recommended = [];

    // Materials related to weak topics
    weakTopics.forEach(weak => {
        const relatedMaterials = materials.filter(m =>
            m.module_id === weak.moduleId ||
            m.title.toLowerCase().includes(weak.topic.toLowerCase())
        );

        relatedMaterials.slice(0, 2).forEach(material => {
            recommended.push({
                title: material.title,
                type: material.type === 'pdf' ? 'module material' : material.type,
                reason: `Helps with ${weak.topic} where you scored ${weak.score}%`,
                moduleId: material.module_id,
                materialId: material.id
            });
        });
    });

    return recommended.slice(0, 6); // Max 6 recommendations
}

/**
 * Generate weekly study plan using AI
 */
export async function generateWeeklyPlan(assignments, moduleEngagement, weakTopics, modules, forceNew = false) {
    try {
        // Check for cached plan first - We use localStorage for the "active" study plan to keep it fast
        const cachedPlan = localStorage.getItem('last_study_plan');
        const lastGenTime = localStorage.getItem('last_study_plan_time');
        const now = Date.now();

        // If not forcing a new one and we have a cached plan less than 24 hours old, reuse it
        if (!forceNew && cachedPlan && lastGenTime && (now - parseInt(lastGenTime) < 86400000)) {
            return JSON.parse(cachedPlan);
        }

        // If not forcing, don't auto-generate (Save Credits)
        if (!forceNew) {
            return {
                weeklyHours: "Pending",
                schedule: "Click 'Generate AI Plan' to create your personalized weekly schedule. (Costs 1 Credit)",
                isPlaceholder: true
            };
        }

        const upcomingAssignments = assignments
            .filter(a => a.status !== 'submitted' && a.status !== 'graded' && new Date(a.due_date).getTime() > new Date().getTime())
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Create a weekly study plan (Monday-Sunday) for a student with:

**Upcoming Assignments:**
${JSON.stringify(upcomingAssignments.map(a => ({ title: a.title, dueDate: a.due_date, module: modules?.find(m => m.id === a.module_id)?.code })), null, 2)}

**Weak Topics (need more focus):**
${JSON.stringify(weakTopics.slice(0, 5).map(w => ({ topic: w.topic, score: w.score })), null, 2)}

**Module Engagement:**
${JSON.stringify(moduleEngagement.map(m => ({ module: modules?.find(mod => mod.id === m.moduleId)?.code, hours: Math.round(m.totalMinutes / 60) })), null, 2)}

Generate a realistic, balanced weekly schedule with specific hour allocations for each day. Include:
- Assignment work (prioritize by deadline)
- Review of weak topics
- Regular module study time
- At least one rest day
- Total recommended hours per week

Format as a readable paragraph describing each day's focus.`,
            systemPrompt: "You are an academic advisor creating personalized study schedules.",
            response_json_schema: {
                type: "object",
                properties: {
                    weeklyHours: { type: "string" },
                    schedule: { type: "string" }
                }
            }
        });

        // Save to cache
        localStorage.setItem('last_study_plan', JSON.stringify(response));
        localStorage.setItem('last_study_plan_time', now.toString());

        return response;
    } catch (error) {
        console.error('Error generating study plan:', error);
        return {
            weeklyHours: "10 hours",
            schedule: "Unable to generate plan. Ensure you have credits and try again."
        };
    }
}

/**
 * Generate prioritized action plan
 */
function generateActionPlan(insights, weakTopics, assignments) {
    const actions = [];

    // High priority: Upcoming assignments
    const urgentAssignments = assignments.filter(a => {
        const daysUntil = (new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 7 && a.status !== 'submitted';
    });

    urgentAssignments.forEach(assignment => {
        actions.push({
            action: `Complete ${assignment.title}`,
            priority: 'high',
            expectedImpact: `Avoid missing deadline on ${new Date(assignment.due_date).toLocaleDateString()}`,
            timeRequired: '2-4 hours'
        });
    });

    // Medium priority: Weak topics
    weakTopics.slice(0, 2).forEach(weak => {
        actions.push({
            action: `Review ${weak.topic}`,
            priority: 'medium',
            expectedImpact: `Improve from ${weak.score}% to 80%+ through focused practice`,
            timeRequired: '1-2 hours'
        });
    });

    // From high-priority insights
    insights.filter(i => i.priority === 'high').forEach(insight => {
        actions.push({
            action: insight.title,
            priority: 'high',
            expectedImpact: insight.description,
            timeRequired: '30 mins - 1 hour'
        });
    });

    return actions.slice(0, 6); // Max 6 actions
}


