"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { checkCanGenerateReport, getAllUsers, toggleProStatus, getAllReportsAdmin, UserProfile, SavedReport } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";

type AdminUser = UserProfile & { id: string };

const NAV_ICONS = {
  overview: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  logs: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [globalReports, setGlobalReports] = useState<SavedReport[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { icon: NAV_ICONS.overview, label: "Overview", id: "overview" },
    { icon: NAV_ICONS.users, label: "User Directory", id: "users" },
    { icon: NAV_ICONS.logs, label: "Scan Logs", id: "logs" },
    { icon: NAV_ICONS.settings, label: "Platform Settings", id: "settings" },
  ];

  useEffect(() => {
    async function init() {
      if (authLoading) return;
      if (!user) { router.push("/login"); return; }
      try {
        const stats = await checkCanGenerateReport(user.uid, user.email || undefined);
        if (!stats.isAdmin) { toast.error("Unauthorized."); router.push("/dashboard"); return; }
        setIsAdmin(true);
        const [u, r] = await Promise.all([getAllUsers(), getAllReportsAdmin()]);
        setUsersList(u); setGlobalReports(r);
      } catch { router.push("/dashboard"); }
      finally { setLoading(false); }
    }
    init();
  }, [user, authLoading, router]);

  const handleTogglePro = async (uid: string, current: boolean) => {
    try {
      await toggleProStatus(uid, current);
      toast.success(`User is now ${current ? "Free" : "Pro"}`);
      setUsersList(p => p.map(u => u.id === uid ? { ...u, isPro: !current } : u));
    } catch { toast.error("Failed"); }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="text-cyber-red font-mono animate-pulse text-sm">Verifying admin credentials...</div>
    </div>
  );
  if (!isAdmin) return null;

  const filteredUsers = searchQuery
    ? usersList.filter(u => (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()))
    : usersList;

  const totalReportsToday = usersList.reduce((a, u) => a + u.reportsGeneratedToday, 0);
  const proCount = usersList.filter(u => u.isPro).length;
  const freeCount = usersList.length - proCount;

  // ─── RENDER SECTIONS ─────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Control Panel</h1>
        <p className="text-sm text-cyber-muted">Platform-wide metrics and management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Users", value: usersList.length, color: "#00d4ff", icon: "👥" },
          { label: "Pro Subscribers", value: proCount, color: "#e3b341", icon: "⭐" },
          { label: "Free Users", value: freeCount, color: "#8b949e", icon: "🆓" },
          { label: "Reports Today", value: totalReportsToday, color: "#3fb950", icon: "📊" },
        ].map((s) => (
          <div key={s.label} className="bg-cyber-card border border-cyber-border rounded-xl p-5 hover:border-cyber-red/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-3xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Platform Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-xs text-cyber-muted">Total Reports Generated</span>
              <span className="text-sm font-mono text-cyber-cyan font-bold">{globalReports.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-xs text-cyber-muted">Admin Accounts</span>
              <span className="text-sm font-mono text-cyber-red font-bold">{usersList.filter(u => u.isAdmin).length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-cyber-border">
              <span className="text-xs text-cyber-muted">Conversion Rate (Free → Pro)</span>
              <span className="text-sm font-mono text-cyber-orange font-bold">
                {usersList.length > 0 ? Math.round((proCount / usersList.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-cyber-muted">Avg Reports / User</span>
              <span className="text-sm font-mono text-cyber-green font-bold">
                {usersList.length > 0 ? (globalReports.length / usersList.length).toFixed(1) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Scans</h3>
          <div className="space-y-2">
            {globalReports.length === 0 ? (
              <p className="text-sm text-cyber-muted text-center py-4">No scans yet.</p>
            ) : globalReports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-cyber-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-1.5 py-0.5 rounded text-[9px] font-bold">{r.scanType}</span>
                  <span className="text-[10px] text-cyber-muted font-mono truncate max-w-[150px]">{r.scanInputSnippet}</span>
                </div>
                <span className="text-[9px] text-cyber-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Directory</h1>
          <p className="text-sm text-cyber-muted">{usersList.length} registered users</p>
        </div>
        <input
          type="text" placeholder="Search by email..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2 text-sm text-cyber-text focus:border-cyber-red focus:outline-none w-full sm:w-64 transition-colors"
        />
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0d12] text-cyber-muted text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Reports Today</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-cyber-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-red to-cyber-orange flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {(u.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-cyber-text">{u.email || "Unknown"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isAdmin
                      ? <span className="text-cyber-red font-bold text-[10px] uppercase tracking-widest bg-cyber-red/10 border border-cyber-red/20 px-2 py-1 rounded">Admin</span>
                      : <span className="text-cyber-muted text-[10px] uppercase tracking-widest">User</span>}
                  </td>
                  <td className="px-6 py-4">
                    {u.isPro
                      ? <span className="text-cyber-orange font-bold text-[10px] uppercase tracking-widest bg-cyber-orange/10 border border-cyber-orange/20 px-2 py-1 rounded">Pro</span>
                      : <span className="text-cyber-muted text-[10px] uppercase tracking-widest bg-cyber-bg border border-cyber-border px-2 py-1 rounded">Free</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-cyber-green text-sm">{u.reportsGeneratedToday}</td>
                  <td className="px-6 py-4">
                    {!u.isAdmin && (
                      <button onClick={() => handleTogglePro(u.id, u.isPro)} className={`text-[10px] font-bold px-3 py-1.5 rounded transition-all ${u.isPro ? "text-cyber-muted border border-cyber-border hover:bg-cyber-border/50" : "text-cyber-bg bg-cyber-cyan hover:opacity-90"}`}>
                        {u.isPro ? "Revoke Pro" : "Grant Pro"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Global Scan Logs</h1>
        <p className="text-sm text-cyber-muted">All reports generated across the platform ({globalReports.length} total).</p>
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0d12] text-cyber-muted text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Scanner</th>
                <th className="px-6 py-4">Input Preview</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {globalReports.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-cyber-muted">No reports yet.</td></tr>
              ) : globalReports.map((r) => (
                <tr key={r.id} className="hover:bg-cyber-bg/50 transition-colors">
                  <td className="px-6 py-4"><span className="bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-2 py-1 rounded text-[10px] font-bold">{r.scanType}</span></td>
                  <td className="px-6 py-4 text-xs text-cyber-muted font-mono truncate max-w-[250px]">{r.scanInputSnippet}</td>
                  <td className="px-6 py-4 text-[10px] text-cyber-muted font-mono truncate max-w-[100px]">{usersList.find(u => u.id === r.userId)?.email || r.userId.slice(0,8)+"..."}</td>
                  <td className="px-6 py-4 text-xs text-cyber-muted">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Platform Settings</h1>
        <p className="text-sm text-cyber-muted">Manage platform configuration.</p>
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Admin Account</h3>
        <div className="flex justify-between items-center py-3 border-b border-cyber-border">
          <div><p className="text-sm text-cyber-text">Email</p><p className="text-xs text-cyber-muted">{user?.email}</p></div>
          <span className="text-[10px] text-cyber-red font-bold bg-cyber-red/10 border border-cyber-red/20 px-2 py-1 rounded uppercase">Super Admin</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-cyber-border">
          <div><p className="text-sm text-cyber-text">Total Platform Users</p><p className="text-xs text-cyber-muted">{usersList.length} accounts</p></div>
        </div>
        <div className="flex justify-between items-center py-3">
          <div><p className="text-sm text-cyber-text">Total Reports</p><p className="text-xs text-cyber-muted">{globalReports.length} generated</p></div>
        </div>
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-cyber-red uppercase tracking-wider mb-3">Danger Zone</h3>
        <p className="text-xs text-cyber-muted mb-4">These actions are irreversible. Proceed with caution.</p>
        <div className="flex gap-3">
          <button className="text-xs text-cyber-red border border-cyber-red/30 px-4 py-2 rounded-lg hover:bg-cyber-red/10 transition-all" disabled>
            Reset All Free Users
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex">
      <Sidebar navItems={navItems} activeItem={activeTab} onNavChange={setActiveTab} variant="admin" />
      <main className="flex-1 lg:ml-[240px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "users" && renderUsers()}
        {activeTab === "logs" && renderLogs()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}
