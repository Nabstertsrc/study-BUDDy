import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Clock,
  Bell,
  Brain,
  FileText,
  Sparkles,
  ChevronRight,
  Calendar,
  AlertCircle,
  BookOpen
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWalletStore } from '@/stores/wallet-store';
import { databaseService, AIGeneratedContent, Assignment } from '@/services/database-service';

const { width } = Dimensions.get('window');

export default function AcademiaDashboard() {
  const router = useRouter();
  const { balance, init } = useWalletStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({ modules: 0, recommendations: 4 });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    init();
    loadStats();
    loadAssignments();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const loadStats = async () => {
    const modules = await databaseService.getModules();
    setCounts(prev => ({ ...prev, modules: modules.length }));
  };

  const loadAssignments = async () => {
    const data = await databaseService.getAssignments();
    setAssignments(data.slice(0, 4)); // Show top 4 deadlines
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>Academia AI</Text>
          <Text style={styles.tagline}>Local-First Learning</Text>
        </View>
        <RNView style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.userSection}>
            <View>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.readyText}>Ready to learn?</Text>
            </View>
            <RNView style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </RNView>
          </View>
        </RNView>
      </View>

      {/* QUICK STATUS WIDGETS */}
      <View style={styles.statusGrid}>
        <RNView style={[styles.statusItem, { backgroundColor: '#2563EB' }]}>
          <Text style={styles.statusLabel}>Active courses</Text>
        </RNView>
        <RNView style={[styles.statusItem, { backgroundColor: '#F97316' }]}>
          <Text style={styles.statusLabel}>Due soon</Text>
        </RNView>
        <RNView style={[styles.statusItem, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' }]}>
          <Text style={[styles.statusLabel, { color: '#64748b' }]}>Active recall practice</Text>
        </RNView>
      </View>

      <View style={styles.mainLayout}>
        {/* UPCOMING DEADLINES WIDGET */}
        <View style={styles.deadlineCard}>
          <RNView style={styles.cardHeader}>
            <RNView style={styles.headerIconContainer}>
              <Calendar size={18} color="#E11D48" />
            </RNView>
            <RNView>
              <Text style={styles.cardTitle}>Upcoming Deadlines</Text>
              <Text style={styles.cardSubtitle}>{assignments.length} pending</Text>
            </RNView>
          </RNView>

          <RNView style={styles.deadlineList}>
            {assignments.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming deadlines found.</Text>
            ) : assignments.map((a, i) => (
              <RNView key={a.id} style={[styles.deadlineItem, i === 0 && { borderTopWidth: 0 }]}>
                <RNView style={styles.deadlineMain}>
                  <RNView style={styles.statusDot} />
                  <RNView>
                    <Text style={styles.deadlineTitle}>{a.title}</Text>
                    <Text style={styles.deadlineCode}>{a.module_id}</Text>
                  </RNView>
                </RNView>
                <RNView style={styles.deadlineMeta}>
                  <RNView style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>in 20 days</Text>
                  </RNView>
                  <Text style={styles.deadlineDate}>{new Date(a.due_date).toLocaleDateString()}</Text>
                </RNView>
              </RNView>
            ))}
          </RNView>
        </View>

        {/* AI STUDY TOOLS SIDEBAR CLONE */}
        <View style={styles.toolsCard}>
          <RNView style={styles.cardHeader}>
            <RNView style={[styles.headerIconContainer, { backgroundColor: '#f5f3ff' }]}>
              <Sparkles size={18} color="#8B5CF6" />
            </RNView>
            <RNView>
              <Text style={styles.cardTitle}>AI Study Tools</Text>
              <Text style={styles.cardSubtitle}>Quick access to learning</Text>
            </RNView>
          </RNView>

          <RNView style={styles.aiToolsList}>
            {[
              { title: 'Generate Quiz', icon: Brain, color: '#8B5CF6', path: '/study?tab=quiz' },
              { title: 'Summary Notes', icon: FileText, color: '#3B82F6', path: '/study?tab=notes' },
              { title: 'Deep Dive', icon: Sparkles, color: '#10B981', path: '/study?tab=deepdive' }
            ].map((tool, i) => (
              <TouchableOpacity key={i} style={styles.toolItem} onPress={() => router.push(tool.path as any)}>
                <RNView style={[styles.toolIcon, { backgroundColor: tool.color + '15' }]}>
                  <tool.icon size={24} color={tool.color} />
                </RNView>
                <Text style={styles.toolName}>{tool.title}</Text>
                <ChevronRight size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </RNView>
        </View>
      </View>

      {/* PREMIUM STATUS CARD */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.premiumCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <RNView style={styles.premiumHeader}>
          <RNView style={styles.premiumBadge}>
            <Zap size={12} color="#fff" fill="#fff" />
          </RNView>
          <Text style={styles.premiumLabel}>PREMIUM STATUS</Text>
        </RNView>
        <Text style={styles.premiumBalance}>{balance}</Text>
        <Text style={styles.premiumSubtitle}>AVAILABLE CREDITS</Text>

        <RNView style={styles.premiumActions}>
          <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/payment')}>
            <Zap size={14} color="#fff" fill="#fff" />
            <Text style={styles.topUpBtnText}>TOP UP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.studyLabBtn} onPress={() => router.push('/study')}>
            <ShieldCheck size={14} color="#fff" />
            <Text style={styles.studyLabBtnText}>STUDY LAB</Text>
          </TouchableOpacity>
        </RNView>
      </LinearGradient>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconBtn: {
    padding: 8,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'right',
  },
  readyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'right',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statusItem: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'flex-end',
  },
  statusLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  mainLayout: {
    paddingHorizontal: 20,
    gap: 20,
  },
  deadlineCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  deadlineList: {
    gap: 0,
  },
  deadlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deadlineMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  deadlineCode: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  deadlineMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeBadge: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  deadlineDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  toolsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiToolsList: {
    gap: 12,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  premiumCard: {
    margin: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  premiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  premiumBalance: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 20,
  },
  premiumActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  topUpBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topUpBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  studyLabBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  studyLabBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  }
});
