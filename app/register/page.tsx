'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Lead directly to login page with register tab active
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-ice flex items-center justify-center">
      <div className="animate-pulse text-[#1659A5] font-semibold text-lg">Redirecting...</div>
    </div>
  );
}
