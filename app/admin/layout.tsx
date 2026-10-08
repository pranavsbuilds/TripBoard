import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/employee/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg-ice text-primary-blue font-sans flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <Header variant="admin" />
        <div className="w-full">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
