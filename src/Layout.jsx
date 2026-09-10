import React, { useState } from "react";
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
  ShieldCheck,
  Library,
  GraduationCap,
  ClipboardList,
  Users
} from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const namingPref = localStorage.getItem('naming_pref') || 'Modules';
  const navigation = getNavigation(isAdmin, namingPref);

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
        <header className="hidden lg:flex h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-[90] items-center justify-between px-6 xl:px-10 flex-shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 mr-4">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-black text-lg tracking-tight">STUDY BUDDY</span>
            </div>

            <div className="flex items-center gap-1 xl:gap-2 overflow-x-auto no-scrollbar max-w-[min(720px,50vw)]">
              <Link to={createPageUrl("Dashboard")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "Dashboard" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>Feed</Link>
              <Link to={createPageUrl("Modules")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "Modules" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>{namingPref}</Link>
              <Link to={createPageUrl("AutoOrganizer")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "AutoOrganizer" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>Organizer</Link>
              <Link to={createPageUrl("Assignments")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "Assignments" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>Tasks</Link>
              <Link to={createPageUrl("StudyLab")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "StudyLab" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>Lab</Link>
              {isAdmin && (
                <Link to={createPageUrl("Monitoring")} className={cn("whitespace-nowrap px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors", currentPageName === "Monitoring" ? "text-indigo-700 bg-indigo-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>Admin</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
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

        {/* Mobile Header - Visible on lg and below */}
        <header className="lg:hidden h-14 sm:h-16 glass-sidebar border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 pt-[env(safe-area-inset-top)]">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Open menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <img src={logo} alt="Study Buddy" className="w-7 h-7 object-contain" />
            <span className="font-black text-sm tracking-tight text-slate-900">STUDY BUDDY</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
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
        <div className="flex-1 overflow-y-auto pencil-scroll scroll-smooth scroll-pt-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 pb-28 lg:pb-10">
          <div className="w-full max-w-screen-2xl mx-auto min-h-[calc(100vh-12rem)]">
            {children}
          </div>

          <footer className="mt-12 sm:mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest pb-4 lg:pb-6">
            <div className="flex items-center gap-4">
              <span>(c) 2026 Nabster Tsr</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://buymeacoffee.com/nabstertsr" target="_blank" rel="noopener noreferrer" className="hover:text-amber-700 transition-colors">Support</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            </div>
          </footer>
        </div>

        {/* Global Footer / Status Bar */}
        <footer className="hidden lg:flex w-full bg-white border-t border-slate-200 p-3 flex-shrink-0 z-40">
          <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">
            <div className="flex items-center gap-4">
              <span>(c) 2026 Nabster Tsr</span>
              <span className="text-emerald-500">System Active</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">Powered by AI</span>
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

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[70] bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-16">
            {[
              { name: "Feed", page: "Dashboard", icon: LayoutDashboard },
              { name: namingPref === "Subjects" ? "Subjects" : "Modules", page: "Modules", icon: BookOpen },
              { name: "Lab", page: "StudyLab", icon: Brain },
              { name: "Tasks", page: "Assignments", icon: ClipboardList },
              { name: "More", page: "__more__", icon: Menu },
            ].map((item) => {
              const active = item.page !== "__more__" && currentPageName === item.page;
              if (item.page === "__more__") {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 hover:text-slate-900"
                  >
                    <Menu className="w-5 h-5" />
                    <span>More</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
                    active ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", active && "text-indigo-600")} />
                  <span className="truncate max-w-[4.5rem]">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}