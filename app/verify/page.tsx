"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";
import { verifyOtpFromFirestore } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUpWithEmail } = useAuth();
  
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(dataParam));
        setEmail(decoded.email);
        setPassword(decoded.password);
      } catch (e) {
        toast.error("Invalid verification request");
        router.push("/signup");
      }
    } else {
      router.push("/signup");
    }
  }, [searchParams, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired verification code");
      }

      await signUpWithEmail(email, password);
      
      // Fire signup alert
      fetch("/api/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "signup", email }),
      }).catch(console.error);

      toast.success("Account verified and created successfully!");
      router.push("/dashboard");

    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} className="rounded-xl" />
            <span className="text-xl font-bold mb-4"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-cyber-text">Verify Email</h1>
          <p className="text-sm text-cyber-muted mt-2 text-center">
            We sent a 6-digit code to <br/>
            <span className="font-semibold text-cyber-cyan">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2 text-center">Enter Access Code</label>
            <input 
              type="text" 
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-cyber-bg border border-cyber-cyan/50 rounded-lg px-4 py-4 text-3xl tracking-[0.5em] text-center font-mono text-cyber-cyan focus:border-cyber-cyan focus:outline-none focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
              placeholder="000000"
            />
            <p className="text-xs text-cyber-red mt-2 text-center">Code expires in 10 minutes</p>
          </div>

          <button 
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cyber-bg"><div className="text-cyber-cyan">Loading...</div></div>}>
      <VerifyContent />
    </Suspense>
  );
}
