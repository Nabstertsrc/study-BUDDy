import { db, createNotification, getNotificationSettings, getUpcomingAssignments } from './db';
import { differenceInDays, isPast, isToday } from 'date-fns';

/**
 * Notification Service
 * Handles creation and management of notifications for assignments and materials
 */

class NotificationService {
    constructor() {
        this.notificationQueue = [];
        this.lastCheck = null;
    }

    /**
     * Check for assignments that need notifications based on configured intervals
     */
    async checkAssignmentDeadlines(assignments) {
        if (!assignments || assignments.length === 0) return [];

        const settings = await getNotificationSettings();
        if (!settings.deadlines_enabled) return [];

        const now = new Date();
        const generatedNotifications = [];
        const intervals = settings.intervals || [15, 7, 3, 1];

        for (const assignment of assignments) {
            // Skip completed assignments
            if (assignment.status === 'submitted' || assignment.status === 'graded') {
                continue;
            }

            const dueDate = new Date(assignment.due_date);
            const daysUntilDue = differenceInDays(dueDate, now);

            // Check if this assignment is at one of our notification intervals
            for (const interval of intervals) {
                if (daysUntilDue === interval) {
                    const notification = await this.createAssignmentNotification(assignment, interval);
                    if (notification) {
                        generatedNotifications.push(notification);
                    }
                }
            }

            // Check for overdue assignments
            if (isPast(dueDate) && !isToday(dueDate) && daysUntilDue >= -1) {
                const notification = await this.createOverdueNotification(assignment, Math.abs(daysUntilDue));
                if (notification) {
                    generatedNotifications.push(notification);
                }
            }

            // Check for due today
            if (isToday(dueDate)) {
                const notification = await this.createDueTodayNotification(assignment);
                if (notification) {
                    generatedNotifications.push(notification);
                }
            }
        }

        return generatedNotifications;
    }

    /**
     * Create notification for assignment at specific interval
     */
    async createAssignmentNotification(assignment, daysUntilDue) {
        try {
            let priority = 'medium';
            let urgencyText = `in ${daysUntilDue} days`;

            if (daysUntilDue === 1) {
                priority = 'high';
                urgencyText = 'tomorrow';
            } else if (daysUntilDue === 3) {
                priority = 'high';
                urgencyText = 'in 3 days';
            } else if (daysUntilDue <= 7) {
                priority = 'medium';
            }

            const notificationId = await createNotification({
                type: 'assignment_deadline',
                title: `Assignment Due ${urgencyText}`,
                message: `"${assignment.title}" is due ${urgencyText}. ${assignment.weight ? `Worth ${assignment.weight}% of your grade.` : ''}`,
                priority,
                entity_type: 'assignment',
                entity_id: assignment.id
            });

            if (notificationId) {
                this.sendDesktopNotification(
                    `Assignment Due ${urgencyText}`,
                    `"${assignment.title}" is due ${urgencyText}.`
                );
            }

            return notificationId;
        } catch (err) {
            console.error('Error creating assignment notification:', err);
            return null;
        }
    }

    /**
     * Create notification for due today assignments
     */
    async createDueTodayNotification(assignment) {
        try {
            const notificationId = await createNotification({
                type: 'assignment_deadline',
                title: '⚠️ Assignment Due Today!',
                message: `"${assignment.title}" is due today! Don't forget to submit.`,
                priority: 'urgent',
                entity_type: 'assignment',
                entity_id: assignment.id
            });

            if (notificationId) {
                this.sendDesktopNotification(
                    '⚠️ Assignment Due Today!',
                    `"${assignment.title}" is due today! Don't forget to submit.`
                );
            }

            return notificationId;
        } catch (err) {
            console.error('Error creating due today notification:', err);
            return null;
        }
    }

    /**
     * Create notification for overdue assignments
     */
    async createOverdueNotification(assignment, daysOverdue) {
        try {
            const notificationId = await createNotification({
                type: 'assignment_overdue',
                title: '🚨 Overdue Assignment',
                message: `"${assignment.title}" was due ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} ago. Submit as soon as possible!`,
                priority: 'urgent',
                entity_type: 'assignment',
                entity_id: assignment.id
            });

            if (notificationId) {
                this.sendDesktopNotification(
                    '🚨 Overdue Assignment',
                    `"${assignment.title}" is overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}!`
                );
            }

            return notificationId;
        } catch (err) {
            console.error('Error creating overdue notification:', err);
            return null;
        }
    }

