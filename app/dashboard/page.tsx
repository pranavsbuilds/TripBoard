import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plane, LogOut, User, ShieldCheck } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, company_id')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? 'employee';
  const displayName = profile?.full_name || user.email || 'User';
  const redirectTarget = role === 'admin' ? '/admin' : '/employee/dashboard';

  return (
    <div className="min-h-screen bg-bg-ice flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-card border border-slate-200 p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-dark rounded-2xl flex items-center justify-center shadow-nav">
            <Plane className="w-8 h-8 text-gold-btn" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Welcome, {displayName}!</h1>
          <p className="text-sm text-primary-blue/70 mt-1">You are successfully authenticated.</p>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-bg-ice border border-brand-blue/20 text-sm font-semibold text-brand-blue">
          <ShieldCheck className="w-4 h-4" />
          <span>Role: {role === 'admin' ? 'Administrator' : 'Employee'}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={redirectTarget}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gold-btn hover:bg-gold-btn-hover text-primary-dark font-bold rounded-xl shadow-btn-gold transition-colors"
          >
            <User className="w-4 h-4" />
            Go to {role === 'admin' ? 'Admin Suite' : 'My Portal'}
          </Link>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-primary-blue font-semibold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>

        <p className="text-xs text-primary-blue/50">
          Milestone 3 ✅ — Auth integration verified. Session cookie active.
        </p>
      </div>
    </div>
  );
}
