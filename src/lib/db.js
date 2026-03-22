import Dexie from 'dexie';

// VERSION 6: Fresh start for the new app name
export const db = new Dexie('StudyBuddy_Final_v6');
console.log("APP_BOOT_VERSION: v3.6_FORCED_CLEAN_BOOT");

if (window.location.href.includes('Music')) {
    console.warn("⚠️ SECURITY WARNING: App is running from the 'Music' folder. Windows Controlled Folder Access might block the database. If it fails, move the app to C:\\StudyBuddy");
}

db.version(2).stores({
    modules: '++id, code, title, instructor, credits, semester, progress',
    assignments: '++id, title, module_id, description, due_date, status, priority, weight, grade, max_grade, submission_url',
    materials: '++id, title, module_id, type, content, is_processed, created_date',
    quizzes: '++id, material_id, module_id, questions, score, created_date',
    notes: '++id, material_id, module_id, content, type, created_date',
    studySessions: '++id, date, duration_minutes, module_id, path, user_id',
    settings: 'id, key, value',
    learningActivities: '++id, activity_type, topic, module_id, performance_score, time_spent_minutes, created_date',
    skillGaps: '++id, skill_name, severity, status, module_id',
    essays: '++id, title, module_id, submitted_date',
    learningGoals: '++id, goal, goal_type, status',
    notifications: '++id, type, title, message, read, dismissed, priority, created_date, entity_type, entity_id',
    notificationSettings: 'id, user_id, deadlines_enabled, materials_enabled, achievements_enabled, intervals, desktop_enabled',
    prescribedBooks: '++id, title, author, module_id, source_document',
    transactions: '++id, amount, currency, status, type, date, credits_added'
});

// Guard state to prevent infinite loops
let openPromise = null;
let isSafeModeActive = false;

/**
 * Renders a full-screen failure UI if IndexedDB is completely inaccessible.
 * This handles the "UnknownError: Internal error" bug in Chromium.
 */
function renderSafeModeUI(error) {
    if (typeof document === 'undefined') return;
    if (document.getElementById('safe-mode-screen')) return;

    isSafeModeActive = true;
    const div = document.createElement('div');
    div.id = 'safe-mode-screen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0f172a;color:#f1f5f9;display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;padding:2rem;text-align:center;';

    div.innerHTML = `
        <div style="background:#1e293b;padding:3rem;border-radius:1rem;border:1px solid #334155;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);max-width:32rem;">
            <div style="font-size:4rem;margin-bottom:1rem;">🛰️</div>
            <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem;color:#f87171;">Storage Access Failure</h1>
            <p style="margin-bottom:1.5rem;color:#94a3b8;line-height:1.6;">
                Windows is preventing the application from accessing its local data files. 
                This usually happens if the data is corrupted or locked by another process.
            </p>
            <div style="background:#0f172a;padding:1rem;border-radius:0.5rem;font-family:monospace;font-size:0.75rem;color:#ef4444;margin-bottom:2rem;word-break:break-all;">
                CODE: ${error?.name || 'N/A'}<br/>
                INFO: ${error?.message || 'Unknown internal error'}
            </div>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
                <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload();" 
                        style="background:#3b82f6;color:white;border:none;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;cursor:pointer;">
                    Purge Cache & Restart
                </button>
                <button onclick="window.close()" 
                        style="background:transparent;color:#94a3b8;border:1px solid #334155;padding:0.75rem 1.5rem;border-radius:0.5rem;font-weight:600;cursor:pointer;">
                    Close Application
                </button>
            </div>
            <p style="margin-top:2rem;font-size:0.75rem;color:#475569;">
                <b>System Hint:</b> Since you are running from the 'Music' folder, Windows might be blocking access. 
                Move this entire folder to <b>C:\\StudyBuddy</b> or your <b>Desktop</b> to fix this. 
                A full computer restart also helps.
            </p>
        </div>
    `;
    document.body.appendChild(div);
}

export async function ensureDbOpen() {
    if (db.isOpen()) return;
    if (isSafeModeActive) throw new Error("App is in Safe Mode UI.");

    if (openPromise) return openPromise;

    openPromise = (async () => {
        const MAX_RETRIES = 3;
        let lastError = null;

        for (let i = 1; i <= MAX_RETRIES; i++) {
            try {
                await db.open();
                console.log("Database StudyBuddy_Final_v5 active.");
                return;
            } catch (err) {
                lastError = err;
                console.error(`DB Init Attempt ${i} failed:`, err);
                if (i < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 1000 * i));
                }
            }
        }

        // Check if we should auto-repair once or show UI
        const isInternalError = lastError?.name === 'UnknownError' || lastError?.message?.includes('Internal error');
        if (isInternalError) {
            const reloads = parseInt(sessionStorage.getItem('fail_reloads') || '0');
            if (reloads < 1) {
                console.warn("Attempting one-time automatic DB repair...");
                sessionStorage.setItem('fail_reloads', '1');
                try {
                    await Dexie.delete('StudyBuddyDB');
                    await Dexie.delete('StudyBuddyDB_v2');
                    await Dexie.delete('StudyBuddyDB_v3');
                } catch (e) { }
                setTimeout(() => window.location.reload(), 1500);
            } else {
                renderSafeModeUI(lastError);
            }
        } else {
            renderSafeModeUI(lastError);
        }

        throw lastError;
    })();

    try {
        await openPromise;
    } finally {
        if (!isSafeModeActive) openPromise = null;
    }
}

