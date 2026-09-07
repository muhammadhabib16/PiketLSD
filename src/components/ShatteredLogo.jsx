import React, { useState } from 'react';

// Polygons perfectly tessellating the logo along the angled code bracket `< / >` contours
const POLYGON_SHARDS = [
  {
    id: 'left-chevron',
    name: 'Bracket Kiri <',
    clipPath: 'polygon(0% 0%, 38% 0%, 32% 48%, 35% 100%, 0% 100%)',
    x: -30,
    y: -12,
    r: -18,
    s: 0.94,
    delay: '0ms'
  },
  {
    id: 'top-slash',
    name: 'Slash Atas /',
    clipPath: 'polygon(38% 0%, 100% 0%, 68% 52%, 32% 48%)',
    x: 6,
    y: -28,
    r: 10,
    s: 0.92,
    delay: '20ms'
  },
  {
    id: 'right-chevron',
    name: 'Bracket Kanan >',
    clipPath: 'polygon(100% 0%, 100% 100%, 68% 100%, 68% 52%)',
    x: 30,
    y: 14,
    r: 18,
    s: 0.94,
    delay: '15ms'
  },
  {
    id: 'bottom-slash',
    name: 'Slash Bawah /',
    clipPath: 'polygon(32% 48%, 68% 52%, 68% 100%, 35% 100%)',
    x: -8,
    y: 28,
    r: -12,
    s: 0.92,
    delay: '35ms'
  }
];

export default function ShatteredLogo({ size = 84, className = '' }) {
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <div
      className={`relative inline-block select-none cursor-pointer group ${className}`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onMouseDown={() => setIsInteracting(true)}
      onMouseUp={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      style={{ width: size + 24, height: size + 24, padding: 12 }}
    >
      {/* Dynamic Ambient Glow Behind Logo */}
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-sky-400/25 to-blue-600/15 blur-xl transition-all duration-700 pointer-events-none ${
          isInteracting ? 'opacity-100 scale-125' : 'opacity-40 scale-95'
        }`}
      />

      {/* Main Glass Base Container */}
      <div
        className={`relative w-full h-full rounded-2xl bg-white/95 backdrop-blur-sm border transition-all duration-500 flex items-center justify-center ${
          isInteracting
            ? 'border-blue-400/80 shadow-2xl shadow-blue-500/25 scale-105'
            : 'border-blue-200/90 shadow-lg shadow-blue-500/10 hover:border-blue-300'
        }`}
      >
        {/* Shard Stack Container */}
        <div
          className="relative"
          style={{ width: size, height: size }}
        >
          {POLYGON_SHARDS.map((shard) => (
            <div
              key={shard.id}
              className="absolute inset-0 w-full h-full transition-all duration-500 will-change-transform"
              style={{
                clipPath: shard.clipPath,
                WebkitClipPath: shard.clipPath,
                transform: isInteracting
                  ? `translate3d(${shard.x}px, ${shard.y}px, 0) rotate(${shard.r}deg) scale(${shard.s})`
                  : 'translate3d(0px, 0px, 0) rotate(0deg) scale(1)',
                transitionTimingFunction: isInteracting
                  ? 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                  : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: isInteracting ? shard.delay : '0ms',
                filter: isInteracting
                  ? 'drop-shadow(0 8px 12px rgba(37, 99, 235, 0.35))'
                  : 'none',
                zIndex: isInteracting ? 20 : 1,
              }}
            >
              <img
                src="/logo-lsd.png"
                alt="Logo LSD Shard"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          ))}
        </div>

        {/* Central Ambient Sparkle when fractured */}
        <div
          className={`absolute inset-0 m-auto w-8 h-8 rounded-full bg-blue-500/20 blur-md pointer-events-none transition-all duration-300 ${
            isInteracting ? 'opacity-100 scale-150' : 'opacity-0 scale-50'
          }`}
        />
      </div>
    </div>
  );
}
