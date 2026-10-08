import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ensure employee role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'admin') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header variant="employee" />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
