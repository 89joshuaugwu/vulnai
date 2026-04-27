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
import dynamic from "next/dynamic";
import { useCurrency } from "@/hooks/useCurrency";
import { motion, AnimatePresence } from "framer-motion";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), { ssr: false });

const NAV_ICONS = {
  scan: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  history: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  overview: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

function DashboardContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { formatPrice, currency, exchangeRate } = useCurrency();

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [scanInput, setScanInput] = useState("");
  const [scanType, setScanType] = useState("Nmap");
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [usageStats, setUsageStats] = useState({ allowed: false, remaining: 0, isPro: false, isAdmin: false, require2FA: false, isSuspended: false, announcementBanner: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && user && usageStats.require2FA && typeof window !== "undefined" && sessionStorage.getItem("2fa_passed") !== "true") {
      router.push("/login");
    }
  }, [user, authLoading, router, usageStats.require2FA]);

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwOtp, setShowPwOtp] = useState(false);
  const [pwOtpCode, setPwOtpCode] = useState("");

  // Password validation state
  const hasMinLength = newPw.length >= 8;
  const hasUpper = /[A-Z]/.test(newPw);
  const hasLower = /[a-z]/.test(newPw);
  const hasNumber = /[0-9]/.test(newPw);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPw);
  const passwordsMatch = newPw !== "" && newPw === confirmPw;
  const isValidPassword = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;
  const hasPassword = user?.providerData?.some(p => p.providerId === "password");
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
      if (user) {
        const { getUserReportsSecurely } = await import("@/app/actions/reports");
        const res = await getUserReportsSecurely(user.uid);
        if (res.success && res.reports) {
          setHistory(res.reports as unknown as SavedReport[]);
        } else {
          toast.error("Failed to load history.");
        }
      }
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
      
      const { saveReportSecurely } = await import("@/app/actions/reports");
      const saveRes = await saveReportSecurely(user.uid, scanType, data.report, scanInput);
      if (!saveRes.success) throw new Error("Failed to securely save report");
      
      // Fire scan complete email
      if (user.email) {
        fetch("/api/send-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "scan_complete", email: user.email, metadata: { scanner: scanType } }),
        }).catch(console.error);
      }

      toast.success("Report generated & saved securely!");
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
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-cyber-bg border border-cyber-border flex items-center justify-center text-2xl text-cyber-muted">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">No Reports Yet</h4>
              <p className="text-xs text-cyber-muted max-w-xs mb-4">You haven't generated any vulnerability reports yet. Your recent activity will appear here.</p>
              <button onClick={() => setActiveTab("scan")} className="text-xs bg-cyber-cyan text-cyber-bg font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-all">Start a Scan</button>
            </div>
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
          {!usageStats.isPro && (
            <div className="bg-cyber-orange/10 border-b border-cyber-orange/20 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] text-cyber-orange font-medium">Showing last 7 days only.</span>
              <button onClick={() => setActiveTab("settings")} className="text-[10px] text-cyber-orange hover:underline font-bold flex items-center gap-1">Upgrade to Pro →</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-cyber-border">
            {historyLoading ? (
              <div className="divide-y divide-cyber-border">
                {[1,2,3,4].map(i => (
                  <div key={i} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="skeleton h-5 w-20 rounded-full" />
                      <div className="skeleton h-3 w-16" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <div className="skeleton h-4 w-10" />
                        <div className="skeleton h-4 w-10" />
                      </div>
                      <div className="skeleton h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 mb-3 rounded-full bg-cyber-bg border border-cyber-border flex items-center justify-center text-cyber-muted">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">No Reports</h4>
                <p className="text-[10px] text-cyber-muted mb-4 max-w-[150px]">Your generated reports will appear here.</p>
                <button onClick={() => setActiveTab("scan")} className="text-[10px] text-cyber-cyan hover:underline">Go to Scan</button>
              </div>
            ) : history.map((r) => {
              // Parse basic metrics for UI visualization
              const words = r.reportContent?.split(/\s+/).length || 0;
              const critical = (r.reportContent?.match(/critical/gi) || []).length;
              const high = (r.reportContent?.match(/high/gi) || []).length;
              const medium = (r.reportContent?.match(/medium/gi) || []).length;
              const low = (r.reportContent?.match(/low/gi) || []).length;

              // Map scanner to color
              const sColor = ["Nmap", "Nessus"].includes(r.scanType) ? "cyan" : 
                             ["Burp Suite"].includes(r.scanType) ? "orange" : 
                             ["OpenVAS"].includes(r.scanType) ? "green" : 
                             ["Nikto"].includes(r.scanType) ? "purple" : "blue";

              return (
                <button key={r.id} onClick={() => setSelectedReport(r)} className={`w-full text-left p-4 hover:bg-cyber-bg/50 transition-colors ${selectedReport?.id === r.id ? "bg-cyber-bg border-l-[3px] border-cyber-cyan" : "border-l-[3px] border-transparent"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-${sColor}-400/10 text-${sColor}-400 border border-${sColor}-400/20`}>
                      {r.scanType}
                    </span>
                    <span className="text-[10px] text-cyber-muted font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2.5 text-[10px] font-mono items-center">
                      {critical > 0 && <span className="text-red-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>{critical}</span>}
                      {high > 0 && <span className="text-orange-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>{high}</span>}
                      {medium > 0 && <span className="text-amber-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>{medium}</span>}
                      {(low > 0 || (critical === 0 && high === 0 && medium === 0)) && <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>{low || 1}</span>}
                    </div>
                    <span className="text-[10px] text-cyber-muted font-mono">{words} words</span>
                  </div>
                </button>
              );
            })}
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
                <div className="flex items-center gap-2">
                  {usageStats.isPro && (
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/reports/${selectedReport.id}`);
                      toast.success("Share link copied to clipboard!");
                    }} className="text-[10px] bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20 px-2.5 py-1.5 rounded hover:bg-cyber-purple/20 transition-all flex items-center gap-1">
                      <span><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg></span> Share
                    </button>
                  )}
                  <button onClick={() => { 
                    setReport(selectedReport.reportContent); 
                    setScanType(selectedReport.scanType); 
                    // @ts-ignore - fullScanInput is returned from secure API
                    if (selectedReport.fullScanInput) setScanInput(selectedReport.fullScanInput);
                    setActiveTab("scan"); 
                  }} className="text-[10px] bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-2.5 py-1.5 rounded hover:bg-cyber-cyan/20 transition-all">
                    Load into Generator
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selectedReport.reportContent}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-cyber-muted/30">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <p className="font-mono text-xs uppercase tracking-widest text-cyber-muted/50">Select a report to view</p>
            </div>
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
      
      {/* Billing Section */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Billing & Subscription</h3>
        <div className="flex items-center justify-between border-b border-cyber-border/50 pb-4">
          <div>
            <p className="text-sm font-medium text-white mb-1">Current Plan</p>
            <p className="text-xs text-cyber-muted">
              You are currently on the {usageStats.isPro ? "Pro" : usageStats.isAdmin ? "Admin" : "Hacker (Free)"} tier.
            </p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-bold ${
            usageStats.isAdmin ? 'bg-cyber-red/10 text-cyber-red border-cyber-red/20' :
            usageStats.isPro ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' :
            'bg-cyber-muted/10 text-cyber-muted border-cyber-border'
          }`}>
            {usageStats.isAdmin ? "Admin" : usageStats.isPro ? "Pro" : "Free"}
          </span>
        </div>
        
        {!usageStats.isPro && !usageStats.isAdmin && (
          <div className="pt-2">
            <p className="text-xs text-cyber-muted mb-4">Upgrade to Pro for unlimited reports, Advanced Gemini reasoning, shareable links, and priority support.</p>
            <div className="max-w-[200px]">
              <PaystackButton 
                amount={5000 * 100} 
                currency="NGN" 
                className="w-full text-center py-2.5 rounded-lg font-bold text-sm bg-cyber-cyan text-cyber-bg hover:opacity-90 transition-all block" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Password</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!isValidPassword) { toast.error("Please meet all password requirements"); return; }
          
          if (!showPwOtp) {
            setPwLoading(true);
            try {
              if (!user?.email) throw new Error("No email associated with account.");
              const res = await fetch("/api/send-otp", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, type: 'password_change' })
              });
              if (!res.ok) throw new Error("Failed to send verification code.");
              toast.success("Verification code sent to your email!");
              setShowPwOtp(true);
            } catch (err: any) {
              toast.error(err.message || "Something went wrong.");
            } finally {
              setPwLoading(false);
            }
            return;
          }

          if (pwOtpCode.length !== 6) { toast.error("Please enter the 6-digit code."); return; }
          setPwLoading(true);
          try {
            // Verify OTP First
            const otpRes = await fetch('/api/verify-otp', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user!.email, code: pwOtpCode })
            });
            const otpData = await otpRes.json();
            if (!otpRes.ok || !otpData.success) throw new Error("Invalid or expired verification code.");

            // OTP valid, update password
            if (hasPassword) {
              const credential = EmailAuthProvider.credential(user!.email!, currentPw);
              await reauthenticateWithCredential(user!, credential);
            }
            await updatePassword(user!, newPw);
            setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPwOtp(false); setPwOtpCode("");
            toast.success(hasPassword ? "Password updated successfully!" : "Password added successfully! You can now log in with email.");
          } catch (err: any) {
            if (err.message === "Invalid or expired verification code.") toast.error(err.message);
            else if (err.code === "auth/wrong-password") toast.error("Current password is incorrect");
            else if (err.code === "auth/requires-recent-login") toast.error("Please log out and log back in to set a password.");
            else toast.error(err.message || "Failed to update password");
          } finally { setPwLoading(false); }
        }} className="space-y-4">
          
          {!showPwOtp ? (
            <>
              {!hasPassword && (
                <p className="text-xs text-cyber-muted mb-4">Your account uses Google Sign-In. You can set a password here to also allow email/password login.</p>
              )}
              {hasPassword && (
                <div>
                  <label className="block text-xs text-cyber-muted mb-1">Current Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} required className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none pr-10" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors" title={showPw ? "Hide Password" : "Show Password"}>
                      {showPw ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-cyber-muted mb-1">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors" title={showPw ? "Hide Password" : "Show Password"}>
                    {showPw ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-3 space-y-1.5 p-3 rounded-lg bg-cyber-bg border border-cyber-border text-xs">
                    <div className="text-cyber-muted mb-1 font-semibold">Password requirements:</div>
                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{hasMinLength ? '✓' : '○'}</span> At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${hasUpper ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{hasUpper ? '✓' : '○'}</span> One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${hasLower ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{hasLower ? '✓' : '○'}</span> One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${hasNumber ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{hasNumber ? '✓' : '○'}</span> One number
                    </div>
                    <div className={`flex items-center gap-2 ${hasSpecial ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{hasSpecial ? '✓' : '○'}</span> One special character
                    </div>
                    <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                      <span>{passwordsMatch ? '✓' : '○'}</span> Passwords match
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-cyber-muted mb-1">Confirm New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan transition-colors" title={showPw ? "Hide Password" : "Show Password"}>
                    {showPw ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-cyber-muted mb-4">We sent a 6-digit verification code to your email to confirm this change.</p>
              <label className="block text-xs text-cyber-muted mb-1">Verification Code</label>
              <input type="text" maxLength={6} required value={pwOtpCode} onChange={(e) => setPwOtpCode(e.target.value.replace(/\D/g, ''))} className="w-full bg-cyber-bg border border-cyber-cyan/50 rounded-lg px-3 py-3 text-2xl tracking-[0.5em] text-center font-mono text-cyber-cyan focus:border-cyber-cyan focus:outline-none transition-all mb-4" placeholder="000000" />
            </div>
          )}
          
          <button type="submit" disabled={pwLoading || (!showPwOtp && (newPw.length === 0 || !isValidPassword)) || (showPwOtp && pwOtpCode.length !== 6)} className="text-xs bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 px-4 py-2 rounded hover:bg-cyber-cyan/20 transition-all disabled:opacity-50">
            {pwLoading ? (showPwOtp ? "Verifying..." : "Sending...") : (!showPwOtp ? "Continue" : (hasPassword ? "Verify & Update" : "Verify & Add"))}
          </button>
          
          {showPwOtp && (
            <button type="button" onClick={() => setShowPwOtp(false)} className="text-xs text-cyber-muted hover:text-white ml-4" disabled={pwLoading}>
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* API Access Teaser */}
      <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-cyber-bg/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white font-bold mb-2">Enterprise Feature</p>
          <button className="bg-cyber-cyan text-cyber-bg font-bold px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform">
            Contact Sales
          </button>
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          API Access
        </h3>
        <p className="text-sm text-cyber-muted mb-4">Integrate VulnAI report generation directly into your CI/CD pipelines and custom security dashboards.</p>
        <div className="bg-cyber-bg border border-cyber-border p-3 rounded-lg flex items-center justify-between filter blur-[2px] select-none">
          <span className="font-mono text-xs text-cyber-cyan">vai_live_8f92j3k4l5m6n7o8p9q0</span>
          <button className="text-cyber-muted hover:text-cyber-cyan">Copy</button>
        </div>
      </div>
    </div>
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-cyber-border border-t-cyber-cyan rounded-full animate-spin mb-4"></div>
          <p className="text-cyber-cyan font-mono text-sm animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex">
      <Sidebar navItems={navItems} activeItem={activeTab} onNavChange={setActiveTab} variant="user" />
      <main className="flex-1 lg:ml-[240px] p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-y-auto overflow-x-hidden flex flex-col">
        {usageStats.announcementBanner && (
          <div className="mb-6 bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg p-3 px-4 flex items-center justify-center text-cyber-orange text-xs font-medium font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(255,165,0,0.1)]">
            <span className="animate-pulse mr-2">●</span> {usageStats.announcementBanner}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && renderOverview()}
            {activeTab === "scan" && renderScan()}
            {activeTab === "history" && renderHistory()}
            {activeTab === "settings" && renderSettings()}
          </motion.div>
        </AnimatePresence>
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
