import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking, Dimensions, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Brain,
    FileText,
    Sparkles,
    Send,
    ChevronLeft,
    BookOpen,
    History,
    Download,
    Zap,
    PenTool,
    Globe,
    Share2,
    Lightbulb,
    Camera,
    FileUp,
    RotateCcw,
    Trophy,
    CheckCircle,
    XCircle,
    ChevronRight,
    Search,
    Trash2,
    Layout
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { AIService } from '@/services/ai-service';
import { PDFService } from '@/services/pdf-service';
import { OCRService } from '@/services/ocr-service';
import { useWalletStore } from '@/stores/wallet-store';
import { databaseService } from '@/services/database-service';

const { width } = Dimensions.get('window');

export default function StudyLabScreen() {
    const { tab, initialText } = useLocalSearchParams<{ tab?: string, initialText?: string }>();
    const router = useRouter();
    const { balance, useCredit } = useWalletStore();

    const [activeTab, setActiveTab] = useState(tab || 'quiz');
    const [input, setInput] = useState(initialText || '');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

    // Quiz State
    const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState<'form' | 'active_quiz' | 'result'>('form');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    // Summary/Analysis State
    const [aiResult, setAiResult] = useState<string | null>(null);

    useEffect(() => {
        loadMaterials();
        if (initialText) setInput(initialText);
    }, [initialText]);

    const loadMaterials = async () => {
        const m = await databaseService.getMaterials();
        setMaterials(m);
    };

    const TABS = [
        { id: 'quiz', label: 'Quiz', icon: Brain, color: '#8B5CF6', bg: '#F5F3FF' },
        { id: 'notes', label: 'Summary', icon: FileText, color: '#3B82F6', bg: '#EFF6FF' },
        { id: 'deepdive', label: 'Explainer', icon: Lightbulb, color: '#10B981', bg: '#ECFDF5' },
        { id: 'essay', label: 'Essay', icon: PenTool, color: '#F43F5E', bg: '#FFF1F2' },
        { id: 'materials', label: 'Materials', icon: Layout, color: '#F59E0B', bg: '#FFFBEB' },
    ];

    const handleAIAction = async () => {
        let contentToUse = input;
        if (selectedMaterial) {
            contentToUse = selectedMaterial.content;
        }

        contentToUse = AIService.cleanContentForAI(contentToUse);

        if (!contentToUse.trim()) {
            Alert.alert("Input Required", "Please provide text or select a material.");
            return;
        }

        if (balance < 1) {
            Alert.alert("Insufficient Credits", "Please top up your wallet.", [
                { text: "Cancel" },
                { text: "Top Up", onPress: () => router.push('/payment') }
            ]);
            return;
        }

        setLoading(true);
        try {
            await useCredit();
            let response;
            if (activeTab === 'quiz') {
                response = await AIService.generateQuiz(contentToUse);
                setQuizQuestions(response);
                setCurrentStep('active_quiz');
                setCurrentQuestionIndex(0);
                setScore(0);
            } else if (activeTab === 'notes') {
                response = await AIService.generateSummary(contentToUse);
                setAiResult(response);
                setCurrentStep('result');
            } else if (activeTab === 'deepdive') {
                response = await AIService.deepDive(contentToUse);
                setAiResult(response);
                setCurrentStep('result');
            } else if (activeTab === 'essay') {
                response = await AIService.gradeEssay("Essay Assessment", contentToUse);
                setAiResult(response);
                setCurrentStep('result');
            }
        } catch (error) {
            Alert.alert("Error", "Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOCR = async (mode: 'camera' | 'file') => {
        setIsScanning(true);
        try {
            const { text } = mode === 'camera' ? await OCRService.extractTextFromCamera() : await OCRService.extractTextFromFile();
            if (text) setInput(text);
        } catch (e) {
            Alert.alert("OCR Error", "Failed to extract text.");
        } finally {
            setIsScanning(false);
        }
    };

    // Quiz Navigation Logic
    const handleAnswerQuestion = () => {
        if (selectedAnswer === null) return;
        const correct = selectedAnswer === quizQuestions[currentQuestionIndex].correctAnswer;
        if (correct) setScore(s => s + 1);
        setShowExplanation(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setCurrentStep('result');
        }
    };

    const deleteMaterial = async (id: string) => {
        await databaseService.deleteMaterial(id);
        loadMaterials();
    };

    const renderQuizStep = () => {
        const q = quizQuestions[currentQuestionIndex];
        return (
            <RNView style={styles.quizContainer}>
                <RNView style={styles.quizHeader}>
                    <Text style={styles.quizProgress}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</Text>
                    <RNView style={styles.quizScoreBadge}>
                        <Text style={styles.quizScoreText}>Score: {score}</Text>
                    </RNView>
                </RNView>

                <Text style={styles.questionText}>{q.question}</Text>

                {q.options.map((opt: string, i: number) => (
                    <TouchableOpacity
                        key={i}
                        style={[
                            styles.optionCard,
                            selectedAnswer === i && styles.selectedOption,
                            showExplanation && i === q.correctAnswer && styles.correctOption,
                            showExplanation && selectedAnswer === i && i !== q.correctAnswer && styles.wrongOption
                        ]}
                        onPress={() => !showExplanation && setSelectedAnswer(i)}
                    >
                        <RNView style={[styles.optionCircle, selectedAnswer === i && styles.selectedCircle]}>
                            {selectedAnswer === i && <RNView style={styles.innerCircle} />}
                        </RNView>
                        <Text style={styles.optionText}>{opt}</Text>
                        {showExplanation && i === q.correctAnswer && <CheckCircle size={20} color="#10B981" />}
                        {showExplanation && selectedAnswer === i && i !== q.correctAnswer && <XCircle size={20} color="#F43F5E" />}
                    </TouchableOpacity>
                ))}

                {showExplanation && (
                    <RNView style={styles.explanationCard}>
                        <RNView style={styles.explanationHeader}>
                            <Sparkles size={16} color="#2563EB" />
                            <Text style={styles.explanationTitle}>AI Explanation</Text>
                        </RNView>
                        <Text style={styles.explanationText}>Great choice! The correct answer is option {q.correctAnswer + 1}.</Text>
                    </RNView>
                )}

                {!showExplanation ? (
                    <TouchableOpacity style={[styles.actionBtn, selectedAnswer === null && styles.disabledBtn]} onPress={handleAnswerQuestion} disabled={selectedAnswer === null}>
                        <Text style={styles.actionBtnText}>Check Answer</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={handleNextQuestion}>
                        <Text style={styles.actionBtnText}>{currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "See Results"}</Text>
                        <ChevronRight size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </RNView>
        );
    };

    const renderResultStep = () => {
        if (activeTab === 'quiz') {
            const percentage = Math.round((score / quizQuestions.length) * 100);
            return (
                <RNView style={styles.resultContainer}>
                    <RNView style={styles.trophyContainer}>
                        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.trophyCircle}>
                            <Trophy size={40} color="#fff" />
                        </LinearGradient>
                    </RNView>
                    <Text style={styles.resultTitle}>{percentage >= 80 ? "Excellent Work!" : percentage >= 50 ? "Good Job!" : "Keep Practicing!"}</Text>
                    <Text style={styles.resultScoreText}>You scored {score} out of {quizQuestions.length}</Text>
                    <Text style={styles.resultPercentage}>{percentage}%</Text>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setCurrentStep('form')}>
                        <RotateCcw size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </RNView>
            );
        }
        return (
            <RNView style={styles.aiResultContainer}>
                <RNView style={styles.aiResultHeader}>
                    <Sparkles size={20} color="#2563EB" />
                    <Text style={styles.aiResultTitle}>AI Analysis Result</Text>
                </RNView>
                <ScrollView style={styles.aiResultScroll}>
                    <Markdown style={markdownStyles}>{aiResult}</Markdown>
                </ScrollView>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setCurrentStep('form')}>
                    <RotateCcw size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Start New Task</Text>
                </TouchableOpacity>
            </RNView>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Academia Study Lab',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: '#fff' },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
                        <ChevronLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                ),
            }} />

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    {TABS.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.tab,
                                activeTab === t.id && { backgroundColor: t.bg, borderColor: t.color }
                            ]}
                            onPress={() => {
                                setActiveTab(t.id);
                                setCurrentStep('form');
                                setAiResult(null);
                            }}
                        >
                            <t.icon size={18} color={activeTab === t.id ? t.color : '#64748b'} />
                            <Text style={[
                                styles.tabText,
                                activeTab === t.id && { color: t.color }
                            ]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {currentStep === 'form' ? (
                    <>
                        {activeTab === 'materials' ? (
                            <RNView style={styles.materialsList}>
                                <Text style={styles.sectionTitle}>Your Study Materials</Text>
                                {materials.length === 0 ? (
                                    <RNView style={styles.emptyState}>
                                        <Layout size={40} color="#CBD5E1" />
                                        <Text style={styles.emptyText}>No materials found. Use the sync feature in Vault to add some.</Text>
                                    </RNView>
                                ) : materials.map((m) => (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.materialCard, selectedMaterial?.id === m.id && styles.selectedMaterialCard]}
                                        onPress={() => setSelectedMaterial(m)}
                                    >
                                        <RNView style={styles.materialIcon}>
                                            <FileText size={20} color="#2563EB" />
                                        </RNView>
                                        <RNView style={styles.materialInfo}>
                                            <Text style={styles.materialTitle}>{m.title}</Text>
                                            <Text style={styles.materialType}>{m.type.toUpperCase()} • {new Date(m.createdAt).toLocaleDateString()}</Text>
                                        </RNView>
                                        <TouchableOpacity onPress={() => deleteMaterial(m.id)}>
                                            <Trash2 size={18} color="#F43F5E" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                                {selectedMaterial && (
                                    <RNView style={styles.materialPrompt}>
                                        <Text style={styles.promptText}>Material selected! Now switch to Quiz or Summary to generate content.</Text>
                                    </RNView>
                                )}
                            </RNView>
                        ) : (
                            <RNView style={styles.formContainer}>
                                <Text style={styles.inputLabel}>
                                    {selectedMaterial ? `Selected content: ${selectedMaterial.title}` : 'Provide content for AI analysis:'}
                                </Text>

                                {!selectedMaterial && (
                                    <>
                                        <RNView style={styles.ocrButtonGroup}>
                                            <TouchableOpacity style={styles.ocrBtn} onPress={() => handleOCR('camera')} disabled={isScanning}>
                                                <Camera size={18} color="#2563EB" />
                                                <Text style={styles.ocrBtnText}>Scan Paper</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.ocrBtn} onPress={() => handleOCR('file')} disabled={isScanning}>
                                                <FileUp size={18} color="#8B5CF6" />
                                                <Text style={styles.ocrBtnText}>Import PDF</Text>
                                            </TouchableOpacity>
                                        </RNView>

                                        {isScanning && (
                                            <RNView style={styles.scanningOverlay}>
                                                <ActivityIndicator color="#2563EB" />
                                                <Text style={styles.scanningText}>Analyzing text...</Text>
                                            </RNView>
                                        )}

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Paste your notes here or use materials..."
                                            multiline
                                            value={input}
                                            onChangeText={setInput}
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </>
                                )}

                                {selectedMaterial && (
                                    <TouchableOpacity style={styles.clearMaterial} onPress={() => setSelectedMaterial(null)}>
                                        <Text style={styles.clearMaterialText}>Use manual text input instead</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.generateButton, loading && styles.disabledButton]}
                                    onPress={handleAIAction}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.generateButtonText}>Generate {activeTab.toUpperCase()}</Text>
                                            <Sparkles size={18} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </RNView>
                        )}
                    </>
                ) : currentStep === 'active_quiz' ? (
                    renderQuizStep()
                ) : (
                    renderResultStep()
                )}
            </ScrollView>

            <RNView style={styles.creditsBar}>
                <RNView style={styles.creditInfo}>
                    <Zap size={16} color="#FBBF24" fill="#FBBF24" />
                    <Text style={styles.creditText}>{balance} AI Credits Remaining</Text>
                </RNView>
                <TouchableOpacity onPress={() => router.push('/payment')}>
                    <Text style={styles.topUpLink}>Top Up</Text>
                </TouchableOpacity>
            </RNView>
        </View>
    );
}

