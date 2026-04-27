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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password validation state
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isValidPassword = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

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
    if (!isValidPassword) return toast.error("Please meet all password requirements.");
    
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
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50" />

        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2 mb-6 group">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} className="rounded-xl group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all" />
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
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-cyber-muted/50 transition-all hover:border-cyber-border-hover" placeholder="pentester@example.com" />
              </div>
              <button type="submit" disabled={loading || !email} className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none mt-2 text-sm active:scale-[0.98]">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />Sending...</span> : "Send OTP"}
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
                <input type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 text-center text-xl font-mono text-white transition-all tracking-[0.5em] placeholder:text-cyber-border hover:border-cyber-border-hover" placeholder="000000" />
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[#080b0f] border border-cyber-border rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder:text-cyber-muted/50 transition-all hover:border-cyber-border-hover" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan">
                    {showNewPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
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
                </div>
              </div>

              <button type="submit" disabled={loading || otp.length !== 6 || !isValidPassword} className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none mt-4 text-sm active:scale-[0.98]">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />Resetting...</span> : "Reset Password"}
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
