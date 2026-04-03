import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Settings,
  Menu,
  X,
  Layers,
  Zap,
  Wallet,
  PlusCircle,
  ShieldCheck,
  Library,
  GraduationCap,
  ClipboardList,
  Users
} from "lucide-react";
import { localApi } from "@/api/localApi";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";

const getNavigation = (isAdmin, namingPref) => [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: namingPref === 'Subjects' ? 'Subjects' : 'Modules', icon: BookOpen, page: "Modules" },
  { name: "Organizer", icon: Layers, page: "AutoOrganizer" },
  { name: "Study Lab", icon: Brain, page: "StudyLab" },
  ...(isAdmin ? [{ name: "Registry", icon: ShieldCheck, page: "Monitoring" }] : []),
  { name: "Learning", icon: GraduationCap, page: "LearningPath" },
  { name: "Books", icon: Library, page: "PrescribedBooks" },
  { name: "Assignments", icon: ClipboardList, page: "Assignments" },
  { name: "Community", icon: Users, page: "CommunityHub" },
];

export default function Layout({ children, currentPageName }) {
  const { user, isAdmin, userProfile, logout, sendVerification } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const namingPref = localStorage.getItem('naming_pref') || 'Modules';
  const navigation = getNavigation(isAdmin, namingPref);

  useEffect(() => {
    localApi.wallet.getBalance().then(setBalance);
    const interval = setInterval(() => {
      localApi.wallet.getBalance().then(setBalance);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <style>{`
        .glass-sidebar {
          backdrop-filter: blur(25px);
          background: rgba(255, 255, 255, 0.9);
        }
        .gradient-border {
          border-image: linear-gradient(135deg, #3b82f633 0%, #8b5cf633 100%) 1;
        }
        .active-link {
          background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Main Container */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative w-full">
        {/* Main Desktop Header - Responsive */}
        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[90] items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 mr-4">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-black text-lg tracking-tight">STUDY BUDDY</span>
            </div>

            <div className="flex items-center gap-6">
              <Link to={createPageUrl("Dashboard")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "Dashboard" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>Feed</Link>
              <Link to={createPageUrl("Modules")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "Modules" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>{namingPref}</Link>
              <Link to={createPageUrl("AutoOrganizer")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "AutoOrganizer" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>Organizer</Link>
              <Link to={createPageUrl("Assignments")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "Assignments" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>Tasks</Link>
              <Link to={createPageUrl("StudyLab")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "StudyLab" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>Lab</Link>
              {isAdmin && (
                <Link to={createPageUrl("Monitoring")} className={cn("text-xs font-black uppercase tracking-widest transition-colors", currentPageName === "Monitoring" ? "text-slate-900 underline underline-offset-8 decoration-4 decoration-indigo-600" : "text-slate-500 hover:text-slate-900")}>Admin</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-900 text-white rounded-2xl shadow-lg">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-black tracking-tighter">{balance} <span className="text-[8px] opacity-70">CREDITS</span></span>
              <Link to={createPageUrl("Payment")} className="ml-2 hover:scale-110 transition-transform"><PlusCircle className="w-4 h-4 text-emerald-400" /></Link>
            </div>
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      {userProfile?.role || 'Learner'} {user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium truncate">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Settings")} className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile Header Toggle - Visible on lg and below */}
        <header className="lg:hidden h-16 glass-sidebar border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-6 h-6 text-black" />}
          </button>
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-slate-900">{balance}</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">S</div>
          </div>
        </header>

        {/* Email Verification Banner */}
        <AnimatePresence>
          {!user?.emailVerified && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500 text-white px-6 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-[100]"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification required for cloud sync</span>
              </div>
              <button
                onClick={async () => {
                  const result = await sendVerification();
                  const { toast } = await import('sonner');
                  if (result.success) {
                    toast.success("Verification email sent!");
                  } else {
                    toast.error(result.message || "Failed to send verification email.");
                  }
                }}
                className="bg-white/20 hover:bg-white/40 px-3 py-1 rounded-lg transition-all border border-white/30"
              >
                Resend Link
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pencil-scroll scroll-smooth p-6 xl:p-10">
          <div className="w-full min-h-[calc(100vh-200px)]">
            {children}
          </div>

          <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-10">
            <div className="flex items-center gap-4">
              <span>© 2026 Nabster Tsr</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Professional Tier</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
              <Link to={createPageUrl("Payment")} className="text-blue-600 hover:text-blue-700 font-black">Upgrade Now</Link>
            </div>
          </footer>
        </div>

        {/* Global Footer / Status Bar */}
        <footer className="w-full bg-white border-t border-slate-200 p-4 flex-shrink-0 z-40">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">
            <div className="flex items-center gap-4">
              <span>© 2026 Nabster Tsr</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> System Active</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-bold ${balance === 0 ? 'text-red-400' : balance <= 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                {balance === 0 ? '⚠ 0 Credits' : balance <= 3 ? `⚡ ${balance} Credits` : `${balance} Credits`}
              </span>
              <Link to={createPageUrl("Payment")} className="text-blue-600 hover:underline">Top Up</Link>
            </div>
          </div>
        </footer>

        {/* Mobile Navigation Drawer - Visible on lg and below */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-[60] flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col"
              >
                <div className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                    <span className="font-black text-xl tracking-tight">STUDY BUDDY</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-xl bg-slate-100"><X className="w-5 h-5" /></button>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-black transition-all",
                        currentPageName === item.page ? "active-link text-white shadow-lg" : "text-black hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("w-6 h-6", currentPageName === item.page ? "text-blue-400" : "text-black")} />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}