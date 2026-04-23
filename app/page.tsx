"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/components/AuthProvider";
import dynamic from "next/dynamic";

const PaystackButton = dynamic(() => import("@/components/PaystackButton"), { ssr: false });

const SCANNERS = [
  { name: "Nmap", desc: "Network discovery & port scanning" },
  { name: "Nessus", desc: "Vulnerability assessment" },
  { name: "Burp Suite", desc: "Web app security testing" },
  { name: "OpenVAS", desc: "Open-source vuln scanner" },
  { name: "Nikto", desc: "Web server scanner" },
  { name: "OWASP ZAP", desc: "Dynamic app testing" },
  { name: "Qualys", desc: "Cloud-based scanning" },
  { name: "Metasploit", desc: "Exploitation framework" },
  { name: "Acunetix", desc: "Automated web scanning" },
];

const FEATURES = [
  {
    icon: "🔍",
    title: "Multi-Scanner Support",
    description: "Supports 9+ security scanners including Nmap, Nessus, Burp Suite, OpenVAS, Nikto, OWASP ZAP, and more.",
    color: "#00d4ff",
  },
  {
    icon: "🤖",
    title: "Gemini AI Analysis",
    description: "CREST-style vulnerability assessment with severity classification, CVE references, and remediation steps.",
    color: "#a371f7",
  },
  {
    icon: "📄",
    title: "PDF Export",
    description: "Download professional, client-ready penetration testing reports as formatted PDFs instantly.",
    color: "#3fb950",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    description: "Your scan data never leaves our servers. Firebase-backed authentication with OTP verification.",
    color: "#f85149",
  },
  {
    icon: "📊",
    title: "Report History",
    description: "All your generated reports are saved to your cloud dashboard. Re-view and re-download anytime.",
    color: "#e3b341",
  },
  {
    icon: "⚡",
    title: "Instant Results",
    description: "Paste your scan data and get a complete vulnerability report in under 30 seconds.",
    color: "#00d4ff",
  },
];

const STEPS = [
  { num: "01", title: "Paste Your Scan Output", desc: "Copy raw output from Nmap, Nessus, Burp Suite, or any supported scanner." },
  { num: "02", title: "AI Analyzes Vulnerabilities", desc: "Gemini AI identifies CVEs, classifies severity, and assesses risk impact." },
  { num: "03", title: "Download Professional Report", desc: "Get a formatted PDF with executive summary, findings table, and remediation steps." },
];

