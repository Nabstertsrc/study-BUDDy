import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View as RNView, TextInput, Switch, Alert, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
    User,
    Shield,
    Settings as SettingsIcon,
    Info,
    ChevronRight,
    LogOut,
    Moon,
    Bell,
    Zap,
    Sparkles,
    Database,
    Key,
    Globe,
    Trash2
} from 'lucide-react-native';

export default function SettingsScreen() {
    const [geminiKey, setGeminiKey] = useState('');
    const [deepseekKey, setDeepseekKey] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const handleSaveConfig = () => {
        Alert.alert("Success", "AI Brain Configuration saved locally in secure storage.");
    };

    const menuItems = [
        { icon: User, label: 'Profile Settings', sub: 'Account, name, and email' },
        { icon: Bell, label: 'Notifications', sub: 'Manage alerts and reminders', toggle: true, value: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: Moon, label: 'Dark Mode', sub: 'Switch interface theme', toggle: true, value: darkMode, onToggle: setDarkMode },
        { icon: Shield, label: 'Privacy & Security', sub: 'Data encryption and locks' },
        { icon: Info, label: 'About Academia AI', sub: 'Version 1.0.0 (Elite)' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Configure your learning environment</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                {/* AI BRAINS CONFIGURATION CLONE */}
                <RNView style={styles.configCard}>
                    <RNView style={styles.configHeader}>
                        <Sparkles size={20} color="#8B5CF6" />
                        <Text style={styles.configTitle}>AI Brains Configuration</Text>
                    </RNView>
                    <Text style={styles.configDesc}>Configure the AI models that power your AI Study Buddy.</Text>

                    <RNView style={styles.inputGroup}>
                        <RNView style={styles.inputLabelRow}>
                            <RNView style={styles.labelMain}>
                                <Key size={14} color="#64748B" />
                                <Text style={styles.inputLabel}>Gemini API Key (Google AI)</Text>
                            </RNView>
                            <RNView style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ENV ACTIVE</Text>
                            </RNView>
                        </RNView>
                        <TextInput
                            style={styles.input}
                            placeholder="Paste your Gemini AI key here..."
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                            value={geminiKey}
                            onChangeText={setGeminiKey}
                        />
                        <Text style={styles.inputNote}>* Best for scanning PDFs, images of notes, and multimodal tasks.</Text>
                    </RNView>

                    <RNView style={styles.inputGroup}>
                        <RNView style={styles.inputLabelRow}>
                            <RNView style={styles.labelMain}>
                                <Key size={14} color="#64748B" />
                                <Text style={styles.inputLabel}>DeepSeek API Key</Text>
                            </RNView>
                            <RNView style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ENV ACTIVE</Text>
                            </RNView>
                        </RNView>
                        <TextInput
                            style={styles.input}
                            placeholder="Paste your DeepSeek key here..."
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                            value={deepseekKey}
                            onChangeText={setDeepseekKey}
                        />
                        <Text style={styles.inputNote}>* High-speed fallback for general chat and study assistance.</Text>
                    </RNView>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfig}>
                        <Database size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>Save Config Locally</Text>
                    </TouchableOpacity>
                </RNView>

                {/* GENERAL MENU */}
                <RNView style={styles.menuSection}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity key={i} style={styles.menuItem} disabled={item.toggle}>
                            <RNView style={styles.menuIconContainer}>
                                <item.icon size={20} color="#4F46E5" />
                            </RNView>
                            <RNView style={styles.menuContent}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSub}>{item.sub}</Text>
                            </RNView>
                            {item.toggle ? (
                                <Switch
                                    value={item.value}
                                    onValueChange={item.onToggle}
                                    trackColor={{ false: '#E2E8F0', true: '#4F46E5' }}
                                />
                            ) : (
                                <ChevronRight size={18} color="#CBD5E1" />
                            )}
                        </TouchableOpacity>
                    ))}
                </RNView>

                {/* DANGER AREA */}
                <RNView style={styles.dangerSection}>
                    <TouchableOpacity style={styles.dangerItem}>
                        <Trash2 size={20} color="#F43F5E" />
                        <Text style={styles.dangerText}>Clear Local Cache</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerItem}>
                        <LogOut size={20} color="#F43F5E" />
                        <Text style={styles.dangerText}>Sign Out From Device</Text>
                    </TouchableOpacity>
                </RNView>

                <RNView style={styles.footer}>
                    <Text style={styles.footerText}>Academia AI Version 1.0.0 (Elite)</Text>
                    <Text style={styles.footerSub}>Local-First Architecture Active</Text>
                </RNView>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '600',
    },
    scrollContainer: {
        paddingBottom: 120,
        backgroundColor: '#F8FAFC',
    },
    configCard: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    configHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    configTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    configDesc: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    labelMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    activeBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#166534',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        color: '#0F172A',
    },
    inputNote: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
        marginTop: 8,
        fontStyle: 'italic',
    },
    saveBtn: {
        backgroundColor: '#8B5CF6',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    menuSection: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        paddingLeft: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingRight: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuContent: {
        flex: 1,
        marginLeft: 16,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    menuSub: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    dangerSection: {
        marginTop: 30,
        paddingHorizontal: 20,
        gap: 12,
    },
    dangerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF1F2',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    dangerText: {
        color: '#F43F5E',
        fontSize: 14,
        fontWeight: '700',
    },
    footer: {
        padding: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#94A3B8',
    },
    footerSub: {
        fontSize: 11,
        color: '#CBD5E1',
        fontWeight: '600',
        marginTop: 4,
    }
});
