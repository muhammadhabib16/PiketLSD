import React from 'react';
import { MapPin, RotateCw, ExternalLink, AlertTriangle } from 'lucide-react';

export default function LocationBadge({ latitude, longitude, accuracy, locationString, loading, error, onRefresh }) {
  const hasCoordinates = latitude !== null && longitude !== null;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-start gap-3 shadow-sm">
      <div
        className={`p-2.5 rounded-lg mt-0.5 flex-shrink-0 transition-colors ${
          error
            ? 'bg-rose-50 text-rose-600 border border-rose-200'
            : hasCoordinates
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        }`}
      >
        {error ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <MapPin className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Titik Koordinat GPS
            {hasCoordinates && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 focus:outline-none disabled:opacity-50 p-1 -mr-1 rounded-lg hover:bg-blue-50 active:scale-95 touch-manipulation min-h-[32px]"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui</span>
          </button>
        </div>

        <p className="text-xs font-mono text-slate-700 mt-1 truncate" title={locationString}>
          {locationString}
        </p>

        {hasCoordinates && accuracy !== null && (
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[11px]">
            <span className="text-emerald-700 font-medium">Akurasi: ±{accuracy} meter</span>
            <span className="text-slate-300">•</span>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 underline font-medium touch-manipulation py-0.5"
            >
              <span>Buka Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5 inline flex-shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
