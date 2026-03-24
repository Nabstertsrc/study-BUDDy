import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import {
    Bell,
    Info,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Zap,
    ChevronRight
} from 'lucide-react-native';
import { databaseService } from '@/services/database-service';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        const data = await databaseService.getNotifications();
        setNotifications(data);
        setIsLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const markRead = async (id: string) => {
        await databaseService.markNotificationRead(id);
        loadNotifications();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'deadline': return Calendar;
            case 'system': return Info;
            case 'achievement': return Zap;
            case 'alert': return AlertCircle;
            default: return Bell;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'deadline': return '#f97316';
            case 'system': return '#3B82F6';
            case 'achievement': return '#FBBF24';
            case 'alert': return '#ef4444';
            default: return '#64748b';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Stay updated with your study schedule</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                ) : notifications.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIconBox}>
                            <Bell size={48} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyTitle}>All caught up!</Text>
                        <Text style={styles.emptyText}>You don't have any notifications right now.</Text>
                    </View>
                ) : (
                    notifications.map((n) => {
                        const Icon = getIcon(n.type);
                        const color = getColor(n.type);
                        return (
                            <TouchableOpacity
                                key={n.id}
                                style={[styles.notificationCard, n.read === 0 && styles.unreadCard]}
                                onPress={() => markRead(n.id)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                                    <Icon size={22} color={color} />
                                </View>
                                <View style={styles.content}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{n.title}</Text>
                                        <Text style={styles.time}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.message}>{n.message}</Text>
                                </View>
                                {n.read === 0 && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => Alert.alert("Coming Soon", "Multi-select actions are being optimized.")}
            >
                <Text style={styles.clearAllText}>Mark all as read</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    notificationCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        flexDirection: 'row',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        position: 'relative',
    },
    unreadCard: {
        backgroundColor: '#fff',
        borderColor: '#3B82F6',
        borderWidth: 1.5,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    message: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    unreadDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
    empty: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    clearAllButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: '#0f172a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
    },
    clearAllText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    }
});
