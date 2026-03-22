import React, { useState } from 'react';
import { Bell, BellRing, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/lib/NotificationContext';
import { markNotificationAsRead, markAllAsRead, dismissNotification } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
    const { notifications, unreadCount, refreshNotifications } = useNotifications();
    const [open, setOpen] = useState(false);

    const handleMarkAsRead = async (id, e) => {
        e.stopPropagation();
        await markNotificationAsRead(id);
        await refreshNotifications();
    };

    const handleDismiss = async (id, e) => {
        e.stopPropagation();
        await dismissNotification(id);
        await refreshNotifications();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        await refreshNotifications();
    };

    // Get recent unread notifications (max 5)
    const recentNotifications = notifications
        .filter(n => !n.dismissed)
        .slice(0, 5);

    const unreadNotifications = recentNotifications.filter(n => !n.read);

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
                return 'text-red-600 bg-red-50 border-red-200';
            case 'high':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    {unreadCount > 0 ? (
                        <BellRing className="w-5 h-5 text-blue-600 animate-pulse" />
                    ) : (
                        <Bell className="w-5 h-5" />
                    )}
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadNotifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            <Check className="w-3 h-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {recentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Bell className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="font-medium text-slate-900">No notifications</p>
                            <p className="text-sm text-slate-500 mt-1">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recentNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-slate-50 transition-colors relative',
                                        !notification.read && 'bg-blue-50/50'
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-sm text-slate-900">
                                                    {notification.title}
                                                </h4>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                        onClick={(e) => handleDismiss(notification.id, e)}
                                                        title="Dismiss"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn('text-xs', getPriorityColor(notification.priority))}
                                                >
                                                    {notification.priority}
                                                </Badge>
                                                <span className="text-xs text-slate-400">
                                                    {formatDistanceToNow(new Date(notification.created_date), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {!notification.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {recentNotifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full text-sm text-blue-600 hover:text-blue-700"
                            >
                                View all notifications
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
