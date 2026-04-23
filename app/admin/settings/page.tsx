"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAuditAction } from "@/lib/db";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface GlobalSettings {
  maintenanceMode: boolean;
  freeTierLimit: number;
  announcementBanner: string;
}

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    maintenanceMode: false,
    freeTierLimit: 2,
    announcementBanner: ""
  });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    
    if (user) {
      const init = async () => {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().isAdmin) {
          setIsAdmin(true);
          fetchSettings();
        } else {
          router.push("/dashboard");
        }
      };
      init();
    }
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "global"));
      if (snap.exists()) {
        setSettings({ ...settings, ...snap.data() } as GlobalSettings);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings, { merge: true });
      if (user) await logAuditAction(user.uid, user.email || "Unknown", "UPDATE_SETTINGS", `Updated global platform settings`);
      toast.success("Settings saved successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, label: "Overview", id: "overview", onClick: () => router.push("/admin") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, label: "Users", id: "users", onClick: () => router.push("/admin/users") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: "Revenue", id: "revenue", onClick: () => router.push("/admin/revenue") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: "Audit Log", id: "audit-log", onClick: () => router.push("/admin/audit-log") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: "Settings", id: "settings", onClick: () => router.push("/admin/settings") },
  ];

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="flex min-h-screen bg-[#080b0f]">
        <Sidebar navItems={navItems} activeItem="settings" onNavChange={() => {}} variant="admin" />
        <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6 flex items-center justify-center">
          <div className="animate-pulse text-cyber-muted">Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080b0f]">
      <Sidebar navItems={navItems} activeItem="settings" onNavChange={() => {}} variant="admin" />
      <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8 max-w-4xl"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Platform Settings</h1>
              <p className="text-sm text-cyber-muted">Global configuration for VulnAI.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-cyber-cyan text-cyber-bg font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Access Control</h3>
              <div className="flex items-center justify-between p-4 bg-cyber-bg border border-cyber-border rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Maintenance Mode</p>
                  <p className="text-cyber-muted text-xs mt-1">When enabled, all non-admin users will be blocked from accessing the platform.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} />
                  <div className="w-11 h-6 bg-cyber-bg border border-cyber-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cyber-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-red peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider pt-4 border-t border-cyber-border/50">Usage Limits</h3>
              <div className="p-4 bg-cyber-bg border border-cyber-border rounded-lg space-y-3">
                <label className="block text-white font-medium text-sm">Free Tier Daily Scan Limit</label>
                <p className="text-cyber-muted text-xs mb-3">Number of free vulnerability reports a Hacker-tier user can generate per day.</p>
                <input 
                  type="number" 
                  min={0}
                  value={settings.freeTierLimit} 
                  onChange={(e) => setSettings({...settings, freeTierLimit: parseInt(e.target.value) || 0})}
                  className="w-full max-w-[200px] bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyber-cyan focus:outline-none transition-colors font-mono" 
                />
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider pt-4 border-t border-cyber-border/50">Announcements</h3>
              <div className="p-4 bg-cyber-bg border border-cyber-border rounded-lg space-y-3">
                <label className="block text-white font-medium text-sm">Global Announcement Banner</label>
                <p className="text-cyber-muted text-xs mb-3">Text displayed across the top of the dashboard for all users. Leave empty to hide.</p>
                <input 
                  type="text" 
                  placeholder="e.g., Scheduled maintenance tonight at 2 AM UTC"
                  value={settings.announcementBanner} 
                  onChange={(e) => setSettings({...settings, announcementBanner: e.target.value})}
                  className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-2.5 text-sm text-white focus:border-cyber-cyan focus:outline-none transition-colors" 
                />
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
