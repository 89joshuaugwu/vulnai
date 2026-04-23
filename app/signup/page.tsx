"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { saveOtpToFirestore } from "@/lib/db";

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password validation state
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password !== "" && password === confirmPassword;
  const isValidPassword = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword) {
      toast.error("Please meet all password requirements and ensure passwords match");
      return;
    }

    setLoading(true);
    try {
      // 1. Send OTP via Email API (server handles generation and storage)
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'signup' })
      });
      
      if (!res.ok) throw new Error("Failed to send verification email");

      // 4. Redirect to verify page with encoded data
      const data = encodeURIComponent(JSON.stringify({ email, password }));
      router.push(`/verify?data=${data}`);
      toast.success("Verification code sent to your email!");

    } catch (error: any) {
      toast.error(error.message || "Failed to start signup process");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Google sign in failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-bg p-4 sm:p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50" />
        
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="VulnAI" width={48} height={48} style={{ width: 'auto', height: 'auto' }} className="rounded-xl" />
            <span className="text-xl font-bold mb-4"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-cyber-text">Create Account</h1>
          <p className="text-sm text-cyber-muted mt-2">Join VulnAI to start generating reports</p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-3 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
              placeholder="pentester@example.com"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">Secure Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-3 pr-12 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan"
              >
                {showPassword ? (
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
            
            <div className="mt-4">
              <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-3 pr-12 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-cyan"
                >
                  {showConfirmPassword ? (
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
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
                <span>{passwordsMatch ? '✓' : '○'}</span> Passwords match
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !isValidPassword || !email}
            className="w-full bg-cyber-cyan text-cyber-bg font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Sending Code..." : "Continue with Email"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-cyber-border" />
          <span className="text-xs text-cyber-muted font-semibold uppercase tracking-wider">Or</span>
          <div className="flex-1 h-px bg-cyber-border" />
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full bg-cyber-bg border border-cyber-border text-cyber-text font-bold py-3 rounded-lg hover:border-cyber-cyan transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>

        <p className="text-center text-sm text-cyber-muted mt-8">
          Already have an account? <Link href="/login" className="text-cyber-cyan hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
