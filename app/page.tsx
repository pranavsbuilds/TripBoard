import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is logged in, lead them directly to their respective role dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/employee/dashboard');
    }
  }

  // If not logged in, render the complete index.html landing page
  return (
    <div className="min-h-screen bg-bg-ice text-primary-blue font-sans flex flex-col justify-between">
      {/* NAVBAR (Matching index.html & DESIGNS/shared-components-preview.html) */}
      <header
        className="min-h-[110px] md:h-[125px] relative flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-3 md:py-0 gap-3 md:gap-0 bg-cover bg-right md:bg-center bg-no-repeat shadow-nav border-b border-slate-200"
        style={{
          backgroundImage: "url('/assets/bg2.png')",
          backgroundColor: '#0c3370',
        }}
      >
        {/* Left: Brand Lockup with logo_svg.svg */}
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

        {/* Right: Navigation Links + Gold Login Button */}
        <nav className="relative z-10 flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="text-white text-sm md:text-[15px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] transition-all duration-200 hover:text-gold-light hover:-translate-y-0.5"
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
            className="bg-gold-btn hover:bg-gold-btn-hover text-white text-sm font-semibold py-2 px-5 rounded-md shadow-btn-gold hover:shadow-btn-gold-hover hover:-translate-y-0.5 transition-all duration-200 no-underline"
          >
            Login
          </Link>
        </nav>
      </header>

      {/* HERO SECTION (Matching index.html) */}
      <section
        className="min-h-[520px] flex flex-col md:flex-row items-center justify-between gap-12 px-6 md:px-[10%] py-16 bg-white relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 90% 20%, #D9EFFB 0, transparent 30%), radial-gradient(circle at 10% 90%, #EAF5FC 0, transparent 30%), white',
        }}
      >
        <div className="w-full md:w-[55%] relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-[48px] font-extrabold text-[#1659A5] leading-tight mb-3 tracking-wide">
            BUSINESS TRAVEL, SIMPLIFIED
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-[29px] font-semibold text-[#0B2A55] mb-5">
            Plan. Manage. Travel Smarter.
          </h2>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-[600px] mb-6">
            TripBoard is a centralized platform that helps businesses plan, manage and monitor
            employee travel with ease.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 bg-gradient-to-r from-gold-btn to-[#E0B82F] hover:from-gold-btn-hover hover:to-gold-btn text-white px-8 py-3.5 rounded-lg font-bold text-base shadow-[0_6px_15px_rgba(201,162,39,0.30)] hover:shadow-[0_9px_20px_rgba(201,162,39,0.40)] hover:-translate-y-0.5 transition-all duration-200 no-underline"
          >
            Get Started
          </Link>
        </div>

        {/* Travel card (Dubai) */}
        <div className="w-full sm:w-[340px] bg-white rounded-2xl p-7 shadow-[0_15px_40px_rgba(11,42,85,0.12)] border border-slate-100 transition-transform duration-300 hover:-translate-y-2 relative">
          <h2 className="text-xl font-bold text-[#0B2A55] pb-3 border-b border-slate-100 flex items-center gap-2">
            ✈ Business Trip
          </h2>
          <div className="space-y-3 pt-4 text-sm text-slate-500">
            <p>
              <b className="text-[#0B2A55]">Destination:</b> Dubai
            </p>
            <p className="font-semibold text-[#1659A5]">20 Sept – 27 Sept</p>
            <p>Business Conference</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-16 px-6 md:px-[8%] bg-bg-ice">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A55] text-center mb-12 tracking-wide relative after:content-[''] after:block after:w-16 after:h-1 after:bg-gold-btn after:mx-auto after:mt-3 after:rounded-full">
          OUR FEATURES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-7 rounded-xl shadow-card border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <h3 className="text-lg font-bold text-[#1659A5] mb-2">Trip Management</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Create, manage and monitor employee business trips.
            </p>
          </div>
          <div className="bg-white p-7 rounded-xl shadow-card border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <h3 className="text-lg font-bold text-[#1659A5] mb-2">Employee Management</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Add employees and assign them to business trips.
            </p>
          </div>
          <div className="bg-white p-7 rounded-xl shadow-card border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <h3 className="text-lg font-bold text-[#1659A5] mb-2">Travel Documents</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Keep passports, visas, tickets and insurance organized.
            </p>
          </div>
          <div className="bg-white p-7 rounded-xl shadow-card border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
            <h3 className="text-lg font-bold text-[#1659A5] mb-2">Expense Tracking</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Track travel expenses and manage business budgets.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section
        id="about"
        className="py-16 px-6 md:px-[10%] text-center text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #071D3A, #1659A5)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gold-light mb-4 tracking-wide">
            ABOUT TRIPBOARD
          </h2>
          <p className="text-base sm:text-lg text-bg-ice/90 leading-relaxed">
            TripBoard provides businesses with one platform to plan, manage, monitor and secure the
            complete business travel journey of their employees.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-dark text-footer-text text-center py-5 px-4 text-sm mt-auto">
        <p className="m-0">© 2026 TripBoard. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