const markdownStyles: any = {
    body: {
        fontSize: 15,
        lineHeight: 24,
        color: '#334155',
        fontWeight: '500' as const,
    },
    heading1: { fontSize: 24, fontWeight: '900' as const, color: '#0F172A', marginBottom: 10 },
    heading2: { fontSize: 20, fontWeight: '800' as const, color: '#1E293B', marginTop: 15, marginBottom: 8 },
    strong: { fontWeight: '800' as const, color: '#2563EB' },
    bullet_list: { marginBottom: 10 },
    list_item: { marginBottom: 5 },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 12,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    formContainer: {
        gap: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 20,
        fontSize: 16,
        color: '#0f172a',
        minHeight: 180,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    ocrButtonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    ocrBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingVertical: 12,
        borderRadius: 14,
        gap: 8,
    },
    ocrBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    scanningOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    scanningText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2563EB',
    },
    generateButton: {
        backgroundColor: '#2563EB',
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#94a3b8',
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    materialsList: {
        gap: 12,
    },
    materialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 14,
    },
    selectedMaterialCard: {
        borderColor: '#2563EB',
        backgroundColor: '#F0F9FF',
    },
    materialIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialInfo: {
        flex: 1,
    },
    materialTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    materialType: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    clearMaterial: {
        alignSelf: 'center',
    },
    clearMaterialText: {
        color: '#2563EB',
        fontWeight: '700',
        fontSize: 13,
    },
    materialPrompt: {
        backgroundColor: '#F5F3FF',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#DDD6FE',
        marginTop: 10,
    },
    promptText: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    quizContainer: {
        gap: 15,
    },
    quizHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    quizProgress: {
        fontSize: 14,
        fontWeight: '800',
        color: '#64748B',
    },
    quizScoreBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    quizScoreText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#166534',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: 28,
        marginBottom: 10,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        gap: 14,
    },
    selectedOption: {
        borderColor: '#2563EB',
        backgroundColor: '#F0F9FF',
    },
    correctOption: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    wrongOption: {
        borderColor: '#F43F5E',
        backgroundColor: '#FFF1F2',
    },
    optionCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCircle: {
        borderColor: '#2563EB',
    },
    innerCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2563EB',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    actionBtn: {
        backgroundColor: '#0F172A',
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
    },
    disabledBtn: {
        opacity: 0.5,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    explanationCard: {
        backgroundColor: '#EFF6FF',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563EB',
    },
    explanationText: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
        fontWeight: '600',
    },
    resultContainer: {
        alignItems: 'center',
        padding: 20,
    },
    trophyContainer: {
        marginBottom: 20,
    },
    trophyCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 10,
    },
    resultScoreText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '600',
    },
    resultPercentage: {
        fontSize: 60,
        fontWeight: '900',
        color: '#2563EB',
        marginVertical: 20,
    },
    aiResultContainer: {
        gap: 20,
    },
    aiResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    aiResultTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
    },
    aiResultScroll: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        maxHeight: 400,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    aiResultText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#334155',
        fontWeight: '500',
    },
    creditsBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 18,
    },
    creditInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    creditText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    topUpLink: {
        color: '#60a5fa',
        fontWeight: '800',
        fontSize: 14,
    }
});
