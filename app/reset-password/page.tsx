"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email."); return; }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error(error.message || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg p-4 sm:p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-orange to-transparent opacity-50" />

        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} style={{ width: 'auto', height: 'auto' }} className="rounded-xl" />
            <span className="text-xl font-bold mb-4"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-cyber-text">Reset Password</h1>
          <p className="text-sm text-cyber-muted mt-2 text-center">
            {sent ? "Check your inbox for the reset link." : "Enter your email to receive a password reset link."}
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="bg-cyber-green/10 border border-cyber-green/20 rounded-lg p-4 text-center">
              <p className="text-sm text-cyber-green font-semibold">✓ Email sent successfully!</p>
              <p className="text-xs text-cyber-muted mt-2">Check your inbox (and spam folder) for a link to reset your password.</p>
            </div>
            <Link href="/login" className="block w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg text-center hover:opacity-90 transition-all text-sm">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-3 text-sm text-cyber-text focus:border-cyber-orange focus:outline-none transition-colors"
                placeholder="pentester@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-cyber-orange text-cyber-bg font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-cyber-muted mt-8">
          Remember your password? <Link href="/login" className="text-cyber-cyan hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
