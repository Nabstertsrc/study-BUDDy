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

export default function MonitoringDashboard() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState("online");
    const [stats, setStats] = useState({
        totalInteractions: 0,
        uniquePages: 0,
        aiCalls: 0,
        uptime: "99.9%"
    });

    const refreshLogs = async () => {
        setLoading(true);
        try {
            const allActivities = await base44.entities.LearningActivity.list('-created_date', 50);
            setLogs(allActivities);

            // Calculate stats
            const aiCallsCount = allActivities.filter(l => l.activity_type?.includes('ai') || l.activity_type?.includes('generation')).length;
            const uniquePages = new Set(allActivities.filter(l => l.activity_type === 'page_render').map(l => l.topic)).size;

            setStats({
                totalInteractions: allActivities.length,
                uniquePages: uniquePages,
                aiCalls: aiCallsCount,
                uptime: "Active"
            });
        } catch (err) {
            console.error("Failed to load audit logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshLogs();
        const interval = setInterval(refreshLogs, 10000);
        return () => clearInterval(interval);
    }, []);

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
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">Latency</span>
                        </div>
                        <h4 className="text-3xl font-black text-white">{stats.uptime}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">System State</p>
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
