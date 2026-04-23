"use client";

import Link from "next/link";
import Image from "next/image";

const TIMELINE = [
  { date: "Jan 2026", title: "Idea Born", desc: "Identified the pain point of manual pentest report writing in Nigerian cybersecurity market." },
  { date: "Feb 2026", title: "MVP Built", desc: "First working prototype using Gemini AI to generate reports from Nmap scans." },
  { date: "Mar 2026", title: "Multi-Scanner Support", desc: "Expanded to support 10 scanner types including Burp Suite, Nessus, and OpenVAS." },
  { date: "Apr 2026", title: "Public Launch", desc: "Full SaaS platform with auth, payments, email alerts, admin dashboard, and Pro tier." },
  { date: "Q3 2026", title: "Team & API", desc: "Enterprise tier with team accounts, API access, and white-label reports.", upcoming: true },
  { date: "Q4 2026", title: "Mobile App", desc: "React Native mobile app for scanning on-the-go and push notifications.", upcoming: true },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cyber-bg">
      {/* Nav */}
      <nav className="border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="VulnAI" width={36} height={36} style={{ width: 'auto', height: 'auto' }} className="rounded-lg" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-cyber-muted hover:text-white transition-colors hidden md:block">Pricing</Link>
            <Link href="/login" className="text-sm text-cyber-muted hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-sm bg-cyber-cyan text-cyber-bg font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center pt-20 pb-16 px-6">
        <span className="inline-block text-xs font-bold text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">About Us</span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">AI-Powered Pentest Reports<br/>Built in Nigeria, For the World</h1>
        <p className="text-lg text-cyber-muted max-w-3xl mx-auto leading-relaxed">
          VulnAI was born from a simple frustration: writing penetration testing reports takes longer than the actual pentest. 
          We believe AI should handle the tedious documentation so security professionals can focus on what matters — finding and fixing vulnerabilities.
        </p>
      </div>

      {/* Problem/Solution */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-2xl mb-5">😤</div>
            <h3 className="text-lg font-bold text-white mb-3">The Problem</h3>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Every security scan produces raw data — ports, versions, flags, CVEs. Converting this into a professional report 
              with executive summaries, severity ratings, risk analysis, and remediation steps takes <strong className="text-cyber-text">3–5 hours per report</strong>. 
              Junior pentesters struggle especially. Nigerian compliance requirements (CBN, NDPR) make it worse.
            </p>
          </div>
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8">
            <div className="w-12 h-12 bg-cyber-green/10 rounded-xl flex items-center justify-center text-2xl mb-5">⚡</div>
            <h3 className="text-lg font-bold text-white mb-3">Our Solution</h3>
            <p className="text-sm text-cyber-muted leading-relaxed">
              Paste your raw scan output. VulnAI's Gemini AI engine analyzes it in <strong className="text-cyber-text">under 60 seconds</strong> and 
              generates a CREST-style penetration testing report with severity classifications, CVE references, CVSS scores, 
              risk impact analysis, and actionable remediation steps — ready to download as PDF.
            </p>
          </div>
        </div>
      </div>

      {/* Who It's For */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Who Uses VulnAI?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: "🔐", title: "Freelance Pentesters", desc: "Deliver client-ready reports in minutes instead of hours." },
            { icon: "🏦", title: "Nigerian IT Firms", desc: "CBN and NDPR compliance requires regular security audits and formal reports." },
            { icon: "🎓", title: "University Students", desc: "Structured pentest reports for cybersecurity capstone projects." },
            { icon: "🐛", title: "Bug Bounty Hunters", desc: "Quick, formatted vulnerability write-ups for HackerOne and Bugcrowd." },
            { icon: "🏢", title: "SME IT Teams", desc: "Small businesses doing self-audits who can't afford a full pentest firm." },
            { icon: "🌍", title: "African Cybersecurity", desc: "Affordable security tooling built for the African market's unique needs." },
          ].map((item, i) => (
            <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl p-6 hover:border-cyber-cyan/30 transition-all">
              <span className="text-2xl mb-3 block">{item.icon}</span>
              <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-cyber-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Founder */}
      <div className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-10">Built by</h2>
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cyber-cyan to-purple-500 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-cyber-bg">J</div>
          <h3 className="text-xl font-bold text-white">Joshuazaza</h3>
          <p className="text-sm text-cyber-cyan mb-4">Founder & Developer</p>
          <p className="text-sm text-cyber-muted leading-relaxed max-w-xl mx-auto">
            Based in Enugu, Nigeria. Passionate about cybersecurity, AI, and building tools that make security accessible 
            to everyone in Africa. VulnAI is the tool I wished existed when I was writing my first pentest report.
          </p>
        </div>
      </div>

      {/* Roadmap */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Roadmap</h2>
        <div className="space-y-0 relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-cyber-border" />
          {TIMELINE.map((item, i) => (
            <div key={i} className="flex gap-5 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${(item as any).upcoming ? 'bg-cyber-bg border-2 border-dashed border-cyber-muted' : 'bg-cyber-cyan/10 border-2 border-cyber-cyan'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${(item as any).upcoming ? 'bg-cyber-muted' : 'bg-cyber-cyan'}`} />
              </div>
              <div className="pb-8">
                <span className={`text-xs font-bold uppercase tracking-wider ${(item as any).upcoming ? 'text-cyber-muted' : 'text-cyber-cyan'}`}>{item.date}</span>
                <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                <p className="text-xs text-cyber-muted mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6 border-t border-cyber-border">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Try VulnAI?</h2>
        <p className="text-cyber-muted mb-8">Generate your first AI-powered pentest report in under 60 seconds.</p>
        <Link href="/signup" className="inline-block bg-cyber-cyan text-cyber-bg font-bold px-8 py-3.5 rounded-lg hover:opacity-90 transition-all text-sm">
          Start for Free — No Credit Card
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyber-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={24} height={24} style={{ width: 'auto', height: 'auto' }} className="rounded" />
            <span className="text-sm font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </div>
          <p className="text-sm text-cyber-muted">© 2026 VulnAI. Built by Joshuazaza · Enugu, Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
