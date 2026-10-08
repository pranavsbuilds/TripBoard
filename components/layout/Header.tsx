'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

interface HeaderProps {
  variant?: 'landing' | 'admin' | 'employee' | 'auto';
}

export function Header({ variant = 'auto' }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  // Determine current variant
  let activeVariant: 'landing' | 'admin' | 'employee' = 'landing';
  if (variant === 'auto') {
    if (pathname.startsWith('/admin')) {
      activeVariant = 'admin';
    } else if (pathname.startsWith('/employee')) {
      activeVariant = 'employee';
    } else if (user && profile?.role === 'admin') {
      activeVariant = 'admin';
    } else if (user) {
      activeVariant = 'employee';
    } else {
      activeVariant = 'landing';
    }
  } else {
    activeVariant = variant;
  }

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-nav border border-slate-200">
      <header
        className="min-h-[110px] md:h-[125px] relative flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-3 md:py-0 gap-3 md:gap-0 bg-cover bg-right md:bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/bg2.png')",
          backgroundColor: '#0c3370',
        }}
      >
        {/* Left: Brand Lockup with logo_svg.svg */}
        <Link
          href={activeVariant === 'admin' ? '/admin' : activeVariant === 'employee' ? '/employee/dashboard' : '/'}
          className="relative z-10 flex items-center gap-3.5 group no-underline"
        >
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

        {/* Right: Navigation Links + Action Button */}
        <nav className="relative z-10 flex items-center gap-4 sm:gap-6 md:gap-8 flex-wrap justify-center">
          {activeVariant === 'landing' && (
            <>
              <Link
                href="/"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname === '/' ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                Home
              </Link>
              <a
                href="#features"
                className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
              >
                About
              </a>
              <Link
                href="/login"
                className="bg-gold-btn hover:bg-gold-btn-hover text-white text-sm font-semibold py-2 px-5 rounded-md shadow-btn-gold hover:shadow-btn-gold-hover hover:-translate-y-0.5 transition-all duration-200"
              >
                Login
              </Link>
            </>
          )}

          {activeVariant === 'admin' && (
            <>
              <Link
                href="/admin"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname === '/admin' ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/employees"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname.startsWith('/admin/employees') ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                Employees
              </Link>
              <Link
                href="/admin/trips"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname.startsWith('/admin/trips') ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                Trips
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-gold-btn hover:bg-gold-btn-hover text-white text-sm font-semibold py-2 px-5 rounded-md shadow-btn-gold hover:shadow-btn-gold-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                Logout
              </button>
            </>
          )}

          {activeVariant === 'employee' && (
            <>
              <Link
                href="/employee/dashboard"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname === '/employee/dashboard' ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                My Dashboard
              </Link>
              <Link
                href="/employee/documents"
                className={`text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5 ${
                  pathname.startsWith('/employee/documents') ? 'text-gold-light border-b-2 border-accent-gold pb-0.5' : 'text-white'
                }`}
              >
                My Documents
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-gold-btn hover:bg-gold-btn-hover text-white text-sm font-semibold py-2 px-5 rounded-md shadow-btn-gold hover:shadow-btn-gold-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>
    </div>
  );
}

export default Header;