export default function LandingPage() {
  const { formatPrice, currency, loading: currencyLoading, exchangeRate } = useCurrency();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cyber-bg" style={{ scrollBehavior: "smooth" }}>
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="VulnAI Logo" width={36} height={36} style={{ width: 'auto', height: 'auto' }} className="rounded-lg group-hover:shadow-[0_0_12px_rgba(0,212,255,0.4)] transition-all" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">Features</a>
            <a href="#how" className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm text-cyber-muted hover:text-cyber-cyan transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="rounded-lg bg-cyber-cyan px-5 py-2.5 text-sm font-bold text-cyber-bg transition-all hover:opacity-90 hover:scale-105 active:scale-95">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-lg border border-cyber-cyan/30 px-5 py-2.5 text-sm font-semibold text-cyber-cyan hover:bg-cyber-cyan/10 transition-all">
                  Sign In
                </Link>
                <Link href="/signup" className="rounded-lg bg-cyber-cyan px-5 py-2.5 text-sm font-bold text-cyber-bg transition-all hover:opacity-90 hover:scale-105 active:scale-95">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden">
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
            Turn Raw Scan Output Into
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-[#a371f7]">Professional Pentest Reports</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-cyber-muted sm:text-lg">
            Paste your Nmap, Nikto, Burp Suite, or OpenVAS scan output — our AI
            generates a complete vulnerability assessment with severity
            ratings, CVE references, and remediation steps in seconds.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={user ? "/dashboard" : "/signup"} className="group rounded-lg bg-cyber-cyan px-8 py-4 text-base font-bold text-cyber-bg transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_50px_rgba(0,212,255,0.5)]">
              🚀 Generate Free Report
            </Link>
            <a href="#how" className="rounded-lg border border-cyber-border px-8 py-4 text-base font-semibold text-cyber-muted transition-all hover:border-cyber-cyan hover:text-cyber-cyan">
              See how it works ↓
            </a>
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
            <div className="p-5 font-mono text-sm leading-relaxed">
              <p className="text-cyber-green">$ nmap -sV -sC -O 192.168.1.100</p>
              <p className="mt-2 text-cyber-muted">Starting Nmap 7.95 ( https://nmap.org )</p>
              <p className="text-cyber-muted">Nmap scan report for 192.168.1.100</p>
              <p className="mt-2 text-cyber-text">PORT &nbsp;&nbsp;&nbsp;STATE SERVICE &nbsp;VERSION</p>
              <p className="text-cyber-red">21/tcp open &nbsp;ftp &nbsp;&nbsp;&nbsp;&nbsp;vsftpd 2.3.4</p>
              <p className="text-cyber-orange">22/tcp open &nbsp;ssh &nbsp;&nbsp;&nbsp;&nbsp;OpenSSH 4.7p1</p>
              <p className="text-cyber-orange">80/tcp open &nbsp;http &nbsp;&nbsp;&nbsp;Apache httpd 2.2.8</p>
              <p className="text-cyber-muted">443/tcp open &nbsp;ssl &nbsp;&nbsp;&nbsp;&nbsp;OpenSSL 0.9.8g</p>
              <div className="mt-4 border-t border-cyber-border pt-4">
                <p className="text-cyber-cyan">→ VulnAI analyzing...<span className="ml-1 inline-block" style={{ animation: "blink 1s step-end infinite" }}>█</span></p>
                <p className="mt-1 text-cyber-green">→ 4 vulnerabilities detected (2 CRITICAL, 1 HIGH, 1 MEDIUM) ✓</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="px-6 py-24 border-t border-cyber-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-cyber-text sm:text-4xl">How it works</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-base text-cyber-muted">Three simple steps to go from raw scan data to a professional report.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="relative group">
                <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 hover:border-cyber-cyan/40 hover:shadow-[0_0_25px_rgba(0,212,255,0.06)] transition-all duration-300">
                  <span className="text-5xl font-bold text-cyber-cyan/10 font-mono">{step.num}</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-cyber-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-cyber-text sm:text-4xl">Everything you need</h2>
          <p className="mx-auto mb-16 max-w-xl text-center text-base text-cyber-muted">From scan input to client-ready report — VulnAI handles the entire vulnerability documentation workflow.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border border-cyber-border bg-cyber-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-opacity-50 hover:shadow-[0_0_25px_rgba(0,212,255,0.06)]" style={{ ["--hover-color" as string]: f.color }}>
                <div className="mb-4 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: f.color + "15", border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-cyber-text">{f.title}</h3>
                <p className="text-sm leading-relaxed text-cyber-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCANNERS ─── */}
      <section className="px-6 py-16 border-t border-cyber-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-cyber-text">Supported Scanners</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SCANNERS.map((s) => (
              <div key={s.name} className="rounded-xl border border-cyber-border bg-cyber-card p-4 hover:border-cyber-cyan/30 hover:shadow-[0_0_15px_rgba(0,212,255,0.05)] transition-all group">
                <p className="text-sm font-bold text-cyber-cyan group-hover:text-white transition-colors">{s.name}</p>
                <p className="text-[11px] text-cyber-muted mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="px-6 py-24 bg-cyber-card/30 border-y border-cyber-border">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold text-cyber-text sm:text-4xl">Simple, transparent pricing</h2>
            <p className="text-base text-cyber-muted">
              {currency !== "USD" && !currencyLoading && (
                <span className="block mb-2 text-cyber-cyan text-sm">✨ Prices automatically converted to {currency}</span>
              )}
              Start for free, upgrade when you need unlimited reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border border-cyber-border bg-cyber-card p-8 flex flex-col">
              <h3 className="text-xl font-bold text-cyber-text mb-2">Hacker Tier</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-cyber-cyan">{formatPrice(0)}</span>
                <span className="text-cyber-muted text-sm">/ forever</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["3 free reports per day", "Standard Gemini Flash analysis", "Markdown export", "Basic PDF generation"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-cyber-text text-sm"><span className="text-cyber-green">✓</span> {f}</li>
                ))}
              </ul>
              <Link href={user ? "/dashboard" : "/signup"} className="w-full py-3 rounded-lg border border-cyber-border text-center text-sm font-bold text-cyber-text hover:border-cyber-cyan hover:text-cyber-cyan transition-all">
                Start Free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-cyber-cyan bg-cyber-card p-8 flex flex-col relative shadow-[0_0_40px_rgba(0,212,255,0.12)] scale-[1.02]">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-cyber-cyan text-cyber-bg text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
              <h3 className="text-xl font-bold text-cyber-text mb-2">Pro Pentester</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-cyber-cyan">{formatPrice(29)}</span>
                <span className="text-cyber-muted text-sm">/ month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Unlimited reports", "Advanced Gemini Pro reasoning", "Cloud report history", "Custom branding on PDFs", "Priority support"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-cyber-text text-sm"><span className="text-cyber-cyan">✓</span> {f}</li>
                ))}
              </ul>
              <PaystackButton
                amount={currency === "USD" ? 29 * 100 : Math.round(29 * exchangeRate) * 100}
                currency={currency}
                className="w-full py-3 rounded-lg bg-cyber-cyan text-center text-sm font-bold text-cyber-bg hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-cyber-border bg-gradient-to-b from-cyber-card to-cyber-bg p-12 text-center sm:p-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-cyber-text sm:text-4xl">Ready to generate your first report?</h2>
            <p className="mb-8 text-base text-cyber-muted">It&apos;s free. No credit card required. Paste your scan and go.</p>
            <Link href={user ? "/dashboard" : "/signup"} className="inline-block rounded-lg bg-cyber-cyan px-10 py-4 text-base font-bold text-cyber-bg transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-cyber-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={24} height={24} style={{ width: 'auto', height: 'auto' }} className="rounded" />
            <span className="text-sm font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </div>
          <p className="text-sm text-cyber-muted">Built by Joshuazaza · Enugu, Nigeria · Powered by Gemini AI</p>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs text-cyber-muted hover:text-cyber-cyan transition-colors">Sign In</Link>
            <Link href="/signup" className="text-xs text-cyber-muted hover:text-cyber-cyan transition-colors">Sign Up</Link>
            <Link href="/dashboard" className="text-xs text-cyber-muted hover:text-cyber-cyan transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
