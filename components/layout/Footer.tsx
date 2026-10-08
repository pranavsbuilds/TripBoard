import React from 'react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 mt-8">
      <footer className="bg-primary-dark text-footer-text text-center py-5 px-4 text-sm">
        <p className="m-0">© {year} TripBoard. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default Footer;