    /**
     * Create notification for new material uploaded
     */
    async createMaterialNotification(material, moduleName) {
        try {
            const settings = await getNotificationSettings();
            if (!settings.materials_enabled) return null;

            const notificationId = await createNotification({
                type: 'material_added',
                title: '📚 New Study Material',
                message: `New material "${material.title}" added to ${moduleName || 'your module'}`,
                priority: 'low',
                entity_type: 'material',
                entity_id: material.id
            });

            if (notificationId) {
                this.sendDesktopNotification(
                    '📚 New Study Material',
                    `"${material.title}" added to ${moduleName || 'your module'}`
                );
            }

            return notificationId;
        } catch (err) {
            console.error('Error creating material notification:', err);
            return null;
        }
    }

    /**
     * Create notification for assignment graded
     */
    async createGradedNotification(assignment, grade) {
        try {
            const notificationId = await createNotification({
                type: 'assignment_graded',
                title: '✅ Assignment Graded',
                message: `Your assignment "${assignment.title}" has been graded: ${grade}/${assignment.max_grade || 100}`,
                priority: 'medium',
                entity_type: 'assignment',
                entity_id: assignment.id
            });

            return notificationId;
        } catch (err) {
            console.error('Error creating graded notification:', err);
            return null;
        }
    }

    /**
     * Send desktop notification via Electron
     */
    sendDesktopNotification(title, body, onClick = null) {
        const electron = window['electron'];
        if (!electron) return;

        try {
            electron.showNotification({ title, body });
            if (onClick) {
                // Future: implement click handler
            }
        } catch (err) {
            console.error('Error sending desktop notification:', err);
        }
    }

    /**
     * Batch check all notifications
     */
    async performFullCheck(assignments) {
        if (!assignments) return [];

        const settings = await getNotificationSettings();
        if (!settings.deadlines_enabled) return [];

        // Simple deduplication - get existing notifications from today
        // We use a date string that represents today at midnight
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const existingNotifications = await db.table('notifications')
            .where('created_date')
            .above(todayStart.toISOString())
            .toArray();

        const notifications = [];
        const intervals = settings.intervals || [15, 7, 3, 1];
        const now = new Date();

        for (const assignment of assignments) {
            if (assignment.status === 'submitted' || assignment.status === 'graded') continue;

            const dueDate = new Date(assignment.due_date);
            const daysUntilDue = differenceInDays(dueDate, now);

            // 1. Check Intervals
            for (const interval of intervals) {
                if (daysUntilDue === interval) {
                    const alreadyNotified = existingNotifications.some(n =>
                        n.entity_id === assignment.id &&
                        n.message.includes(`in ${interval} days`)
                    );

                    if (!alreadyNotified) {
                        const id = await this.createAssignmentNotification(assignment, interval);
                        if (id) notifications.push(id);
                    }
                }
            }

            // 2. Overdue
            if (isPast(dueDate) && !isToday(dueDate) && daysUntilDue >= -1) {
                const alreadyNotified = existingNotifications.some(n =>
                    n.entity_id === assignment.id &&
                    n.type === 'assignment_overdue'
                );

                if (!alreadyNotified) {
                    const id = await this.createOverdueNotification(assignment, Math.abs(daysUntilDue));
                    if (id) notifications.push(id);
                }
            }

            // 3. Due Today
            if (isToday(dueDate)) {
                const alreadyNotified = existingNotifications.some(n =>
                    n.entity_id === assignment.id &&
                    n.title.includes('Today')
                );

                if (!alreadyNotified) {
                    const id = await this.createDueTodayNotification(assignment);
                    if (id) notifications.push(id);
                }
            }
        }

        this.lastCheck = new Date();
        return notifications;
    }
}

export const notificationService = new NotificationService();
export default notificationService;
