import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
    Activity,
    MousePointer2,
    Zap,
    ShieldCheck,
    Clock,
    RefreshCw,
    UserCheck,
    BarChart3,
    Terminal,
    Search
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { Users } from "lucide-react";

export default function MonitoringDashboard() {
    const { isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [featureStats, setFeatureStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState("online");
    const [stats, setStats] = useState({
        totalInteractions: 0,
        uniquePages: 0,
        aiCalls: 0,
        totalUsers: 0
    });

    const refreshLogs = async () => {
        setLoading(true);
        try {
            const { db: firestoreDB } = await import('@/lib/firebase');
            const { collection, getDocs, limit, orderBy: fsOrderBy, query } = await import('firebase/firestore');

            // 1. Fetch Users
            const usersRef = collection(firestoreDB, 'admin', 'registry', 'users');
            const usersSnap = await getDocs(query(usersRef, limit(20)));
            const usersList = [];
            usersSnap.forEach(doc => usersList.push({ id: doc.id, ...doc.data() }));
            setRegisteredUsers(usersList);

            // 2. Fetch Feature Analytics
            const featuresRef = collection(firestoreDB, 'admin', 'analytics', 'features');
            const featuresSnap = await getDocs(featuresRef);
            const featuresList = [];
            featuresSnap.forEach(doc => featuresList.push({ id: doc.id, ...doc.data() }));
            setFeatureStats(featuresList.sort((a, b) => (b.count || 0) - (a.count || 0)));

            // 3. Current User Logs (Local fallback)
            const allActivities = await base44.entities.LearningActivity.list('-created_date', 50);
            setLogs(allActivities);

            setStats({
                totalInteractions: allActivities.length,
                uniquePages: new Set(allActivities.map(l => l.topic)).size,
                aiCalls: allActivities.filter(l => l.activity_type?.includes('ai')).length,
                totalUsers: usersList.length
            });
        } catch (err) {
            console.error("Failed to load admin metrics:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        refreshLogs();
        const interval = setInterval(refreshLogs, 20000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    if (!isAdmin) return <Navigate to="/Dashboard" />;

    const getInteractionIcon = (type) => {
        switch (type) {
            case 'page_render': return <Terminal className="w-4 h-4 text-blue-500" />;
            case 'ai_generate': return <Zap className="w-4 h-4 text-amber-500" />;
            case 'click': return <MousePointer2 className="w-4 h-4 text-emerald-500" />;
            default: return <Activity className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-indigo-600" />
                        Interaction Auditor
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Real-time System Monitoring Active
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Credits Mode</span>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black">UNLIMITED ELITE</Badge>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={refreshLogs}
                        disabled={loading}
                        className="rounded-xl border-2 h-12 w-12"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Live Feed</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900">{stats.totalInteractions}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Captured Logs</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Zap className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Engine</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900">{stats.aiCalls}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">AI Deductions</p>
                    </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Coverage</span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900">{stats.uniquePages}</h4>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Active Modules</p>
                    </CardContent>
                </Card>

                <Card className="border-2 bg-slate-900 text-white shadow-xl shadow-indigo-900/10 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Registry</span>
                        </div>
                        <h4 className="text-3xl font-black text-white">{stats.totalUsers}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Total Registered</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registered Users Table */}
                <Card className="border-2 border-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
                    <CardHeader className="p-8 border-b border-slate-800">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-400" />
                            User Directory
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-800/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-black uppercase text-[10px] text-slate-500">Email</th>
                                        <th className="px-6 py-3 text-left font-black uppercase text-[10px] text-slate-500">Role</th>
                                        <th className="px-6 py-3 text-right font-black uppercase text-[10px] text-slate-500">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registeredUsers.map(u => (
                                        <tr key={u.uid} className="border-b border-slate-800 hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-bold truncate max-w-[150px]">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-indigo-600/20 text-indigo-400 border-none">{u.role || 'Scholar'}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[10px] text-slate-500 font-mono">
                                                {u.last_seen ? format(new Date(u.last_seen), "MMM dd") : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Usage Stats */}
                <Card className="border-2 border-slate-100 shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Feature Popularity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {featureStats.map(f => (
                            <div key={f.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-tight">
                                    <span>{f.id.replace(/_/g, ' ')}</span>
                                    <span className="text-indigo-600">{f.count} calls</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (f.count / (stats.totalInteractions || 1)) * 100)}%` }}
                                        className="h-full bg-indigo-600"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Audit Log Table */}
            <Card className="border-2 border-slate-100 shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <Search className="w-6 h-6 text-slate-400" />
                                Activity Audit Trail
                            </CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                                Every interaction is captured and verified
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                            Last 50 Events
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Type</th>
                                    <th className="px-4 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Entity / Page</th>
                                    <th className="px-4 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500">Timestamp</th>
                                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500 text-right">Audit ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {logs.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group hover:bg-slate-50/50 border-b border-slate-50 last:border-none transition-colors"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        {getInteractionIcon(log.activity_type)}
                                                    </div>
                                                    <span className="font-bold text-slate-900 text-sm capitalize">
                                                        {(log.activity_type || 'system').replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                    {log.topic || "Unknown Page"}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {format(new Date(log.created_date), "HH:mm:ss")}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {format(new Date(log.created_date), "MMM dd, yyyy")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-right px-8">
                                                <code className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-400 uppercase tracking-tighter">
                                                    AUD-{log.id || 'N/A'}
                                                </code>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <Activity className="w-12 h-12" />
                                                <p className="font-black uppercase tracking-widest text-xs">No interactions documented yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Footer Status */}
            <div className="bg-indigo-600 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                <div className="absolute top-0 right-0 p-20 opacity-10 -rotate-12 translate-x-10 -translate-y-10 group-hover:rotate-0 transition-transform duration-700">
                    <ShieldCheck className="w-64 h-64" />
                </div>
                <div className="relative">
                    <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-amber-400 fill-current" />
                        Interaction Engine V3.0
                    </h3>
                    <p className="text-indigo-100 font-bold max-w-2xl text-sm leading-relaxed">
                        The auditor captures high-precision forensic data of all platform usage.
                        In unlimited mode, we track logic flows rather than credit depletion to maintain system integrity.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-8">
                        {['Force Sync', 'Purge Audit', 'Export Log'].map(action => (
                            <Button
                                key={action}
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-indigo-600 rounded-xl font-bold uppercase text-[10px] tracking-widest h-10 px-6 transition-all"
                            >
                                {action}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
