"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  onClick?: () => void;
}

interface SidebarProps {
  navItems: NavItem[];
  activeItem: string;
  onNavChange: (id: string) => void;
  variant?: "user" | "admin";
}

export default function Sidebar({ navItems, activeItem, onNavChange, variant = "user" }: SidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: string, onClick?: () => void) => {
    onNavChange(id);
    onClick?.();
    setMobileOpen(false); // Close on mobile after click
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-cyber-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="VulnAI" width={32} height={32} style={{ width: 'auto', height: 'auto' }} className="rounded-lg group-hover:shadow-[0_0_12px_rgba(0,212,255,0.4)] transition-all" />
          <span className="text-lg font-bold">
            <span className="text-white">Vuln</span>
            <span className="text-cyber-cyan">AI</span>
          </span>
        </Link>
        {variant === "admin" && (
          <span className="text-[9px] font-bold text-cyber-red bg-cyber-red/10 border border-cyber-red/30 px-1.5 py-0.5 rounded uppercase tracking-widest">Admin</span>
        )}
        {/* Mobile close button */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-cyber-muted hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest px-3 mb-3">
          {variant === "admin" ? "Administration" : "Workspace"}
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id, item.onClick)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
            style={activeItem === item.id ? {
              backgroundColor: variant === "admin" ? "rgba(248,81,73,0.1)" : "rgba(0,212,255,0.1)",
              color: variant === "admin" ? "#f85149" : "#00d4ff",
              borderColor: variant === "admin" ? "rgba(248,81,73,0.2)" : "rgba(0,212,255,0.2)",
            } : {
              backgroundColor: "transparent",
              color: "#8b949e",
              borderColor: "transparent",
            }}
          >
            <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Quick Links */}
        <div className="pt-6">
          <p className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest px-3 mb-3">Quick Links</p>
          {variant === "admin" ? (
            <Link href="/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-card transition-all border border-transparent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" /></svg>
              <span>User Dashboard</span>
            </Link>
          ) : (
            <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cyber-muted hover:text-cyber-text hover:bg-cyber-card transition-all border border-transparent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Home</span>
            </Link>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-cyber-border bg-[#080b0f]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center text-xs font-bold text-cyber-bg flex-shrink-0">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-cyber-text truncate">{user.email}</p>
                <p className="text-[10px] text-cyber-muted">{variant === "admin" ? "Administrator" : "Member"}</p>
              </div>
            </div>
            <button onClick={signOut} className="w-full text-xs text-cyber-red hover:bg-cyber-red/10 border border-transparent hover:border-cyber-red/20 px-3 py-2 rounded-lg transition-all font-semibold">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => router.push("/login")} className="w-full text-xs font-bold text-cyber-cyan border border-cyber-cyan/30 px-3 py-2 rounded-lg hover:bg-cyber-cyan/10 transition-all">
            Sign In
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - fixed top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0d12] border-b border-cyber-border px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="VulnAI" width={28} height={28} style={{ width: 'auto', height: 'auto' }} className="rounded-lg" />
          <span className="text-base font-bold">
            <span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span>
          </span>
          {variant === "admin" && <span className="text-[8px] font-bold text-cyber-red bg-cyber-red/10 px-1 py-0.5 rounded uppercase">Admin</span>}
        </Link>
        <button onClick={() => setMobileOpen(true)} className="text-cyber-muted hover:text-white p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - desktop: always visible, mobile: slide in */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-[#0a0d12] border-r border-cyber-border flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        {sidebarContent}
      </aside>
    </>
  );
}
