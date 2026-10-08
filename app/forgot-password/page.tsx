'use client';

import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { validatePasswordStrength } from '@/lib/security';

type Step = 1 | 2 | 3 | 4;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function ForgotPasswordContent() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto redirect on step 4
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => router.push('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const startCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Za-z]/.test(val) && /\d/.test(val)) score++;
    if (val.length >= 10 && /[A-Z]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setStrengthScore(score);
  };

  // Step 1: Request Password Recovery OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase()
      );

      if (resetError) {
        if (resetError.status === 429) {
          setError('Too many requests. Please wait a moment.');
        } else {
          setError(resetError.message || 'Failed to send recovery code.');
        }
        setLoading(false);
        return;
      }

      startCooldown();
      setStep(2);
    } catch (err) {
      console.error('[ForgotPassword]', err instanceof Error ? err.message : String(err));
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = otp.join('');
    if (token.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'recovery',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code.');
        setLoading(false);
        return;
      }

      setStep(3);
    } catch (err) {
      console.error('[ForgotPassword]', err instanceof Error ? err.message : String(err));
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      setError(strength.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password.');
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setStep(4);
    } catch (err) {
      console.error('[ForgotPassword]', err instanceof Error ? err.message : String(err));
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-yellow-400', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-bg-ice text-primary-blue font-sans flex flex-col justify-between">
      {/* NAVBAR */}
      <header
        className="min-h-[110px] md:h-[125px] relative flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-3 md:py-0 gap-3 md:gap-0 bg-cover bg-right md:bg-center bg-no-repeat shadow-nav border-b border-slate-200"
        style={{
          backgroundImage: "url('/assets/bg2.png')",
          backgroundColor: '#0c3370',
        }}
      >
        <Link href="/" className="relative z-10 flex items-center gap-3.5 group no-underline">
          <Image
            src="/assets/logo_svg.svg"
            alt="TripBoard Logo"
            width={56}
            height={56}
            className="h-12 md:h-14 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            priority
          />
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl md:text-[27px] tracking-[2px] leading-none">
              TRIPBOARD
            </span>
            <span className="text-sky-200/90 text-[10px] md:text-[11px] font-medium tracking-wider mt-1 leading-none">
              Corporate Travel Management. Simplified.
            </span>
          </div>
        </Link>
        <nav className="relative z-10 flex items-center gap-6">
          <Link href="/" className="text-white text-sm font-semibold hover:text-gold-light">
            Home
          </Link>
          <Link href="/login" className="text-white text-sm font-semibold hover:text-gold-light">
            Login
          </Link>
        </nav>
      </header>

      {/* WIZARD CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 my-6">
        <div className="w-full max-w-[650px] bg-white rounded-[20px] p-8 md:p-12 shadow-[0_20px_50px_rgba(11,42,85,0.15)]">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A55] mb-2 tracking-wide">
              {step === 4 ? 'PASSWORD UPDATED' : 'PASSWORD RECOVERY'}
            </h2>
            <p className="text-sm text-slate-500">
              {step === 1 && 'Step 1 of 4: Enter your registered email'}
              {step === 2 && 'Step 2 of 4: Enter the 6-digit recovery code'}
              {step === 3 && 'Step 3 of 4: Set your new password'}
              {step === 4 && 'Your password has been reset successfully'}
            </p>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4].map((s) => (
                <span
                  key={s}
                  className={`w-8 h-2 rounded-full transition-colors ${
                    step >= s ? 'bg-gold-btn' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] hover:shadow-[0_9px_20px_rgba(201,162,39,0.40)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'SENDING CODE...' : 'SEND RECOVERY CODE'}
              </button>
            </form>
          )}

          {/* STEP 2: 6-DIGIT OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex gap-2.5 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-[#D5E5F2] rounded-xl bg-[#F8FCFF] text-[#0B2A55] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < OTP_LENGTH}
                className="w-full py-3.5 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'VERIFYING...' : 'VERIFY CODE'}
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    className="w-full px-4 py-3 pr-11 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1659A5]"
                  >
                    👁
                  </button>
                </div>

                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4].map((lvl) => (
                    <div
                      key={lvl}
                      className={`flex-1 h-1.5 rounded-full transition-colors ${
                        lvl <= strengthScore ? strengthColors[strengthScore] : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className="w-full px-4 py-3 pr-11 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1659A5]"
                  >
                    👁
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold">
                ✓
              </div>
              <p className="text-slate-600 text-sm">
                You can now log in with your new credentials. Redirecting to login in 3 seconds...
              </p>
              <Link
                href="/login"
                className="inline-block py-3 px-8 bg-gold-btn text-white font-bold rounded-lg shadow-btn-gold"
              >
                GO TO LOGIN
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm font-bold text-[#1659A5] hover:text-gold-btn transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-primary-dark text-footer-text text-center py-5 px-4 text-sm mt-auto">
        <p className="m-0">© 2026 TripBoard. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-ice flex items-center justify-center">
          <div className="animate-pulse text-[#1659A5] font-semibold text-lg">Loading...</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
