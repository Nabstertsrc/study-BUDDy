import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount } from './db';
import notificationService from './notificationService';
import { base44 } from '@/api/base44Client';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [lastCheckTime, setLastCheckTime] = useState(null);

    // Query for notifications
    const { data: notifications = [], refetch: refetchNotifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => getNotifications(),
        refetchInterval: 60000, // Refetch every minute
    });

    // Query for unread count
    const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: () => getUnreadCount(),
        refetchInterval: 60000,
    });

    // Refresh all notification data
    const refreshNotifications = async () => {
        await refetchNotifications();
        await refetchUnreadCount();
    };

    // Trigger notification check manually
    const checkForNotifications = async (assignments) => {
        if (assignments && assignments.length > 0) {
            await notificationService.performFullCheck(assignments);
            await refreshNotifications();
            setLastCheckTime(new Date());
        }
    };

    // Send desktop notification
    const sendDesktopNotification = (title, message) => {
        notificationService.sendDesktopNotification(title, message);
    };

    // Auto-check periodically
    useEffect(() => {
        const check = async () => {
            const assignments = await base44.entities.Assignment.list();
            if (assignments && assignments.length > 0) {
                await checkForNotifications(assignments);
            }
        };

        // Listen for requests from Electron main process
        const electron = window['electron'];
        if (electron && electron.on) {
            electron.on('request-deadline-check', check);
        }

        const interval = setInterval(check, 1000 * 60 * 30); // Check every 30 minutes

        return () => clearInterval(interval);
    }, []);

    const value = {
        notifications,
        unreadCount,
        refreshNotifications,
        checkForNotifications,
        sendDesktopNotification,
        lastCheckTime,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
