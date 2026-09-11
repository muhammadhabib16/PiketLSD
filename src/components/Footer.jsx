import React from 'react';
import { ShieldCheck, Code, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg border-t border-blue-500/60 mt-auto z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          {/* Left: Brand and Lab Info */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                Laboratorium Systems Development
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-xs">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-blue-100/90">
              Sistem Presensi Mandiri & Manajemen Jadwal Piket Asisten
            </p>
          </div>

          {/* Right: Security & Copyright */}
          <div className="flex flex-col items-center sm:items-end gap-0.5 text-[11px] text-blue-200">
            <div className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
              <span>Sistem Terhubung • Cloud Sync Aktif</span>
            </div>
            <p className="text-blue-100/80">
              &copy; {currentYear} LSD Lab. Seluruh hak cipta dilindungi.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}

