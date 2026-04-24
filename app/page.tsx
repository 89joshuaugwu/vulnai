"use client";
import { useState, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { Search, Bot, FileDown, Shield, History, Zap, Users, Mail, FileText, Cpu, Download, Star } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/components/AuthProvider";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), { ssr: false });

const SCANNERS = [
  { name: "Nmap", desc: "Network discovery & port scanning", color: "cyan" },
  { name: "Nikto", desc: "Web server scanner", color: "purple" },
  { name: "Burp Suite", desc: "Web app security testing", color: "orange" },
  { name: "OpenVAS", desc: "Open-source vuln scanner", color: "green" },
  { name: "Metasploit", desc: "Exploitation framework", color: "blue" },
  { name: "Nessus", desc: "Vulnerability assessment", color: "red" },
  { name: "Masscan", desc: "Fast port scanner", color: "amber" },
  { name: "Manual", desc: "Custom scan results", color: "gray" },
];

const TESTIMONIALS = [
  { name: "Adebayo Chukwuemeka", role: "Senior Penetration Tester", company: "CyberVault NG", text: "VulnAI literally saves me 4 hours per client. What used to be my entire Friday afternoon is now done in 45 seconds. Absolutely incredible.", avatar: "AC" },
  { name: "Tunde Erinle", role: "Cybersecurity Student", company: "University of Lagos", text: "The severity classifications and CVE matching are spot on. It impressed my supervisor and looks exactly like a report I would write myself.", avatar: "TE" },
  { name: "Blessing Umeh", role: "IT Security Lead", company: "FirstBank Nigeria", text: "Compliance audits are so much easier now. We paste our Nessus scans and get beautiful PDFs ready for the board. Game changer for Nigerian fintechs.", avatar: "BU" },
];

const FEATURES = [
  {
    icon: <Search size={24} />,
    title: "Multi-Scanner Support",
    description: "Supports 9+ security scanners including Nmap, Nessus, Burp Suite, OpenVAS, Nikto, OWASP ZAP, and more.",
    color: "#00d4ff",
  },
  {
    icon: <Bot size={24} />,
    title: "Gemini AI Analysis",
    description: "CREST-style vulnerability assessment with severity classification, CVE references, and remediation steps.",
    color: "#a371f7",
  },
  {
    icon: <FileDown size={24} />,
    title: "PDF Export",
    description: "Download professional, client-ready penetration testing reports as formatted PDFs instantly.",
    color: "#3fb950",
  },
  {
    icon: <Shield size={24} />,
    title: "Secure & Private",
    description: "Your scan data never leaves our servers. Firebase-backed authentication with OTP verification.",
    color: "#f85149",
  },
  {
    icon: <History size={24} />,
    title: "Report History",
    description: "All your generated reports are saved to your cloud dashboard. Re-view and re-download anytime.",
    color: "#e3b341",
  },
  {
    icon: <Zap size={24} />,
    title: "Instant Results",
    description: "Paste your scan data and get a complete vulnerability report in under 30 seconds.",
    color: "#00d4ff",
  },
  {
    icon: <Users size={24} />,
    title: "Team Collaboration",
    description: "Share reports with team members, assign remediation tasks, and track patching progress.",
    color: "#e3b341",
    comingSoon: true,
  },
];

const STEPS = [
  { num: "01", icon: <FileText className="text-cyber-cyan mb-4" size={32} />, title: "Paste Your Scan Output", desc: "Copy raw output from Nmap, Nessus, Burp Suite, or any supported scanner." },
  { num: "02", icon: <Cpu className="text-cyber-cyan mb-4" size={32} />, title: "AI Analyzes Vulnerabilities", desc: "Gemini AI identifies CVEs, classifies severity, and assesses risk impact." },
  { num: "03", icon: <Download className="text-cyber-cyan mb-4" size={32} />, title: "Download Professional Report", desc: "Get a formatted PDF with executive summary, findings table, and remediation steps." },
];

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      
      if (progress < duration) {
        setCount(Math.floor((progress / duration) * end));
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const SectionBadge = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyber-border bg-cyber-card px-4 py-1.5 text-xs font-semibold text-cyber-muted uppercase tracking-widest shadow-sm">
    {children}
  </div>
);

const TerminalTypewriter = () => {
  const [lines, setLines] = useState<number>(0);

  useEffect(() => {
    let t1 = setTimeout(() => setLines(1), 800); // Command typed
    let t2 = setTimeout(() => setLines(2), 1500); // Starting
    let t3 = setTimeout(() => setLines(3), 2000); // Report
    let t4 = setTimeout(() => setLines(4), 2200); // Headers
    let t5 = setTimeout(() => setLines(8), 3000); // Ports bulk
    let t6 = setTimeout(() => setLines(9), 4500); // Analyzing...
    let t7 = setTimeout(() => setLines(10), 6000); // Results
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); clearTimeout(t7); };
  }, []);

  return (
    <div className="p-5 font-mono text-sm leading-relaxed">
      <p className="text-cyber-green">$ {lines >= 1 ? "nmap -sV -sC -O 192.168.1.100" : <span className="animate-pulse">_</span>}</p>
      {lines >= 2 && <p className="mt-2 text-cyber-muted">Starting Nmap 7.95 ( https://nmap.org )</p>}
      {lines >= 3 && <p className="text-cyber-muted">Nmap scan report for 192.168.1.100</p>}
      {lines >= 4 && <p className="mt-2 text-cyber-text">PORT &nbsp;&nbsp;&nbsp;STATE SERVICE &nbsp;VERSION</p>}
      {lines >= 8 && (
        <>
          <p className="text-cyber-red">21/tcp open &nbsp;ftp &nbsp;&nbsp;&nbsp;&nbsp;vsftpd 2.3.4</p>
          <p className="text-cyber-orange">22/tcp open &nbsp;ssh &nbsp;&nbsp;&nbsp;&nbsp;OpenSSH 4.7p1</p>
          <p className="text-cyber-orange">80/tcp open &nbsp;http &nbsp;&nbsp;&nbsp;Apache httpd 2.2.8</p>
          <p className="text-cyber-muted">443/tcp open &nbsp;ssl &nbsp;&nbsp;&nbsp;&nbsp;OpenSSL 0.9.8g</p>
        </>
      )}
      {lines >= 9 && (
        <div className="mt-4 border-t border-cyber-border pt-4">
          <p className="text-cyber-cyan">→ VulnAI analyzing...<span className="ml-1 inline-block" style={{ animation: "blink 1s step-end infinite" }}>█</span></p>
          {lines >= 10 && <p className="mt-1 text-cyber-green">→ 4 vulnerabilities detected (2 CRITICAL, 1 HIGH, 1 MEDIUM) ✓</p>}
        </div>
      )}
    </div>
  );
};

// Framer Motion Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function LandingPage() {
  const { formatPrice, currency, loading: currencyLoading, exchangeRate } = useCurrency();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cyber-bg" style={{ scrollBehavior: "smooth" }}>
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="VulnAI Logo" width={36} height={36} className="rounded-lg group-hover:shadow-[0_0_12px_rgba(0,212,255,0.4)] transition-all" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">Pricing</Link>
            <Link href="/about" className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link href="/dashboard" className="rounded-lg bg-cyber-cyan px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-cyber-bg transition-all hover:opacity-90 hover:scale-105 active:scale-95">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block rounded-lg border border-cyber-cyan/30 px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-cyber-cyan hover:bg-cyber-cyan/10 transition-all">
                  Sign In
                </Link>
                <Link href="/signup" className="rounded-lg bg-cyber-cyan px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-cyber-bg transition-all hover:opacity-90 hover:scale-105 active:scale-95">
                  Get Started
                </Link>
              </>
            )}
            
            {/* Hamburger button */}
            <button 
              className="md:hidden text-cyber-muted hover:text-cyber-cyan focus:outline-none ml-2" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cyber-border bg-cyber-bg/95 backdrop-blur-md absolute top-full left-0 w-full shadow-2xl">
            <div className="flex flex-col px-6 py-4 gap-0">
              <Link href="/features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block py-4 text-sm font-medium text-cyber-text hover:text-cyber-cyan transition-colors border-b border-cyber-border/50">Features</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-sm font-medium text-cyber-text hover:text-cyber-cyan transition-colors border-b border-cyber-border/50">Pricing</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block py-4 text-sm font-medium text-cyber-text hover:text-cyber-cyan transition-colors border-b border-cyber-border/50">About Us</Link>
              <div className="pt-6 pb-2">
                {!user ? (
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="flex justify-center w-full rounded-lg bg-cyber-cyan px-5 py-3 text-sm font-bold text-cyber-bg transition-all hover:opacity-90">
                    Get Started
                  </Link>
                ) : (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex justify-center w-full rounded-lg bg-cyber-cyan px-5 py-3 text-sm font-bold text-cyber-bg transition-all hover:opacity-90">
                    Dashboard →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-24 text-center overflow-hidden">
        {/* Animated glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="h-[600px] w-[600px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)", animation: "pulse-glow 4s ease-in-out infinite" }} />
        </div>
        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-cyber-cyan animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyber-cyan" />
            Powered by Gemini AI · 2026
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-cyber-text sm:text-5xl md:text-6xl lg:text-7xl">
            Turn Raw Scan Output
            <br />
            <span className="text-cyber-cyan">Into Professional Pentest Reports</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-cyber-muted sm:text-lg">
            Paste your Nmap, Nikto, Burp Suite, or OpenVAS scan output — our AI
            generates a complete vulnerability assessment with severity
            ratings, CVE references, and remediation steps in seconds.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={user ? "/dashboard" : "/signup"} className="group rounded-lg bg-cyber-cyan px-8 py-4 text-base font-bold text-cyber-bg transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_50px_rgba(0,212,255,0.5)]">
              ⚡ Generate Free Report →
            </Link>
            <a href="#how" className="rounded-lg border border-cyber-border px-8 py-4 text-base font-semibold text-cyber-muted transition-all hover:border-cyber-cyan hover:text-cyber-cyan bg-cyber-bg/50 backdrop-blur-sm">
              ▶ Watch Demo
            </a>
          </div>

          <div className="mt-12 mb-8 flex flex-col items-center justify-center">
            <div className="flex -space-x-4 mb-4">
              {['A', 'T', 'B', 'M', 'J'].map((initial, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-cyber-bg bg-cyber-card flex items-center justify-center text-xs font-bold text-cyber-cyan shadow-lg z-[1] hover:z-[10] transition-all hover:scale-110">
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-cyber-muted">
              Joined by pentesters at <span className="text-white">Access Bank</span>, <span className="text-white">Cowrywise</span>, <span className="text-white">Flutterwave</span> & more
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-cyber-muted sm:gap-12 bg-cyber-card/30 backdrop-blur-md border border-cyber-border/50 py-6 px-8 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl text-cyber-cyan mb-1"><AnimatedCounter end={24700} suffix="+" /></span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-cyber-muted">Reports Generated</span>
            </div>
            <div className="h-10 w-px bg-cyber-border hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl text-cyber-cyan mb-1"><AnimatedCounter end={143200} suffix="+" /></span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-cyber-muted">Vulns Found</span>
            </div>
            <div className="h-10 w-px bg-cyber-border hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl text-cyber-cyan mb-1"><AnimatedCounter end={2100} suffix="+" /></span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-cyber-muted">Active Users</span>
            </div>
          </div>
        </div>

        {/* Terminal Demo */}
        <div className="relative z-10 mt-16 mx-auto max-w-3xl w-full">
          <div className="group overflow-hidden rounded-xl border border-cyber-border bg-cyber-card transition-all duration-500 hover:border-cyber-cyan/40 hover:shadow-[0_0_60px_rgba(0,212,255,0.08)]">
            <div className="flex items-center gap-2 border-b border-cyber-border px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-cyber-red" />
              <div className="h-3 w-3 rounded-full bg-cyber-orange" />
              <div className="h-3 w-3 rounded-full bg-cyber-green" />
              <span className="ml-3 text-xs text-cyber-muted">terminal — nmap_scan.txt</span>
            </div>
            <TerminalTypewriter />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="px-6 py-24 border-t border-cyber-border bg-[#111318]">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-4xl md:text-5xl font-bold text-white leading-tight">How it works</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-base text-cyber-muted">Three simple steps to go from raw scan data to a professional report.</p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Desktop Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent -translate-y-1/2 z-0 pointer-events-none" />
            
            {STEPS.map((step) => (
              <motion.div variants={staggerItem} key={step.num} className="relative group z-10">
                <div className="bg-cyber-card border border-cyber-border rounded-xl p-8 hover:border-cyber-cyan/40 hover:shadow-[0_0_25px_rgba(0,212,255,0.06)] transition-all duration-300 overflow-hidden text-center relative flex flex-col items-center">
                  <div className="absolute -bottom-4 -right-4 text-[120px] font-bold text-cyber-cyan/5 font-mono pointer-events-none select-none">{step.num}</div>
                  {step.icon}
                  <h3 className="text-lg font-bold text-white mb-3 z-10">{step.title}</h3>
                  <p className="text-sm text-cyber-muted leading-relaxed z-10">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-4xl md:text-5xl font-bold text-white leading-tight">Everything you need</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-base text-cyber-muted">From scan input to client-ready report — VulnAI handles the entire vulnerability documentation workflow.</p>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <motion.div variants={staggerItem} key={f.title} className="group rounded-xl border border-cyber-border bg-cyber-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-opacity-50 hover:shadow-[0_0_25px_rgba(0,212,255,0.06)]" style={{ ["--hover-color" as string]: f.color }}>
                <div className="mb-4 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: f.color + "15", border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-cyber-text">{f.title}</h3>
                  {f.comingSoon && (
                    <span className="bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/30 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-cyber-muted">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="px-6 py-24 bg-[#111318] border-t border-cyber-border relative overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-[0.02]">
          <div className="w-full h-full" style={{ background: "radial-gradient(circle, rgba(0,212,255,1) 0%, transparent 60%)" }}></div>
        </div>
        <div className="mx-auto max-w-7xl relative z-10">
          <h2 className="mb-4 text-center text-4xl md:text-5xl font-bold text-white leading-tight">Trusted by Professionals</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-base text-cyber-muted">See what security teams are saying about VulnAI.</p>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div variants={staggerItem} key={idx} className="relative rounded-2xl border border-cyber-border bg-cyber-card p-8 flex flex-col">
                <div className="absolute -top-4 left-8 text-5xl text-cyber-cyan/20 font-serif">"</div>
                <p className="relative z-10 text-cyber-muted leading-relaxed mb-6 italic max-w-prose flex-1">{t.text}</p>
                <div className="flex text-cyber-cyan gap-1 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} size={14} fill="currentColor" />)}
                </div>
                <div className="flex items-center gap-4 border-t border-cyber-border/50 pt-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{t.name}</h4>
                    <p className="text-xs text-cyber-muted">{t.role} @ <span className="text-cyber-cyan">{t.company}</span></p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SCANNERS ─── */}
      <section className="px-6 py-16 border-t border-cyber-border">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <SectionBadge>
              <span className="text-cyber-cyan font-mono">&gt;_</span> SUPPORTED SCANNERS
            </SectionBadge>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">Works with every tool in your stack</h2>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SCANNERS.map((s) => {
              const colorMap: Record<string, string> = {
                cyan: "#00D4FF",
                purple: "#8B5CF6",
                orange: "#F59E0B",
                green: "#10B981",
                blue: "#3B82F6",
                red: "#EF4444",
                amber: "#F97316",
                gray: "#6B7280",
              };
              const hex = colorMap[s.color] || colorMap.cyan;

              return (
                <motion.div variants={staggerItem} key={s.name} className="relative rounded-xl border border-cyber-border bg-cyber-card p-5 hover:-translate-y-1 transition-all duration-300 group" style={{ "--hover-border": hex } as React.CSSProperties}>
                  <style jsx>{`
                    .group:hover { border-color: ${hex}50; box-shadow: 0 0 15px ${hex}15; }
                  `}</style>
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-bold" style={{ backgroundColor: `${hex}15`, color: hex, border: `1px solid ${hex}30` }}>
                    &gt;_
                  </div>
                  <h3 className="text-base font-bold text-cyber-muted mb-1 group-hover:text-white transition-colors">{s.name}</h3>
                  <p className="text-xs text-cyber-muted">{s.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="px-6 py-24 bg-cyber-card/30 border-y border-cyber-border">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionBadge>PRICING</SectionBadge>
            <h2 className="mb-4 text-4xl md:text-5xl font-bold text-white leading-tight">Simple, transparent pricing</h2>
            <p className="text-base text-cyber-muted">
              {currency !== "USD" && !currencyLoading && (
                <span className="block mb-2 text-cyber-cyan text-sm">✨ Prices automatically converted to {currency}</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="rounded-2xl border border-cyber-border bg-cyber-card p-8 flex flex-col hover:border-cyber-cyan/30 transition-colors">
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">₦0</span>
                <span className="text-cyber-muted text-sm">/month</span>
              </div>
              <p className="text-sm text-cyber-muted mb-8 h-10">Perfect for students and first-time pentesters exploring AI-powered reports.</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> 3 reports per day</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Report history: 7 days</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Basic PDF export</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> All scanner types</li>
                <li className="flex items-center gap-3 text-cyber-border text-sm opacity-50"><span className="text-cyber-border">✕</span> Email report delivery</li>
                <li className="flex items-center gap-3 text-cyber-border text-sm opacity-50"><span className="text-cyber-border">✕</span> Shareable report links</li>
              </ul>
              
              <Link href={user ? "/dashboard" : "/signup"} className="w-full py-3 rounded-lg border border-cyber-border text-center text-sm font-semibold text-white hover:border-cyber-cyan hover:text-cyber-cyan transition-all">
                Get Started Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border border-cyber-cyan bg-cyber-card p-8 flex flex-col relative shadow-[0_0_30px_rgba(0,212,255,0.08)] transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyber-cyan text-cyber-bg text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2 mt-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-cyber-cyan">₦5,000</span>
                <span className="text-cyber-muted text-sm">/month</span>
              </div>
              <p className="text-sm text-cyber-muted mb-8 h-10">For professional pentesters and security consultants who need unlimited access.</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Unlimited reports</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Full report history forever</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Branded PDF export</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> All scanner types</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Email report delivery</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Shareable report links</li>
              </ul>
              
              <PaystackButton
                amount={5000 * 100}
                currency="NGN"
                className="w-full py-3 rounded-lg bg-cyber-cyan text-center text-sm font-bold text-cyber-bg hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.2)]"
              />
            </div>

            {/* Enterprise Tier */}
            <div className="rounded-2xl border border-cyber-border bg-cyber-card p-8 flex flex-col hover:border-cyber-cyan/30 transition-colors">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <p className="text-sm text-cyber-muted mb-8 h-10">For Nigerian fintechs, banks, and IT firms needing compliance-grade audit reports.</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Everything in Pro</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> White-label PDF branding</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Up to 20 team members</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Priority support</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> API access</li>
                <li className="flex items-center gap-3 text-cyber-muted text-sm"><span className="text-cyber-cyan">✓</span> Custom email templates</li>
              </ul>
              
              <a href="mailto:sales@vulnai.com" className="w-full py-3 rounded-lg border border-cyber-border text-center text-sm font-semibold text-white hover:border-cyber-cyan hover:text-cyber-cyan transition-all block">
                Contact Sales
              </a>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/pricing" className="text-sm text-cyber-cyan hover:underline decoration-cyber-cyan/50 underline-offset-4">
              See full feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-cyber-border bg-gradient-to-b from-cyber-card to-cyber-bg p-12 text-center sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex items-center justify-center gap-2">
              <Image src="/logo.png" alt="VulnAI" width={48} height={48} className="rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.4)]" />
              <span className="text-3xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Ready to write your first <span className="text-cyber-cyan">AI-powered</span> pentest report?</h2>
            <p className="mb-8 text-base text-cyber-muted">Join 2,100+ security professionals automating their workflow.</p>
            <Link href={user ? "/dashboard" : "/signup"} className="inline-block rounded-lg bg-cyber-cyan px-10 py-4 text-base font-bold text-cyber-bg transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      <div className="text-center py-6 text-sm text-cyber-muted border-t border-cyber-border/50">
        3 free reports daily · No credit card · Cancel anytime
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-cyber-border bg-cyber-card/50 px-6 pt-16 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Image src="/logo.png" alt="VulnAI" width={24} height={24} className="rounded" />
                <span className="text-lg font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
              </div>
              <p className="text-sm text-cyber-muted mb-6 leading-relaxed">
                Transform raw vulnerability scan output into professional pentest reports in under 60 seconds — powered by Google Gemini AI.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.8c0-1.2-.4-2.4-1.2-3.2 3-.3 6.1-1.5 6.1-6.6 0-1.5-.5-2.7-1.4-3.6.1-.3.6-1.7-.1-3.6 0 0-1.1-.4-3.6 1.3-1.1-.3-2.2-.4-3.3-.4-1.1 0-2.2.1-3.3.4-2.5-1.7-3.6-1.3-3.6-1.3-.7 1.9-.2 3.3-.1 3.6-.9.9-1.4 2.1-1.4 3.6 0 5.1 3 6.3 6 6.6-.8.7-1.1 1.9-1.1 3.2V22"></path></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="mailto:hello@vulnai.com" className="w-8 h-8 rounded border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors"><Mail size={16} /></a>
              </div>
            </div>

            {/* Product Column */}
            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-cyber-muted">
                <li><Link href="/dashboard" className="hover:text-cyber-cyan transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard?tab=history" className="hover:text-cyber-cyan transition-colors">Report History</Link></li>
                <li><Link href="/analytics" className="hover:text-cyber-cyan transition-colors">Analytics</Link></li>
                <li><Link href="/pricing" className="hover:text-cyber-cyan transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-cyber-muted">
                <li><Link href="/about" className="hover:text-cyber-cyan transition-colors">About Us</Link></li>
                <li><a href="mailto:hello@vulnai.com" className="hover:text-cyber-cyan transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-cyber-muted">
                <li><Link href="/privacy" className="hover:text-cyber-cyan transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-cyber-cyan transition-colors">Terms of Service</Link></li>
                <li><Link href="/ndpr" className="hover:text-cyber-cyan transition-colors font-medium">NDPR Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-cyber-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cyber-muted">
            <p>© 2026 VulnAI. All rights reserved.</p>
            <p>Built by <span className="text-white">Joshuazaza</span> · Enugu, Nigeria 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
