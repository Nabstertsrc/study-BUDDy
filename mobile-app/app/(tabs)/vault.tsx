import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View as RNView, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
    Plus,
    Sparkles,
    BookOpen,
    ChevronRight,
    Scan,
    Calendar,
    Zap,
    CheckCircle2,
    Clock
} from 'lucide-react-native';
import { databaseService, Module, Assignment } from '@/services/database-service';
import { AIService } from '@/services/ai-service';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { OCRService } from '@/services/ocr-service';

const { width } = Dimensions.get('window');

export default function VaultScreen() {
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const m = await databaseService.getModules();
            setModules(m);
        } catch (error) {
            console.error('Vault load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDocumentSync = async () => {
        setIsSyncing(true);
        try {
            // 1. Extract Text
            const { text } = await OCRService.extractTextFromFile();
            if (!text) throw new Error("No text found");

            // 2. Detect Module
            const detectedCode = await AIService.detectModuleFromContent(text, modules);
            const targetModule = modules.find(m => m.code === detectedCode);

            if (targetModule) {
                Alert.alert(
                    "Module Detected",
                    `This document belongs to ${targetModule.code}. Processing AI actions...`,
                    [{ text: "OK" }]
                );

                // 3. Scan for Books (Background)
                const books = await AIService.scanForPrescribedBooks(text);
                if (books.length > 0) {
                    Alert.alert("Prescribed Books Found", `Added ${books.length} books to ${targetModule.code}.`);
                }

                // 4. Save Content as Raw Material
                await databaseService.saveMaterial({
                    id: Date.now().toString(),
                    title: `Imported: ${new Date().toLocaleDateString()}`,
                    content: text,
                    module_id: targetModule.id,
                    type: 'ocr',
                    createdAt: new Date().toISOString()
                });

                // 5. Navigate to Study Lab with context
                router.push({
                    pathname: '/study',
                    params: { initialText: text, tab: 'notes' }
                });

            } else {
                Alert.alert("Manual Classification", "Could not auto-detect module. Opening in Study Lab for manual processing.", [
                    {
                        text: "Proceed",
                        onPress: () => router.push({ pathname: '/study', params: { initialText: text } })
                    }
                ]);
            }

        } catch (e) {
            Alert.alert("Sync Error", "Failed to process document. Please try scanning manually.");
        } finally {
            setIsSyncing(false);
        }
    };

    const getInitials = (title: string) => {
        return title.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getModuleColor = (index: number) => {
        const colors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];
        return colors[index % colors.length];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <RNView>
                    <Text style={styles.title}>My Modules</Text>
                    <Text style={styles.subtitle}>Manage your enrolled courses and track progress</Text>
                </RNView>
                <RNView style={styles.headerActions}>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#8B5CF6' }]} onPress={handleDocumentSync} disabled={isSyncing}>
                        {isSyncing ? <ActivityIndicator size="small" color="#fff" /> : <Sparkles size={16} color="#fff" />}
                        <Text style={styles.addBtnText}>Automated Sync</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn}>
                        <Plus size={18} color="#fff" />
                        <Text style={styles.addBtnText}>Add Module</Text>
                    </TouchableOpacity>
                </RNView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                {/* WEEKLY STUDY PLAN WIDGET FROM SCREENSHOT */}
                <RNView style={styles.planCard}>
                    <RNView style={styles.planHeader}>
                        <RNView style={styles.planIcon}>
                            <BookOpen size={20} color="#fff" />
                        </RNView>
                        <RNView>
                            <Text style={styles.planTitle}>Weekly Study Plan 📅</Text>
                            <Text style={styles.planSubtitle}>Recommended: 10 hours</Text>
                        </RNView>
                    </RNView>
                    <RNView style={styles.planContent}>
                        <Text style={styles.planText}>
                            Monday: 1 hour RCE2601 review, Tuesday: 1 hour quizzes, Wednesday: 2 hours on deep dive questions,
                            Thursday: 1 hour studying SED2601, Friday: 1 hour on quizzes, Saturday: 3 hours on module content, Sunday:
                            Rest or catch up!
                        </Text>
                    </RNView>
                </RNView>

                {/* MODULES GRID */}
                <RNView style={styles.moduleGrid}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
                    ) : modules.length === 0 ? (
                        <RNView style={styles.empty}>
                            <Text style={styles.emptyText}>No modules yet. Use the scanner below to import your syllabus.</Text>
                        </RNView>
                    ) : modules.map((m, i) => (
                        <TouchableOpacity key={m.id} style={styles.moduleCard}>
                            <RNView style={[styles.colorBar, { backgroundColor: getModuleColor(i) }]} />
                            <RNView style={styles.moduleCardContent}>
                                <RNView style={[styles.moduleIcon, { backgroundColor: getModuleColor(i) }]}>
                                    <Text style={styles.moduleIconText}>{getInitials(m.title)}</Text>
                                </RNView>
                                <Text style={styles.moduleCode}>{m.code}</Text>
                                <Text style={styles.moduleTitle} numberOfLines={2}>{m.title}</Text>

                                <RNView style={styles.moduleFooter}>
                                    <RNView style={styles.creditRow}>
                                        <Clock size={12} color="#94A3B8" />
                                        <Text style={styles.creditText}>{m.credits} credits</Text>
                                    </RNView>
                                    <RNView style={styles.progressRow}>
                                        <Text style={styles.progressText}>Progress</Text>
                                        <Text style={styles.progressVal}>{m.progress}%</Text>
                                    </RNView>
                                    <RNView style={styles.progressBar}>
                                        <RNView style={[styles.progressFill, { width: `${m.progress}%`, backgroundColor: getModuleColor(i) }]} />
                                    </RNView>
                                </RNView>
                            </RNView>
                        </TouchableOpacity>
                    ))}
                </RNView>

                {/* RECOMMENDED FOR YOU FROM SCREENSHOT */}
                <RNView style={styles.sectionHeader}>
                    <RNView style={styles.sectionIcon}>
                        <BookOpen size={20} color="#fff" />
                    </RNView>
                    <RNView>
                        <Text style={styles.sectionTitle}>Recommended for You 📚</Text>
                        <Text style={styles.sectionSubtitle}>AI-suggested resources based on your progress</Text>
                    </RNView>
                </RNView>

                <RNView style={styles.recommendationGrid}>
                    {[
                        { title: 'RCE2601 Study Guide', module: 'RCE2601', tag: 'module material', desc: 'A great resource to understand foundational concepts better, helping you prepare for quizzes.' },
                        { title: 'Previous Quizzes', module: 'RCE2601-25-Y', tag: 'past assessments', desc: 'Practicing with these will help solidify your knowledge and show where you need more focus.' }
                    ].map((item, i) => (
                        <RNView key={i} style={styles.recCard}>
                            <RNView style={styles.recHeader}>
                                <Text style={styles.recTitle}>{item.title}</Text>
                                <RNView style={styles.recTag}>
                                    <Text style={styles.recTagText}>{item.tag}</Text>
                                </RNView>
                            </RNView>
                            <RNView style={styles.recModuleTag}>
                                <Text style={styles.recModuleText}>{item.module}</Text>
                            </RNView>
                            <Text style={styles.recDesc}>{item.desc}</Text>
                        </RNView>
                    ))}
                </RNView>

                {/* FLOATING ACTION SCANNER CLONE */}
                <RNView style={styles.scannerPrompt}>
                    <LinearGradient
                        colors={['#4F46E5', '#2563EB']}
                        style={styles.scannerCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <RNView style={styles.scannerInfo}>
                            <Zap size={20} color="#fff" />
                            <RNView>
                                <Text style={styles.scannerTitle}>AI Study Features</Text>
                                <Text style={styles.scannerDesc}>Generate quizzes, summaries & deep-dive explanations from your materials.</Text>
                            </RNView>
                        </RNView>
                        <TouchableOpacity style={styles.scannerBtn} onPress={() => router.push('/study')}>
                            <Text style={styles.scannerBtnText}>Open Study Lab</Text>
                            <ChevronRight size={14} color="#2563EB" />
                        </TouchableOpacity>
                    </LinearGradient>
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
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '600',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    scrollContainer: {
        paddingBottom: 120,
    },
    planCard: {
        margin: 20,
        backgroundColor: '#F5F3FF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 15,
    },
    planIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    planSubtitle: {
        fontSize: 12,
        color: '#7C3AED',
        fontWeight: '600',
    },
    planContent: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    planText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        fontWeight: '500',
    },
    moduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 14,
        gap: 12,
    },
    moduleCard: {
        width: (width - 40) / 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    colorBar: {
        height: 4,
        width: '100%',
    },
    moduleCardContent: {
        padding: 16,
    },
    moduleIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    moduleIconText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
    moduleCode: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    moduleTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        height: 40,
    },
    moduleFooter: {
        marginTop: 15,
        gap: 8,
    },
    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creditText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
    },
    progressVal: {
        fontSize: 10,
        color: '#1E293B',
        fontWeight: '800',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        width: '100%',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        gap: 12,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    sectionSubtitle: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    recommendationGrid: {
        padding: 20,
        gap: 12,
    },
    recCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    recTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    recTag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    recTagText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    recModuleTag: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    recModuleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2563EB',
    },
    recDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        fontWeight: '500',
    },
    scannerPrompt: {
        padding: 16,
    },
    scannerCard: {
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    scannerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        flex: 1,
    },
    scannerTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
    },
    scannerDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        paddingRight: 10,
    },
    scannerBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    scannerBtnText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '800',
    },
    empty: {
        padding: 40,
        width: '100%',
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
    }
});
