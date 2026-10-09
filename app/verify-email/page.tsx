'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';

const RESEND_COOLDOWN = 60;
const OTP_LENGTH = 6;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useAuth();

  const emailParam = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (emailParam && !email) setEmail(emailParam);
  }, [emailParam, email]);

  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.replace(profile?.role === 'admin' ? '/admin' : '/employee/dashboard');
    }
  }, [user, profile, router]);

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
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (pasted.length) {
      const next = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((ch, i) => {
        next[i] = ch;
      });
      setOtp(next);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = otp.join('');
    if (token.length < OTP_LENGTH) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing.');
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message || 'Invalid verification code. Please try again.');
        setIsVerifying(false);
        return;
      }

      if (data.session || data.user) {
        // Resolve destination from profile role
        let destination = '/employee/dashboard';
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          if (profile?.role === 'admin') destination = '/admin';
        }

        setSuccessMsg('Email verified successfully! Redirecting...');
        setTimeout(() => {
          router.replace(destination);
        }, 1500);
      }
    } catch (err) {
      console.error('[VerifyEmail]', err instanceof Error ? err.message : String(err));
      setError('Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setError('');
    setSuccessMsg('');
    setIsResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setError(resendError.message || 'Failed to resend verification email.');
      } else {
        setSuccessMsg('Verification email resent! Please check your inbox.');
        startCooldown();
      }
    } catch (err) {
      console.error('[VerifyEmail]', err instanceof Error ? err.message : String(err));
      setError('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

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

      {/* VERIFY CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 my-6">
        <div className="w-full max-w-[600px] bg-white rounded-[20px] p-8 md:p-12 shadow-[0_20px_50px_rgba(11,42,85,0.15)] text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-center text-3xl">
            ✉️
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A55] mb-2 tracking-wide">
            VERIFY YOUR EMAIL
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Enter the 6-digit confirmation code sent to <br />
            <span className="font-bold text-[#0B2A55]">{email || 'your email'}</span>
          </p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
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
                  disabled={isVerifying}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-[#D5E5F2] rounded-xl bg-[#F8FCFF] text-[#0B2A55] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20 disabled:opacity-50"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying || otp.join('').length < OTP_LENGTH}
              className="w-full py-3.5 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] hover:shadow-[0_9px_20px_rgba(201,162,39,0.40)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'VERIFYING CODE...' : 'VERIFY & CONTINUE'}
            </button>
          </form>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending}
              className="text-[#1659A5] hover:text-gold-btn font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {isResending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend Email (${resendCooldown}s)`
                : 'Resend Email'}
            </button>
          </div>

          <div className="mt-8">
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-ice flex items-center justify-center">
          <div className="animate-pulse text-[#1659A5] font-semibold text-lg">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
