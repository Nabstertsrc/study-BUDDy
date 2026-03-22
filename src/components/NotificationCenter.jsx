import React, { useState } from 'react';
import { Bell, X, Check, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/lib/NotificationContext';
import { markNotificationAsRead, dismissNotification, markAllAsRead } from '@/lib/db';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationCenter = () => {
    const { notifications, refreshNotifications } = useNotifications();
    const [filter, setFilter] = useState('all');

    const handleMarkAsRead = async (id) => {
        await markNotificationAsRead(id);
        await refreshNotifications();
    };

    const handleDismiss = async (id) => {
        await dismissNotification(id);
        await refreshNotifications();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        await refreshNotifications();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'assignment_deadline':
            case 'assignment_overdue':
                return '📋';
            case 'assignment_graded':
                return '✅';
            case 'material_added':
                return '📚';
            default:
                return '🔔';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-red-500 bg-red-50';
            case 'high':
                return 'border-orange-500 bg-orange-50';
            case 'medium':
                return 'border-blue-500 bg-blue-50';
            default:
                return 'border-slate-300 bg-white';
        }
    };

    // Filter notifications
    const filteredNotifications = notifications.filter((n) => {
        if (n.dismissed) return false;
        if (filter === 'unread') return !n.read;
        if (filter === 'assignments') return n.type.includes('assignment');
        if (filter === 'materials') return n.type.includes('material');
        return true;
    });

    // Group by time
    const groupNotifications = (notifs) => {
        const today = [];
        const yesterday = [];
        const thisWeek = [];
        const earlier = [];

        notifs.forEach((n) => {
            const date = new Date(n.created_date);
            if (isToday(date)) {
                today.push(n);
            } else if (isYesterday(date)) {
                yesterday.push(n);
            } else if (isThisWeek(date)) {
                thisWeek.push(n);
            } else {
                earlier.push(n);
            }
        });

        return { today, yesterday, thisWeek, earlier };
    };

    const grouped = groupNotifications(filteredNotifications);
    const unreadCount = filteredNotifications.filter((n) => !n.read).length;

    const NotificationCard = ({ notification }) => (
        <div
            className={cn(
                'p-4 rounded-xl border-2 transition-all',
                getPriorityColor(notification.priority),
                !notification.read && 'shadow-md'
            )}
        >
            <div className="flex gap-3">
                <div className="flex-shrink-0 text-3xl">{getNotificationIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    title="Mark as read"
                                >
                                    <Check className="w-4 h-4 text-green-600" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(notification.id)}
                                title="Dismiss"
                            >
                                <X className="w-4 h-4 text-slate-400 hover:text-red-600" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                            {notification.priority}
                        </Badge>
                        <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const NotificationGroup = ({ title, notifications }) => {
        if (notifications.length === 0) return null;

        return (
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    {title}
                </h3>
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <NotificationCard key={notification.id} notification={notification} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Bell className="w-8 h-8 text-blue-600" />
                        Notification Center
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {unreadCount > 0
                            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                            : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        <Check className="w-4 h-4 mr-2" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Tabs value={filter} onValueChange={setFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Notifications */}
            <div className="space-y-6">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No notifications</h3>
                        <p className="text-slate-500 mt-1">
                            {filter === 'unread'
                                ? "You've read all your notifications"
                                : "You don't have any notifications yet"}
                        </p>
                    </div>
                ) : (
                    <>
                        <NotificationGroup title="Today" notifications={grouped.today} />
                        <NotificationGroup title="Yesterday" notifications={grouped.yesterday} />
                        <NotificationGroup title="This Week" notifications={grouped.thisWeek} />
                        <NotificationGroup title="Earlier" notifications={grouped.earlier} />
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
