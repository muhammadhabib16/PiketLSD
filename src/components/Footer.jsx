import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200/70 py-4 px-4 text-center mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-500">
        <p className="font-medium text-slate-600">
          Laboratorium Systems Development &copy; {currentYear}
        </p>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistem Presensi Mandiri • Lab LSD</span>
        </div>
      </div>
    </footer>
  );
}
