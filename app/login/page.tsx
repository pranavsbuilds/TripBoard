'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';


function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { user, profile, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');

  // Register State (Admins only)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);

  // If already authenticated, redirect to role dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, profile, authLoading, router]);

  // Handle errors in URL
  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback_failed') {
      setError('Authentication failed. Please try signing in again.');
    }
  }, [searchParams]);

  // Password strength calculation
  const handleRegPasswordChange = (val: string) => {
    setRegPassword(val);
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Za-z]/.test(val) && /\d/.test(val)) score++;
    if (val.length >= 10 && /[A-Z]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setStrengthScore(score);
  };

  // Sign In Submission
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnconfirmedEmail('');

    if (!role) {
      setError('Please select your role (Admin or Employee).');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.');
        } else if (
          signInError.message?.toLowerCase().includes('email not confirmed') ||
          signInError.message?.toLowerCase().includes('email_not_confirmed')
        ) {
          // Surface dedicated verification prompt instead of generic error
          setUnconfirmedEmail(email.trim().toLowerCase());
        } else {
          setError('Invalid email or password.');
        }
        setLoading(false);
        return;
      }

      // Check user profile role in public.profiles
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const userActualRole = userProfile?.role || 'employee';

      // Verify that user selected the correct role
      if (userActualRole !== role) {
        setError(`Access denied: Your account role is '${userActualRole}', not '${role}'.`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Route to respective dashboard
      if (userActualRole === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/employee/dashboard');
      }
    } catch (err) {
      console.error('[Login]', err instanceof Error ? err.message : String(err));
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Admin Registration Submission (Only Admins Register)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regFullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Register with role explicitly set to 'admin'
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        options: {
          data: {
            full_name: regFullName.trim(),
            role: 'admin',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.toLowerCase().includes('already registered')
            ? 'An account with this email already exists. Please log in.'
            : signUpError.message || 'Registration failed.'
        );
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        router.push(`/verify-email?email=${encodeURIComponent(regEmail.trim().toLowerCase())}`);
      } else {
        router.replace('/admin');
      }
    } catch (err) {
      console.error('[Register]', err instanceof Error ? err.message : String(err));
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const strengthColors = ['bg-slate-200', 'bg-red-400', 'bg-yellow-400', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-bg-ice text-primary-blue font-sans flex flex-col justify-between">
      {/* NAVBAR (Matching login.html & shared-components-preview.html) */}
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
            className="h-12 md:h-14 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl md:text-[27px] tracking-[2px] leading-none drop-shadow-md">
              TRIPBOARD
            </span>
            <span className="text-sky-200/90 text-[10px] md:text-[11px] font-medium tracking-wider mt-1 leading-none drop-shadow-sm">
              Corporate Travel Management. Simplified.
            </span>
          </div>
        </Link>

        <nav className="relative z-10 flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
          >
            Home
          </Link>
          <a
            href="/#features"
            className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
          >
            Features
          </a>
          <a
            href="/#about"
            className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
          >
            About
          </a>
        </nav>
      </header>

      {/* MAIN: EXACT login.html 2-COLUMN CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 my-6">
        <div className="w-full max-w-[1050px] flex flex-col md:flex-row bg-white rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(11,42,85,0.15)]">
          {/* LEFT INFO PANEL (Exact login.html aesthetic & content) */}
          <div className="w-full md:w-1/2 p-8 md:p-14 bg-gradient-to-br from-[#0B2A55] to-[#1659A5] text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                Welcome to TripBoard
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-gold-light mb-6">
                Business Travel, Simplified.
              </h2>
              <p className="text-bg-ice/90 text-sm md:text-base leading-relaxed max-w-[420px]">
                Manage employees, business trips, travel documents and expenses from one centralized
                platform.
              </p>

              <div className="mt-8 space-y-4 text-sm md:text-base font-medium">
                <p className="flex items-center gap-2">✈ Plan your trips</p>
                <p className="flex items-center gap-2">👥 Manage employees</p>
                <p className="flex items-center gap-2">📄 Organize travel documents</p>
                <p className="flex items-center gap-2">💼 Manage business travel</p>
              </div>
            </div>

            {/* Circular decorative accent */}
            <div className="absolute -right-24 -bottom-24 w-64 h-64 rounded-full border-2 border-white/10 pointer-events-none" />
          </div>

          {/* RIGHT LOGIN / SIGNUP BOX */}
          <div className="w-full md:w-1/2 p-8 md:p-14 bg-white flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A55] text-center mb-1 tracking-wide">
              {activeTab === 'login' ? 'LOGIN' : 'ADMIN REGISTRATION'}
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              {activeTab === 'login'
                ? 'Access your TripBoard account'
                : 'Create an administrator account'}
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Unconfirmed Email Banner */}
            {unconfirmedEmail && (
              <div className="mb-5 p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm">
                <p className="font-semibold mb-1">📧 Email not verified</p>
                <p className="mb-3">
                  Your account email <strong>{unconfirmedEmail}</strong> has not been verified yet. Please check your inbox for the verification email.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`}
                    className="flex-1 text-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Enter Verification Code
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.resend({
                        type: 'signup',
                        email: unconfirmedEmail,
                        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                      });
                      setError('Verification email resent. Please check your inbox.');
                      setUnconfirmedEmail('');
                    }}
                    className="flex-1 text-center px-3 py-2 bg-white border border-amber-400 hover:bg-amber-50 text-amber-700 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
            )}

            {/* Switch Tabs: Sign In vs Admin Sign Up */}
            <div className="flex border-b border-slate-200 mb-6 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                  setUnconfirmedEmail('');
                }}
                className={`flex-1 pb-2.5 transition-colors ${
                  activeTab === 'login'
                    ? 'text-[#1659A5] border-b-2 border-[#1659A5]'
                    : 'text-slate-400 hover:text-[#1659A5]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError('');
                }}
                className={`flex-1 pb-2.5 transition-colors ${
                  activeTab === 'register'
                    ? 'text-[#1659A5] border-b-2 border-[#1659A5]'
                    : 'text-slate-400 hover:text-[#1659A5]'
                }`}
              >
                Register Admin
              </button>
            </div>

            {/* 1. LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                </div>

                {/* PASSWORD WITH EYE TOGGLE */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      maxLength={128}
                      disabled={loading}
                      className="w-full px-4 py-3 pr-11 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1659A5] cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* ROLE SELECTOR (login.html) */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Login As
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20 cursor-pointer"
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                {/* FORGOT PASSWORD LINK */}
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#1659A5] hover:text-gold-btn transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* GOLD SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] hover:shadow-[0_9px_20px_rgba(201,162,39,0.40)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'SIGNING IN...' : 'LOGIN'}
                </button>
              </form>
            )}

            {/* 2. ADMIN REGISTER FORM (Admins only register, no role selection) */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Enter full name"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="admin@company.com"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                </div>

                {/* PASSWORD WITH LIVE STRENGTH METER */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => handleRegPasswordChange(e.target.value)}
                      placeholder="Min 8 characters, letter & number"
                      maxLength={128}
                      disabled={loading}
                      className="w-full px-4 py-3 pr-11 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1659A5] cursor-pointer"
                    >
                      {showRegPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* 4-bar live strength meter */}
                  <div className="flex gap-1.5 mt-2">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 h-1.5 rounded-full transition-colors ${
                          lvl <= strengthScore
                            ? strengthColors[strengthScore]
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#0B2A55] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    maxLength={128}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#F8FCFF] border border-[#D5E5F2] rounded-lg text-sm text-[#172B4D] outline-none transition focus:border-[#1659A5] focus:bg-white focus:ring-2 focus:ring-[#5DB8E8]/20"
                    required
                  />
                </div>

                {/* GOLD SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white font-bold rounded-lg shadow-[0_6px_15px_rgba(201,162,39,0.30)] hover:shadow-[0_9px_20px_rgba(201,162,39,0.40)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'CREATING ADMIN ACCOUNT...' : 'CREATE ADMIN ACCOUNT'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-bold text-[#1659A5] hover:text-gold-btn transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-primary-dark text-footer-text text-center py-5 px-4 text-sm mt-auto">
        <p className="m-0">© 2026 TripBoard. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-ice flex items-center justify-center">
          <div className="animate-pulse text-[#1659A5] font-semibold text-lg">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
