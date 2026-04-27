"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

const PLANS = [
  {
    name: "Hacker",
    badge: "FREE",
    price: "₦0",
    period: "forever",
    color: "#8B949E",
    features: [
      { text: "3 reports per day", included: true },
      { text: "All 10 scanner types", included: true },
      { text: "PDF, Markdown, HTML, JSON export", included: true },
      { text: "7-day report history", included: true },
      { text: "Email OTP verification", included: true },
      { text: "Unlimited reports", included: false },
      { text: "Permanent report history", included: false },
      { text: "Priority AI model", included: false },
      { text: "Shareable report links", included: false },
      { text: "Email scan alerts", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "/signup",
    popular: false,
  },
  {
    name: "Pro Pentester",
    badge: "POPULAR",
    price: "₦5,000",
    period: "/month",
    color: "#00D4FF",
    features: [
      { text: "Unlimited reports per day", included: true },
      { text: "All 10 scanner types", included: true },
      { text: "PDF, Markdown, HTML, JSON export", included: true },
      { text: "Permanent report history", included: true },
      { text: "Email OTP verification", included: true },
      { text: "Advanced Gemini Pro reasoning", included: true },
      { text: "Scan completion email alerts", included: true },
      { text: "Shareable report links", included: true },
      { text: "2FA login security", included: true },
      { text: "Priority support", included: false },
    ],
    cta: "Upgrade to Pro",
    ctaLink: null, // Paystack button
    popular: true,
  },
  {
    name: "Enterprise",
    badge: "CUSTOM",
    price: null,
    period: "",
    color: "#A371F7",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "White-label PDF branding", included: true },
      { text: "Custom AI prompts", included: true },
      { text: "API access for integrations", included: true },
      { text: "SSO / SAML authentication", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "SLA guarantee", included: true },
      { text: "On-premise deployment option", included: true },
      { text: "Custom scanner support", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:joshuaugwu89@gmail.com?subject=VulnAI Enterprise Inquiry",
    popular: false,
  },
];

const FAQ = [
  {
    q: "What counts as a 'report'?",
    a: "Every time you paste scan data and click Generate, that counts as one report. Editing or re-downloading an existing report does not count.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes — you can cancel at any time. Your Pro access remains active until the end of your current billing period. No refunds for partial months.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We use Paystack, which supports Nigerian debit cards, bank transfers, USSD, and international Visa/Mastercard.",
  },
  {
    q: "Is my scan data secure?",
    a: "Your scan data is processed server-side through Google Gemini AI and never stored in plain text. Reports are encrypted at rest in Firebase Firestore.",
  },
  {
    q: "Do I need a credit card for the free plan?",
    a: "No. The free tier requires no payment method. Just sign up with your email and start generating reports immediately.",
  },
  {
    q: "What happens when my subscription expires?",
    a: "You'll be downgraded to the Free tier automatically. All your historical reports remain accessible — you just go back to 3 reports/day.",
  },
];

export default function PricingPage() {
  const { formatPrice, currency, exchangeRate } = useCurrency();
  const { user } = useAuth();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cyber-bg">
      {/* Nav */}
      <nav className="border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="VulnAI" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm bg-cyber-cyan text-cyber-bg font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-cyber-muted hover:text-white transition-colors">Sign In</Link>
                <Link href="/signup" className="text-sm bg-cyber-cyan text-cyber-bg font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-20 pb-12 px-6">
        <span className="inline-block text-xs font-bold text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/20 px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">Pricing</span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-cyber-muted max-w-2xl mx-auto">Start for free. Upgrade when you need unlimited power. No hidden fees.</p>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative bg-cyber-card border rounded-2xl p-8 flex flex-col ${plan.popular ? 'border-cyber-cyan shadow-[0_0_40px_rgba(0,212,255,0.1)] scale-[1.02]' : 'border-cyber-border'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyber-cyan text-cyber-bg text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: plan.color }}>{plan.badge}</span>
                <h3 className="text-xl font-bold text-white mt-2">{plan.name}</h3>
              </div>
              <div className="mb-8">
                {plan.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-cyber-muted">{plan.period}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">Custom</span>
                    <span className="text-sm text-cyber-muted">pricing</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-cyber-text' : 'text-cyber-muted/40'}`}>
                    <span className={`mt-0.5 text-xs ${f.included ? 'text-cyber-green' : 'text-cyber-muted/30'}`}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {plan.ctaLink ? (
                <Link href={plan.ctaLink} className={`w-full text-center py-3 rounded-lg font-bold text-sm transition-all ${plan.popular ? 'bg-cyber-cyan text-cyber-bg hover:opacity-90' : 'bg-cyber-bg border border-cyber-border text-cyber-text hover:border-cyber-cyan hover:text-cyber-cyan'}`}>
                  {plan.cta}
                </Link>
              ) : (
                <Link href={user ? "/dashboard?tab=settings" : "/signup"} className="w-full text-center py-3 rounded-lg font-bold text-sm bg-cyber-cyan text-cyber-bg hover:opacity-90 transition-all block">
                  {user ? "Upgrade in Dashboard" : "Sign Up to Upgrade"}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Full Feature Comparison</h2>
        <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden table-responsive">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-cyber-border bg-[#0D1117] sticky top-0 z-10">
                <th className="text-left p-4 text-cyber-muted font-bold text-xs uppercase tracking-wider">Feature</th>
                <th className="p-4 text-cyber-muted font-bold text-center text-xs uppercase tracking-wider">Hacker<br/><span className="text-[10px] font-normal normal-case tracking-normal">Free</span></th>
                <th className="p-4 text-cyber-cyan font-bold text-center text-xs uppercase tracking-wider">Pro<br/><span className="text-[10px] font-normal normal-case tracking-normal">₦5,000/mo</span></th>
                <th className="p-4 font-bold text-center text-xs uppercase tracking-wider" style={{ color: '#A371F7' }}>Enterprise<br/><span className="text-[10px] font-normal normal-case tracking-normal">Custom</span></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Reports per day", "3", "Unlimited", "Unlimited"],
                ["Report history", "7 days", "Forever", "Forever"],
                ["Export formats", "All 4", "All 4", "All 4 + White-label"],
                ["Scanner types", "All 10", "All 10", "All 10 + Custom"],
                ["AI model", "Standard", "Advanced", "Advanced"],
                ["Email notifications", false, true, true],
                ["Shareable links", false, true, true],
                ["2FA security", true, true, true],
                ["Team members", "1", "1", "Up to 20"],
                ["API access", false, false, true],
                ["Custom branding", false, false, true],
                ["Priority support", false, false, true],
              ].map(([feature, free, pro, ent], i) => {
                const renderCell = (val: string | boolean) => {
                  if (val === true) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-green/10"><svg className="w-4 h-4 text-cyber-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>;
                  if (val === false) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyber-red/10"><svg className="w-3.5 h-3.5 text-cyber-red/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></span>;
                  return <span className="font-mono text-xs">{val}</span>;
                };
                return (
                  <tr key={i} className={`border-b border-cyber-border/30 last:border-0 transition-colors hover:bg-cyber-surface/50 ${i % 2 === 0 ? 'bg-transparent' : 'bg-cyber-bg/30'}`}>
                    <td className="p-4 text-cyber-text font-medium">{feature as string}</td>
                    <td className="p-4 text-center text-cyber-muted">{renderCell(free)}</td>
                    <td className="p-4 text-center text-cyber-text">{renderCell(pro)}</td>
                    <td className="p-4 text-center text-cyber-text">{renderCell(ent)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
              <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)} className="w-full text-left p-5 flex items-center justify-between">
                <span className="text-sm font-bold text-cyber-text">{item.q}</span>
                <svg className={`w-4 h-4 text-cyber-muted transition-transform ${openFAQ === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFAQ === i && (
                <div className="px-5 pb-5 text-sm text-cyber-muted leading-relaxed border-t border-cyber-border pt-4">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyber-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={24} height={24} className="rounded" />
            <span className="text-sm font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </div>
          <p className="text-sm text-cyber-muted">Built by Joshuazaza · Enugu, Nigeria</p>
        </div>
      </footer>
    </div>
  );
}