// Global cleanup for blocked events
db.on('blocked', () => {
    console.warn("DB blocked by another process.");
    renderSafeModeUI({ name: 'Blocked', message: 'The database is currently locked by another instance of the app.' });
});

// Helper functions (Unchanged baseline)
export async function getUpcomingAssignments(days = 10) {
    await ensureDbOpen();
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    try {
        return await db.table('assignments')
            .where('due_date')
            .between(now.toISOString(), future.toISOString())
            .toArray();
    } catch (err) {
        console.error("Error getting upcoming assignments:", err);
        return [];
    }
}

export async function getStudyStats(moduleId = null) {
    await ensureDbOpen();
    try {
        let sessions = await db.table('studySessions').toArray();
        if (moduleId) sessions = sessions.filter(s => s.module_id === moduleId);
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
        return {
            totalMinutes,
            sessionCount: sessions.length,
            lastSession: sessions.length > 0 ? sessions[sessions.length - 1].date : null
        };
    } catch (err) {
        console.error("Error getting study stats:", err);
        return { totalMinutes: 0, sessionCount: 0, lastSession: null };
    }
}

export async function createNotification({ type, title, message, priority = 'medium', entity_type = null, entity_id = null }) {
    await ensureDbOpen();
    try {
        return await db.table('notifications').add({
            type, title, message, read: false, dismissed: false, priority,
            created_date: new Date().toISOString(), entity_type, entity_id
        });
    } catch (err) {
        console.error("Error creating notification:", err);
        return null;
    }
}

export async function getNotifications(filter = {}) {
    await ensureDbOpen();
    try {
        let notifications = await db.table('notifications').toArray();
        if (filter.unreadOnly) notifications = notifications.filter(n => !n.read && !n.dismissed);
        if (filter.type) notifications = notifications.filter(n => n.type === filter.type);
        return notifications.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    } catch (err) {
        console.error("Error getting notifications:", err);
        return [];
    }
}

export async function getUnreadCount() {
    await ensureDbOpen();
    try {
        const notifications = await db.table('notifications').toArray();
        return notifications.filter(n => !n.read && !n.dismissed).length;
    } catch (err) {
        console.error("Error getting unread count:", err);
        return 0;
    }
}

export async function markNotificationAsRead(id) {
    await ensureDbOpen();
    try { await db.table('notifications').update(id, { read: true }); }
    catch (err) { console.error("Error marking notification as read:", err); }
}

export async function markAllAsRead() {
    try {
        const notifications = await db.table('notifications').toArray();
        const unread = notifications.filter(n => !n.read);
        for (const notification of unread) {
            await db.table('notifications').update(notification.id, { read: true });
        }
    } catch (err) { console.error("Error marking all as read:", err); }
}

export async function dismissNotification(id) {
    try { await db.table('notifications').update(id, { dismissed: true }); }
    catch (err) { console.error("Error dismissing notification:", err); }
}

export async function getNotificationSettings() {
    await ensureDbOpen();
    try {
        const settings = await db.table('notificationSettings').get(1);
        return settings || {
            deadlines_enabled: true, materials_enabled: true, achievements_enabled: true,
            intervals: [15, 7, 3, 1], desktop_enabled: true
        };
    } catch (err) {
        console.error("Error getting notification settings:", err);
        return { deadlines_enabled: true, materials_enabled: true, achievements_enabled: true, intervals: [15, 7, 3, 1], desktop_enabled: true };
    }
}

export async function saveNotificationSettings(settings) {
    try { await db.table('notificationSettings').put({ id: 1, user_id: 1, ...settings }); }
    catch (err) { console.error("Error saving notification settings:", err); }
}

export async function getUserActivitySummary() {
    await ensureDbOpen();
    try {
        const activities = await db.table('learningActivities').toArray();
        const quizzes = await db.table('quizzes').toArray();
        const essays = await db.table('essays').toArray();
        const sessions = await db.table('studySessions').toArray();
        return {
            activities, quizzes, essays, sessions,
            totalActivities: activities.length,
            totalQuizzes: quizzes.length,
            totalEssays: essays.length,
            totalSessions: sessions.length,
            lastActivity: activities[0]?.created_date || null
        };
    } catch (err) {
        console.error("Error getting user activity summary:", err);
        return { activities: [], quizzes: [], essays: [], sessions: [], totalActivities: 0, totalQuizzes: 0, totalEssays: 0, totalSessions: 0, lastActivity: null };
    }
}

