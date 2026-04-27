"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { getUserReports, SavedReport } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#F85149", "#E3B341", "#3FB950", "#00D4FF", "#A371F7", "#F778BA"];

function AnalyticsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      getUserReports(user.uid).then(r => { setReports(r); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const navItems = [
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, label: "Overview", id: "overview", onClick: () => router.push("/dashboard?tab=overview") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, label: "New Scan", id: "scan", onClick: () => router.push("/dashboard?tab=scan") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: "Report History", id: "history", onClick: () => router.push("/dashboard?tab=history") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: "Analytics", id: "analytics", onClick: () => router.push("/analytics") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: "Settings", id: "settings", onClick: () => router.push("/dashboard?tab=settings") },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-cyber-bg">
        <Sidebar navItems={navItems} activeItem="analytics" onNavChange={() => {}} />
        <main className="flex-1 lg:ml-[250px] p-6 pt-20 lg:pt-6 space-y-8">
          {/* Skeleton: Page Title */}
          <div>
            <div className="skeleton h-7 w-32 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          {/* Skeleton: Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-6 w-6 rounded" />
                </div>
                <div className="skeleton h-8 w-16" />
              </div>
            ))}
          </div>
          {/* Skeleton: Chart Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2].map(i => (
              <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
                <div className="skeleton h-4 w-40 mb-6" />
                <div className="skeleton h-[250px] w-full rounded-lg" />
              </div>
            ))}
          </div>
          {/* Skeleton: Second Row Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2].map(i => (
              <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-6">
                <div className="skeleton h-4 w-36 mb-6" />
                <div className="skeleton h-[250px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ─── COMPUTE STATS ─────────────────────────────────────────
  const totalReports = reports.length;
  const now = new Date();
  const thisMonth = reports.filter(r => {
    const d = new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Scanner type breakdown
  const scannerCounts: Record<string, number> = {};
  reports.forEach(r => { scannerCounts[r.scanType] = (scannerCounts[r.scanType] || 0) + 1; });
  const scannerData = Object.entries(scannerCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topScanner = scannerData[0]?.name || "N/A";

  // Reports per day (last 30 days)
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });
  const dailyData = last30.map(date => ({
    date: date.slice(5), // MM-DD
    reports: reports.filter(r => r.createdAt.startsWith(date)).length,
  }));

  // Reports per month (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    return {
      month: label,
      reports: reports.filter(r => r.createdAt.startsWith(key)).length,
    };
  });

  // Severity heuristic (from report content keywords)
  const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
  reports.forEach(r => {
    const c = r.reportContent.toLowerCase();
    if (c.includes("critical")) severityCounts.Critical++;
    if (c.includes("high")) severityCounts.High++;
    if (c.includes("medium")) severityCounts.Medium++;
    if (c.includes("low")) severityCounts.Low++;
    if (c.includes("informational") || c.includes("info")) severityCounts.Info++;
  });
  const severityData = Object.entries(severityCounts)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div className="flex min-h-screen bg-cyber-bg">
      <Sidebar navItems={navItems} activeItem="analytics" onNavChange={() => {}} />
      <main className="flex-1 lg:ml-[250px] p-6 pt-20 lg:pt-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-sm text-cyber-muted">Insights from your vulnerability reports.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Total Reports", value: totalReports, icon: <svg className="w-5 h-5 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, color: "cyber-cyan" },
            { label: "This Month", value: thisMonth, icon: <svg className="w-5 h-5 text-cyber-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, color: "cyber-green" },
            { label: "Top Scanner", value: topScanner, icon: <svg className="w-5 h-5 text-cyber-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>, color: "cyber-orange" },
            { label: "Scanner Types Used", value: Object.keys(scannerCounts).length, icon: <svg className="w-5 h-5 text-cyber-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: "cyber-purple" },
          ].map(s => (
            <div key={s.label} className="bg-cyber-card border border-cyber-border rounded-xl p-5 hover:border-cyber-cyan/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest">{s.label}</span>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold text-${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports per Day */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Reports — Last 30 Days</h3>
            {totalReports === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-cyber-muted text-sm">No report data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" tick={{ fill: "#8B949E", fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8, fontSize: 12, color: "#E6EDF3" }} />
                  <Bar dataKey="reports" fill="#00D4FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Scanner Breakdown */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Scanner Usage</h3>
            {scannerData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-cyber-muted text-sm">No report data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={scannerData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="#0D1117">
                    {scannerData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8, fontSize: 12, color: "#E6EDF3" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#8B949E" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Monthly Trend</h3>
            {totalReports === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-cyber-muted text-sm">No report data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8, fontSize: 12, color: "#E6EDF3" }} />
                  <Line type="monotone" dataKey="reports" stroke="#3FB950" strokeWidth={2} dot={{ fill: "#3FB950", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Severity Distribution */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Severity Distribution</h3>
            {severityData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-cyber-muted text-sm">No severity data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={severityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis type="number" tick={{ fill: "#8B949E", fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8B949E", fontSize: 11 }} width={70} />
                  <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8, fontSize: 12, color: "#E6EDF3" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {severityData.map((entry, i) => {
                      const colorMap: Record<string, string> = { Critical: "#F85149", High: "#E3B341", Medium: "#F0883E", Low: "#3FB950", Info: "#00D4FF" };
                      return <Cell key={i} fill={colorMap[entry.name] || COLORS[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Scanner Table */}
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Scanner Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left py-3 px-2 text-cyber-muted font-bold text-xs uppercase">Scanner</th>
                  <th className="text-right py-3 px-2 text-cyber-muted font-bold text-xs uppercase">Reports</th>
                  <th className="text-right py-3 px-2 text-cyber-muted font-bold text-xs uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {scannerData.map((s, i) => (
                  <tr key={i} className="border-b border-cyber-border/30 last:border-0">
                    <td className="py-3 px-2 text-cyber-text flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {s.name}
                    </td>
                    <td className="py-3 px-2 text-right text-cyber-text font-mono">{s.value}</td>
                    <td className="py-3 px-2 text-right text-cyber-muted font-mono">{totalReports ? ((s.value / totalReports) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
                {scannerData.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-cyber-muted">No reports yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-cyber-border border-t-cyber-cyan rounded-full animate-spin mb-4" />
          <p className="text-cyber-muted text-sm">Loading analytics...</p>
        </div>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
