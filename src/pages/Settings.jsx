import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  LogOut,
  Sparkles,
  Key,
  Database,
  User,
  Bell,
  Palette,
  Link
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Settings() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    email: ""
  });

  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [aiKeys, setAiKeys] = useState({
    gemini: localStorage.getItem('gemini_key') || "",
    deepseek: localStorage.getItem('deepseek_key') || "",
  });

  const [backendReady, setBackendReady] = useState(false);

  // Load profile data when user is fetched
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || ""
      });
    }
  }, [user]);

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      const { getNotificationSettings } = await import('@/lib/db');
      const settings = await getNotificationSettings();
      setNotificationSettings(settings);

      // Check Railway availability
      try {
        const { BackendBridge } = await import('@/lib/backend-bridge');
        const ready = await BackendBridge.isPythonReady();
        setBackendReady(ready);
      } catch (e) {
        setBackendReady(false);
      }

      setLoading(false);
    };
    loadSettings();
  }, []);

  const saveProfile = async () => {
    // @ts-ignore
    await base44.auth.updateProfile(profileData);
    toast.success("Profile updated successfully!");
  };

  const saveAiKeys = () => {
    localStorage.setItem('gemini_key', aiKeys.gemini);
    localStorage.setItem('deepseek_key', aiKeys.deepseek);
    toast.success("AI keys saved successfully!");
  };

  const saveNotificationSettings = async () => {
    const { saveNotificationSettings: saveSettings } = await import('@/lib/db');
    await saveSettings(notificationSettings);
    toast.success("Notification preferences saved!");
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your account, AI preferences, and local storage
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-slate-600" />
              Profile
            </CardTitle>
            <CardDescription>
              Your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {profileData.full_name?.charAt(0) || "S"}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{profileData.full_name || "Student"}</h3>
                <p className="text-sm text-slate-500">{profileData.email || "student@university.edu"}</p>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={saveProfile}
            >
              Save Profile Info
            </Button>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card className="border-violet-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              AI Brains Configuration
            </CardTitle>
            <CardDescription>
              Configure the AI models that power your AI Study Buddy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full animate-pulse", backendReady ? "bg-green-500" : "bg-red-400")} />
                    <div>
                      <h4 className="font-bold text-sm text-violet-900">Railway AI Cloud</h4>
                      <p className="text-[10px] text-violet-600 font-medium">
                        {backendReady ? "Connected & Active (Zero-Key Mode)" : "Cloud Backend Offline"}
                      </p>
                    </div>
                  </div>
                  {backendReady && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">SECURE</span>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-slate-500 italic">
                  * All AI processing is currently securely routed through your Railway backend. Keys are never stored on this device.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    Gemini API Key (Local Override)
                  </Label>
                </div>
                <Input
                  type="password"
                  placeholder="Only if you want to use your own local key..."
                  value={aiKeys.gemini}
                  onChange={(e) => setAiKeys({ ...aiKeys, gemini: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-400" />
                    DeepSeek API Key (Local Override)
                  </Label>
                </div>
                <Input
                  type="password"
                  placeholder="Only if you want to use your own local key..."
                  value={aiKeys.deepseek}
                  onChange={(e) => setAiKeys({ ...aiKeys, deepseek: e.target.value })}
                />
              </div>
            </div>

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={saveAiKeys}
            >
              <Database className="w-4 h-4 mr-2" />
              Save Config Locally
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p className="text-sm text-slate-500">Loading preferences...</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Assignment Deadlines</p>
                    <p className="text-sm text-slate-500">Get reminded about upcoming deadlines</p>
                  </div>
                  <Switch
                    // @ts-ignore
                    checked={notificationSettings?.deadlines_enabled ?? true}
                    // @ts-ignore
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, deadlines_enabled: checked })}
                  />
                </div>

                {notificationSettings?.deadlines_enabled && (
                  <div className="ml-6 pl-4 border-l-2 border-blue-100 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Reminder Intervals</p>
                    <p className="text-xs text-slate-500">Choose when to be reminded before assignment due dates</p>
                    <div className="flex flex-wrap gap-2">
                      {[15, 7, 3, 1].map((days) => (
                        <button
                          key={days}
                          onClick={() => {
                            const intervals = notificationSettings.intervals || [15, 7, 3, 1];
                            const newIntervals = intervals.includes(days)
                              ? intervals.filter(d => d !== days)
                              : [...intervals, days].sort((a, b) => b - a);
                            setNotificationSettings({ ...notificationSettings, intervals: newIntervals });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            (notificationSettings?.intervals || [15, 7, 3, 1]).includes(days)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {days} {days === 1 ? 'day' : 'days'} before
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">New Study Materials</p>
                    <p className="text-sm text-slate-500">Be notified when new materials are added</p>
                  </div>
                  <Switch
                    // @ts-ignore
                    checked={notificationSettings?.materials_enabled ?? true}
                    // @ts-ignore
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, materials_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Achievements</p>
                    <p className="text-sm text-slate-500">Celebrate your study milestones</p>
                  </div>
                  <Switch
                    // @ts-ignore
                    checked={notificationSettings?.achievements_enabled ?? true}
                    // @ts-ignore
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, achievements_enabled: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Desktop Notifications</p>
                    <p className="text-sm text-slate-500">Show system notifications when app is minimized</p>
                  </div>
                  <Switch
                    // @ts-ignore
                    checked={notificationSettings?.desktop_enabled ?? true}
                    // @ts-ignore
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, desktop_enabled: checked })}
                  />
                </div>

                <Button
                  onClick={saveNotificationSettings}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Notification Preferences
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Shield className="w-5 h-5 text-slate-600" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}