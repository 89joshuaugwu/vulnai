"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { claimAdminStatus } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

export default function AdminSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    if (!user) {
      toast.error("You must be signed in to claim admin access");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      await claimAdminStatus(user.uid);
      toast.success("Admin privileges granted successfully!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.message || "Failed to grant admin access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-red to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} className="rounded-xl" />
            <span className="text-xl font-bold mb-4"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span> <span className="text-cyber-red ml-1">Setup</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-cyber-text text-center">First Admin Initialization</h1>
          <p className="text-sm text-cyber-muted mt-2 text-center">
            Click the button below to grant your account <br/>
            <span className="text-cyber-red font-semibold uppercase">Super Admin</span> privileges.
          </p>
        </div>

        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 mb-6">
          <p className="text-xs text-cyber-muted">
            <span className="text-cyber-orange font-bold">⚠️ Security Notice:</span> 
            Once you claim admin access, you should delete this setup page from your project files (`app/admin/setup/page.tsx`) or lock down `firestore.rules` before going to production.
          </p>
        </div>

        {!user ? (
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-cyber-card border border-cyber-cyan text-cyber-cyan font-bold py-3 rounded-lg hover:bg-cyber-cyan/10 transition-all"
          >
            Sign In First
          </button>
        ) : (
          <button 
            onClick={handleClaim}
            disabled={loading}
            className="w-full bg-cyber-red text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(248,81,73,0.3)]"
          >
            {loading ? "Granting Access..." : "Claim Admin Privileges"}
          </button>
        )}

      </div>
    </div>
  );
}
