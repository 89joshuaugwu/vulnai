"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP.");
    if (!newPassword || newPassword.length < 8) return toast.error("Password must be at least 8 characters.");
    
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Password reset successfully!");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg p-4 sm:p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-5 sm:p-8 shadow-[0_0_40px_rgba(0,212,255,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50" />

        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2 mb-6 group">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} style={{ width: 'auto', height: 'auto' }} className="rounded-xl group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-sm text-cyber-muted text-center max-w-[280px]">
            {step === 1 && "Enter your email to receive a secure OTP code."}
            {step === 2 && "Enter the OTP sent to your email to verify your identity."}
            {step === 3 && "Create your new password."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-cyan focus:outline-none transition-colors" placeholder="pentester@example.com" />
              </div>
              <button type="submit" disabled={loading || !email} className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 mt-2 text-sm shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </motion.form>
          )}

          {(step === 2 || step === 3) && (
            <motion.form key="step23" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2 flex justify-between">
                  <span>6-Digit OTP</span>
                  <button type="button" onClick={() => setStep(1)} className="text-cyber-cyan hover:underline">Change Email</button>
                </label>
                <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 text-center text-xl font-mono text-white focus:border-cyber-cyan focus:outline-none transition-colors tracking-[0.5em]" placeholder="000000" />
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">New Password</label>
                <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 text-sm text-white focus:border-cyber-cyan focus:outline-none transition-colors" placeholder="••••••••" />
                <p className="text-[10px] text-cyber-muted mt-2">Must be at least 8 characters long.</p>
              </div>

              <button type="submit" disabled={loading || otp.length !== 6 || newPassword.length < 8} className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 mt-4 text-sm shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-cyber-muted mt-8">
          Remember your password? <Link href="/login" className="text-cyber-cyan hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