export async function getModuleEngagement() {
    await ensureDbOpen();
    try {
        const sessions = await db.table('studySessions').toArray();
        const activities = await db.table('learningActivities').toArray();
        const engagement = {};
        sessions.forEach(session => {
            const moduleId = session.module_id || 'unassigned';
            if (!engagement[moduleId]) engagement[moduleId] = { moduleId, totalMinutes: 0, sessionCount: 0, activityCount: 0, lastActivity: null };
            engagement[moduleId].totalMinutes += session.duration_minutes || 0;
            engagement[moduleId].sessionCount += 1;
            if (!engagement[moduleId].lastActivity || new Date(session.date) > new Date(engagement[moduleId].lastActivity)) engagement[moduleId].lastActivity = session.date;
        });
        activities.forEach(activity => {
            const moduleId = activity.module_id || 'unassigned';
            if (!engagement[moduleId]) engagement[moduleId] = { moduleId, totalMinutes: 0, sessionCount: 0, activityCount: 0, lastActivity: null };
            engagement[moduleId].activityCount += 1;
            engagement[moduleId].totalMinutes += activity.time_spent_minutes || 0;
        });
        return Object.values(engagement);
    } catch (err) {
        console.error("Error getting module engagement:", err);
        return [];
    }
}

export async function getPerformanceTrends() {
    await ensureDbOpen();
    try {
        const activities = await db.table('learningActivities').toArray();
        const quizzes = await db.table('quizzes').toArray();
        const scoredActivities = activities.filter(a => a.performance_score != null).sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
        const scoredQuizzes = quizzes.filter(q => q.best_score != null).sort((a, b) => new Date(a.last_attempted).getTime() - new Date(b.last_attempted).getTime());
        const allScores = [...scoredActivities.map(a => a.performance_score), ...scoredQuizzes.map(q => q.best_score)];
        if (allScores.length < 3) return { trend: 'insufficient_data', averageScore: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0, recentActivities: scoredActivities.slice(-5), recentQuizzes: scoredQuizzes.slice(-5) };
        const midpoint = Math.floor(allScores.length / 2);
        const firstHalfAvg = allScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
        const secondHalfAvg = allScores.slice(midpoint).reduce((a, b) => a + b, 0) / (allScores.length - midpoint);
        let trend = 'stable';
        if (secondHalfAvg > firstHalfAvg + 5) trend = 'improving';
        else if (secondHalfAvg < firstHalfAvg - 5) trend = 'declining';
        return { trend, averageScore: allScores.reduce((a, b) => a + b, 0) / allScores.length, firstHalfAvg, secondHalfAvg, recentActivities: scoredActivities.slice(-5), recentQuizzes: scoredQuizzes.slice(-5), totalDataPoints: allScores.length };
    } catch (err) {
        console.error("Error getting performance trends:", err);
        return { trend: 'error', averageScore: 0, recentActivities: [], recentQuizzes: [] };
    }
}

export async function getWeakTopics() {
    await ensureDbOpen();
    try {
        const quizzes = await db.table('quizzes').toArray();
        const activities = await db.table('learningActivities').toArray();
        const skillGaps = await db.table('skillGaps').toArray();
        const weakTopics = [];
        quizzes.forEach(quiz => {
            if (quiz.best_score != null && quiz.best_score < 70) weakTopics.push({ topic: quiz.title, score: quiz.best_score, type: 'quiz', moduleId: quiz.module_id, difficulty: quiz.difficulty, source: 'quiz_performance' });
        });
        activities.forEach(activity => {
            if (activity.performance_score != null && activity.performance_score < 70) weakTopics.push({ topic: activity.topic, score: activity.performance_score, type: activity.activity_type, moduleId: activity.module_id, source: 'activity_performance' });
        });
        skillGaps.forEach(gap => {
            if (gap.status === 'active') weakTopics.push({ topic: gap.skill_name, score: 50, type: 'skill_gap', moduleId: gap.module_id, severity: gap.severity, source: 'skill_gap_analysis' });
        });
        return weakTopics.sort((a, b) => (a.score || 0) - (b.score || 0));
    } catch (err) {
        console.error("Error getting weak topics:", err);
        return [];
    }
}

export async function getDeepDiveTopics() {
    await ensureDbOpen();
    try {
        const activities = await db.table('learningActivities').where('activity_type').equals('deep_dive').toArray();
        return activities.map(a => ({
            topic: a.topic, score: a.performance_score, moduleId: a.module_id, date: a.created_date, completed: a.completed
        }));
    } catch (err) {
        console.error("Error getting deep dive topics:", err);
        return [];
    }
}
