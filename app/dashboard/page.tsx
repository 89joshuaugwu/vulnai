"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { checkCanGenerateReport, saveReportToFirestore, getUserReports, SavedReport, toggle2FA } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";

const NAV_ICONS = {
  scan: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  history: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  overview: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [scanInput, setScanInput] = useState("");
  const [scanType, setScanType] = useState("Nmap");
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [usageStats, setUsageStats] = useState({ allowed: false, remaining: 0, isPro: false, require2FA: false });
  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { icon: NAV_ICONS.overview, label: "Overview", id: "overview" },
    { icon: NAV_ICONS.scan, label: "New Scan", id: "scan" },
    { icon: NAV_ICONS.history, label: "Report History", id: "history" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, label: "Analytics", id: "analytics", onClick: () => router.push("/analytics") },
    { icon: NAV_ICONS.settings, label: "Settings", id: "settings" },
  ];

  useEffect(() => {
    async function fetchUsage() {
      if (user) {
        const stats = await checkCanGenerateReport(user.uid, user.email || undefined);
        setUsageStats(stats);
      }
    }
    fetchUsage();
  }, [user, report]);

  useEffect(() => {
    if (activeTab === "history" && user) loadHistory();
  }, [activeTab, user]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      if (user) setHistory(await getUserReports(user.uid));
    } catch { toast.error("Failed to load history."); }
    finally { setHistoryLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) { setScanInput(ev.target.result as string); toast.success("File imported!"); } };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!user) { toast.error("Sign in first."); router.push("/login"); return; }
    if (!usageStats.allowed) { toast.error("Daily limit reached."); return; }
    if (scanInput.length < 10) { toast.error("Input too short."); return; }

    setIsGenerating(true); setReport("");
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanInput, scanType, userId: user.uid }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const data = await res.json();
      setReport(data.report);
      await saveReportToFirestore({ userId: user.uid, scanType, reportContent: data.report, scanInputSnippet: scanInput.substring(0, 100) + "...", createdAt: new Date().toISOString() });
      
      // Fire scan complete email
      if (user.email) {
        fetch("/api/send-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "scan_complete", email: user.email, metadata: { scanner: scanType } }),
        }).catch(console.error);
      }

      toast.success("Report generated & saved!");
      setUsageStats(p => ({ ...p, remaining: p.remaining - 1, allowed: p.isPro || p.remaining - 1 > 0 }));
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setIsGenerating(false); }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentW = pageW - margin * 2;
      const now = new Date().toLocaleString();

      // ─── COVER PAGE ─────────────────────────────────────────
      pdf.setFillColor(13, 17, 23);
      pdf.rect(0, 0, pageW, pageH, "F");

      // Accent line
      pdf.setDrawColor(0, 212, 255);
      pdf.setLineWidth(1.5);
      pdf.line(margin, 60, pageW - margin, 60);

      // Title
      pdf.setTextColor(0, 212, 255);
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      pdf.text("VulnAI", margin, 50);

      pdf.setTextColor(230, 237, 243);
      pdf.setFontSize(22);
      pdf.text("Vulnerability Assessment Report", margin, 75);

      pdf.setFontSize(14);
      pdf.setTextColor(139, 148, 158);
      pdf.text(`Scanner: ${scanType}`, margin, 90);
      pdf.text(`Generated: ${now}`, margin, 100);
      pdf.text(`Tier: ${usageStats.isPro ? "Pro Pentester" : "Free Hacker"}`, margin, 110);

      // Divider
      pdf.setDrawColor(48, 54, 61);
      pdf.setLineWidth(0.3);
      pdf.line(margin, 125, pageW - margin, 125);

      pdf.setTextColor(139, 148, 158);
      pdf.setFontSize(10);
      pdf.text("CONFIDENTIAL - For authorized personnel only", margin, 135);
      pdf.text("Powered by Google Gemini AI", margin, 142);

      // ─── CONTENT PAGES ──────────────────────────────────────
      pdf.addPage();
      let cursorY = 30;

      const addHeader = () => {
        pdf.setFillColor(13, 17, 23);
        pdf.rect(0, 0, pageW, 20, "F");
        pdf.setFontSize(8);
        pdf.setTextColor(0, 212, 255);
        pdf.text("VulnAI Report", margin, 12);
        pdf.setTextColor(139, 148, 158);
        pdf.text(`${scanType} | ${now}`, pageW - margin, 12, { align: "right" });
        pdf.setDrawColor(48, 54, 61);
        pdf.line(margin, 18, pageW - margin, 18);
      };

      const addFooter = (pageNum: number) => {
        pdf.setDrawColor(48, 54, 61);
        pdf.line(margin, pageH - 15, pageW - margin, pageH - 15);
        pdf.setFontSize(8);
        pdf.setTextColor(139, 148, 158);
        pdf.text(`Page ${pageNum}`, pageW / 2, pageH - 8, { align: "center" });
        pdf.text("vulnai.vercel.app", pageW - margin, pageH - 8, { align: "right" });
      };

      addHeader();
      let pageNum = 2;

      const lines = report.split("\n");
      for (const rawLine of lines) {
        const line = rawLine.replace(/[#*`]/g, "").trim();
        if (!line) { cursorY += 4; continue; }

        // Detect headings
        const isH1 = rawLine.startsWith("# ");
        const isH2 = rawLine.startsWith("## ");
        const isH3 = rawLine.startsWith("### ");
        const isBullet = rawLine.trim().startsWith("- ") || rawLine.trim().startsWith("* ");

        if (isH1) { pdf.setFontSize(16); pdf.setFont("helvetica", "bold"); pdf.setTextColor(0, 212, 255); cursorY += 6; }
        else if (isH2) { pdf.setFontSize(13); pdf.setFont("helvetica", "bold"); pdf.setTextColor(63, 185, 80); cursorY += 4; }
        else if (isH3) { pdf.setFontSize(11); pdf.setFont("helvetica", "bold"); pdf.setTextColor(230, 237, 243); cursorY += 2; }
        else if (isBullet) { pdf.setFontSize(10); pdf.setFont("helvetica", "normal"); pdf.setTextColor(200, 210, 220); }
        else { pdf.setFontSize(10); pdf.setFont("helvetica", "normal"); pdf.setTextColor(200, 210, 220); }

        const wrapped = pdf.splitTextToSize(isBullet ? `  •  ${line.replace(/^[-*]\s*/, "")}` : line, contentW);
        const blockH = wrapped.length * (pdf.getFontSize() * 0.5);

        if (cursorY + blockH > pageH - 25) {
          addFooter(pageNum);
          pdf.addPage();
          pageNum++;
          cursorY = 30;
          addHeader();
        }

        pdf.text(wrapped, margin, cursorY);
        cursorY += blockH + 3;
      }
      addFooter(pageNum);

      pdf.save(`VulnAI-${scanType}-Report.pdf`);
      toast.success("PDF Downloaded!");
    } catch { toast.error("PDF generation failed"); }
    finally { setIsDownloading(false); }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const header = `# VulnAI Vulnerability Report\n**Scanner:** ${scanType}\n**Date:** ${new Date().toLocaleString()}\n**Tier:** ${usageStats.isPro ? "Pro" : "Free"}\n\n---\n\n`;
    const blob = new Blob([header + report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `VulnAI-${scanType}-Report.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Markdown downloaded!");
  };

  const handleDownloadHTML = () => {
    if (!report) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VulnAI Report - ${scanType}</title>
<style>body{font-family:monospace;background:#0D1117;color:#E6EDF3;padding:40px;max-width:900px;margin:0 auto}
h1{color:#00D4FF}h2{color:#3FB950}h3{color:#E3B341}a{color:#00D4FF}
pre,code{background:#161B22;padding:8px 12px;border-radius:6px;overflow-x:auto;border:1px solid #30363D}
ul{padding-left:20px}li{margin:4px 0}.header{border-bottom:2px solid #00D4FF;padding-bottom:16px;margin-bottom:24px}
.meta{color:#8B949E;font-size:12px}</style></head>
<body><div class="header"><h1>VulnAI Report</h1><p class="meta">Scanner: ${scanType} | Generated: ${new Date().toLocaleString()} | Tier: ${usageStats.isPro ? "Pro" : "Free"}</p></div>
${report.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/^# (.*$)/gm, '<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `VulnAI-${scanType}-Report.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded!");
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const jsonData = {
      platform: "VulnAI",
      version: "1.0",
      scanner: scanType,
      generatedAt: new Date().toISOString(),
      tier: usageStats.isPro ? "pro" : "free",
      report: report,
      sections: report.split(/^## /gm).filter(Boolean).map(s => {
        const lines = s.split("\n");
        return { title: lines[0]?.trim(), content: lines.slice(1).join("\n").trim() };
      }),
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `VulnAI-${scanType}-Report.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON downloaded!");
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  // ─── RENDER SECTIONS ─────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}!</h1>
        <p className="text-sm text-cyber-muted">Here is your workspace overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Reports Today", value: usageStats.isPro ? history.filter(r => r.createdAt.startsWith(new Date().toISOString().split("T")[0])).length : Math.max(0, 3 - usageStats.remaining), color: "cyber-cyan", icon: "📊" },
          { label: "Remaining", value: usageStats.isPro ? "∞" : usageStats.remaining, color: "cyber-green", icon: "⚡" },
          { label: "Plan", value: usageStats.isPro ? "Pro" : "Free", color: "cyber-orange", icon: "🏷️" },
          { label: "Saved Reports", value: history.length, color: "cyber-purple", icon: "📁" },
        ].map((s) => (
          <div key={s.label} className="bg-cyber-card border border-cyber-border rounded-xl p-5 hover:border-cyber-cyan/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-3xl font-bold font-mono text-${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button onClick={() => setActiveTab("scan")} className="bg-cyber-card border border-cyber-border rounded-xl p-6 hover:border-cyber-cyan/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)] transition-all text-left group">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center text-cyber-cyan group-hover:scale-110 transition-transform">⚡</div>
            <div>
              <h3 className="text-sm font-bold text-white">New Vulnerability Scan</h3>
              <p className="text-xs text-cyber-muted">Paste scanner output and generate a report</p>
            </div>
          </div>
        </button>
        <button onClick={() => setActiveTab("history")} className="bg-cyber-card border border-cyber-border rounded-xl p-6 hover:border-cyber-cyan/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)] transition-all text-left group">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-orange/10 border border-cyber-orange/20 flex items-center justify-center text-cyber-orange group-hover:scale-110 transition-transform">📜</div>
            <div>
              <h3 className="text-sm font-bold text-white">View Report History</h3>
              <p className="text-xs text-cyber-muted">Browse and re-download past reports</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-cyber-border">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div className="divide-y divide-cyber-border">
          {history.length === 0 ? (
            <div className="p-8 text-center text-cyber-muted text-sm">No recent activity. Generate your first report!</div>
          ) : (
            history.slice(0, 5).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-cyber-bg/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-2 py-0.5 rounded text-[10px] font-bold">{r.scanType}</span>
                  <span className="text-xs text-cyber-muted font-mono truncate max-w-[200px]">{r.scanInputSnippet}</span>
                </div>
                <span className="text-[10px] text-cyber-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderScan = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">New Vulnerability Scan</h1>
        <p className="text-sm text-cyber-muted">Paste raw scanner output or import a file to generate a professional report.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-200px)]">
        {/* Input Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <label className="text-[10px] text-cyber-muted uppercase tracking-widest font-bold block mb-2">Scanner Type</label>
            <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none transition-colors">
              {["Nmap","Nessus","OpenVAS","Burp Suite","Qualys","Nikto","OWASP ZAP","Acunetix","Metasploit","Custom/Other"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 flex-1 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent" />
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] text-cyber-muted uppercase tracking-widest font-bold">Raw Output</label>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.xml,.json,.csv" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-cyber-bg border border-cyber-cyan/30 text-cyber-cyan px-2 py-1 rounded hover:bg-cyber-cyan/10 transition-colors">+ Import</button>
                <button onClick={() => setScanInput("")} className="text-[10px] text-cyber-red hover:underline">Clear</button>
              </div>
            </div>
            <textarea value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="Paste raw scan output here..." className="w-full flex-1 bg-[#080b0f] border border-cyber-border rounded-lg p-4 text-xs font-mono text-cyber-muted focus:border-cyber-cyan focus:text-cyber-cyan focus:outline-none resize-none transition-all" />
            <button onClick={handleGenerate} disabled={isGenerating || scanInput.length < 10 || !usageStats.allowed} className="mt-4 w-full rounded-lg bg-cyber-cyan px-4 py-3 text-sm font-bold text-cyber-bg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-[0_0_15px_rgba(0,212,255,0.2)]">
              {isGenerating ? "Analyzing..." : `Generate Report (${usageStats.isPro ? "∞" : usageStats.remaining + " left"})`}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-8 bg-[#080b0f] border border-cyber-border rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-cyber-border bg-cyber-card/30">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${report ? "bg-cyber-green" : "bg-cyber-muted/40"}`} />
              Report Output
            </h2>
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={!report || isDownloading} className="text-xs border border-cyber-border px-3 py-1.5 rounded text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan disabled:opacity-30 transition-all flex items-center gap-1.5">
                {isDownloading ? "Generating..." : "⬇ Export"}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showExportMenu && report && (
                <div className="absolute right-0 top-full mt-1 bg-cyber-card border border-cyber-border rounded-lg shadow-2xl py-1 z-50 min-w-[160px]">
                  <button onClick={() => { handleDownloadPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg/50 flex items-center gap-2 transition-colors">
                    <span className="text-red-400">📄</span> PDF Report
                  </button>
                  <button onClick={() => { handleDownloadMarkdown(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg/50 flex items-center gap-2 transition-colors">
                    <span className="text-blue-400">📝</span> Markdown (.md)
                  </button>
                  <button onClick={() => { handleDownloadHTML(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg/50 flex items-center gap-2 transition-colors">
                    <span className="text-orange-400">🌐</span> HTML Page
                  </button>
                  <button onClick={() => { handleDownloadJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg/50 flex items-center gap-2 transition-colors">
                    <span className="text-green-400">📦</span> JSON Data
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {!report && !isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-cyber-muted/30">
                <svg className="w-16 h-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-mono text-xs uppercase tracking-widest">Awaiting Scan Input</p>
              </div>
            ) : (
              <div id="report-content" className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
                {isGenerating && <span className="inline-block w-2 h-5 bg-cyber-cyan animate-pulse ml-1" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Report History</h1>
        <p className="text-sm text-cyber-muted">Browse, view, and re-download your generated reports.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:h-[calc(100vh-200px)]">
        {/* List */}
        <div className="col-span-1 bg-cyber-card border border-cyber-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-cyber-border bg-[#0a0d12]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{history.length} Reports</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-cyber-border">
            {historyLoading ? (
              <div className="p-8 text-center text-cyber-cyan animate-pulse text-sm font-mono">Loading...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-cyber-muted text-sm">No reports yet.</div>
            ) : history.map((r) => (
              <button key={r.id} onClick={() => setSelectedReport(r)} className={`w-full text-left p-4 hover:bg-cyber-bg/50 transition-colors ${selectedReport?.id === r.id ? "bg-cyber-bg border-l-[3px] border-cyber-cyan" : "border-l-[3px] border-transparent"}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-cyber-text">{r.scanType}</span>
                  <span className="text-[10px] text-cyber-muted font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-cyber-muted truncate font-mono">{r.scanInputSnippet}</p>
              </button>
            ))}
          </div>
        </div>
        {/* Detail */}
        <div className="col-span-2 bg-[#080b0f] border border-cyber-border rounded-xl overflow-hidden flex flex-col">
          {selectedReport ? (
            <>
              <div className="p-4 border-b border-cyber-border flex justify-between items-center bg-cyber-card/30">
                <div>
                  <h3 className="text-sm font-bold text-cyber-cyan">{selectedReport.scanType} Report</h3>
                  <p className="text-[10px] text-cyber-muted mt-0.5">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => { setReport(selectedReport.reportContent); setScanType(selectedReport.scanType); setActiveTab("scan"); }} className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-2.5 py-1.5 rounded hover:bg-cyber-cyan/20 transition-all">
                  Load into Generator
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selectedReport.reportContent}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-cyber-muted/40 text-sm">Select a report to view</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-cyber-muted">Manage your account and preferences.</p>
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account</h3>
        <div className="flex justify-between items-center py-3 border-b border-cyber-border">
          <div><p className="text-sm text-cyber-text">Email</p><p className="text-xs text-cyber-muted">{user?.email || "Not signed in"}</p></div>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-cyber-border">
          <div><p className="text-sm text-cyber-text">Plan</p><p className="text-xs text-cyber-muted">{usageStats.isPro ? "Pro Pentester" : "Hacker Tier (Free)"}</p></div>
          {!usageStats.isPro && <button onClick={() => router.push("/#pricing")} className="text-xs bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/20 px-3 py-1.5 rounded hover:bg-cyber-orange/20 transition-all">Upgrade</button>}
        </div>
        <div className="flex justify-between items-center py-3">
          <div><p className="text-sm text-cyber-text">Daily Usage</p><p className="text-xs text-cyber-muted">{usageStats.isPro ? "Unlimited" : `${usageStats.remaining} of 3 remaining`}</p></div>
        </div>
      </div>
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security</h3>
        <div className="flex justify-between items-center py-3">
          <div><p className="text-sm text-cyber-text">Two-Factor Authentication (2FA)</p><p className="text-xs text-cyber-muted">Require an email OTP code on every login.</p></div>
          <button 
            onClick={async () => {
              if (!user) return;
              try {
                await toggle2FA(user.uid, usageStats.require2FA);
                setUsageStats(prev => ({ ...prev, require2FA: !prev.require2FA }));
                toast.success(usageStats.require2FA ? "2FA Disabled" : "2FA Enabled");
              } catch {
                toast.error("Failed to update 2FA");
              }
            }}
            className={`text-xs px-3 py-1.5 rounded transition-all font-bold ${usageStats.require2FA ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20' : 'bg-cyber-bg text-cyber-muted border border-cyber-border hover:bg-cyber-bg/50'}`}
          >
            {usageStats.require2FA ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>
      {/* Password Section */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Password</h3>
        {isGoogleUser ? (
          <div className="space-y-3">
            <p className="text-xs text-cyber-muted">Your account uses Google Sign-In. You can set a password to also allow email/password login, or reset via email.</p>
            <button 
              onClick={async () => {
                if (!user?.email) return;
                setPwLoading(true);
                try {
                  await sendPasswordResetEmail(auth, user.email);
                  toast.success("Password setup link sent to your email!");
                } catch { toast.error("Failed to send reset email"); }
                finally { setPwLoading(false); }
              }}
              disabled={pwLoading}
              className="text-xs bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-4 py-2 rounded hover:bg-cyber-cyan/20 transition-all disabled:opacity-50"
            >
              {pwLoading ? "Sending..." : "Send Password Setup Link"}
            </button>
          </div>
        ) : (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
            if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
            setPwLoading(true);
            try {
              const credential = EmailAuthProvider.credential(user!.email!, currentPw);
              await reauthenticateWithCredential(user!, credential);
              await updatePassword(user!, newPw);
              setCurrentPw(""); setNewPw(""); setConfirmPw("");
              toast.success("Password updated successfully!");
            } catch (err: any) {
              if (err.code === "auth/wrong-password") toast.error("Current password is incorrect");
              else toast.error(err.message || "Failed to update password");
            } finally { setPwLoading(false); }
          }} className="space-y-3">
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none" />
            </div>
            <button type="submit" disabled={pwLoading} className="text-xs bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-4 py-2 rounded hover:bg-cyber-cyan/20 transition-all disabled:opacity-50">
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex">
      <Sidebar navItems={navItems} activeItem={activeTab} onNavChange={setActiveTab} variant="user" />
      <main className="flex-1 lg:ml-[240px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "scan" && renderScan()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cyber-bg flex items-center justify-center text-cyber-cyan text-sm animate-pulse">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
