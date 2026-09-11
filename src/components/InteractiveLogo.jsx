import React, { useState, useRef, useEffect } from 'react';

/**
 * Interactive 3D Perspective Logo with Dynamic Specular Glare & Multi-layer Parallax
 * No artificial clip-path tearing; preserves brand integrity with tactile, responsive physical feedback.
 */
export default function InteractiveLogo({ size = 80, className = '' }) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Smooth mouse move tracking for 3D tilt & glare
  const handleMouseMove = (e) => {
    if (!containerRef.current || isSpinning) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    // Normalize to -1 to 1 from center
    const normX = (x - 0.5) * 2;
    const normY = (y - 0.5) * 2;

    setCoords({ x: normX, y: normY });
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || isSpinning || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    const normX = Math.max(-1, Math.min(1, (x - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (y - 0.5) * 2));

    setCoords({ x: normX, y: normY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    setCoords({ x: 0, y: 0 }); // Spring back to center
  };

  const handleClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setTimeout(() => {
      setIsSpinning(false);
    }, 700);
  };

  // Tilt calculations
  const maxTilt = 18;
  const rotateX = isSpinning ? 0 : -coords.y * maxTilt;
  const rotateY = isSpinning ? 0 : coords.x * maxTilt;
  const glareX = ((coords.x + 1) / 2) * 100;
  const glareY = ((coords.y + 1) / 2) * 100;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => {
        setIsHovered(true);
        setIsPressed(true);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => {
        setIsHovered(false);
        setIsPressed(false);
        setCoords({ x: 0, y: 0 });
      }}
      onClick={handleClick}
      className={`relative inline-block select-none cursor-pointer group ${className}`}
      style={{
        perspective: '1000px',
        width: size + 36,
        height: size + 36,
        padding: 14,
      }}
      title="Klik untuk efek putar 3D"
    >
      {/* Dynamic Ambient Backlight Glow (Layer -1: Moves inversely to create deep parallax) */}
      <div
        className="absolute inset-0 rounded-3xl bg-radial from-blue-500/25 via-indigo-500/10 to-transparent blur-xl pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transform: `translate3d(${-coords.x * 14}px, ${-coords.y * 14}px, -20px) scale(${
            isHovered ? 1.25 : 0.95
          })`,
          opacity: isHovered ? 0.9 : 0.45,
        }}
      />

      {/* Main 3D Card Base (Layer 0) */}
      <div
        className={`relative w-full h-full rounded-2xl bg-white/95 backdrop-blur-md border transition-all ${
          isSpinning
            ? 'duration-700 ease-in-out'
            : isHovered
            ? 'duration-100 ease-out'
            : 'duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isSpinning
            ? 'rotateY(360deg) scale(1.08)'
            : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
                isPressed ? 0.94 : isHovered ? 1.05 : 1
              }, ${isPressed ? 0.94 : isHovered ? 1.05 : 1}, 1)`,
          boxShadow: isHovered
            ? `${-coords.x * 16}px ${
                -coords.y * 16 + 18
              }px 32px -8px rgba(30, 64, 175, 0.22), 0 0 0 1px rgba(147, 197, 253, 0.5)`
            : '0 10px 25px -5px rgba(30, 64, 175, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          borderColor: isHovered ? 'rgba(147, 197, 253, 0.8)' : 'rgba(226, 232, 240, 0.9)',
        }}
      >
        {/* Dynamic Specular Glare / Glass Sheen Overlay */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.85 : 0,
            background: `radial-gradient(circle 90px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.25) 40%, transparent 80%)`,
          }}
        />

        {/* Ambient Subtle Tech Grid Overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#3b82f6 0.75px, transparent 0.75px)`,
            backgroundSize: '8px 8px',
          }}
        />

        {/* Floating Logo Element with Elevated 3D Depth (Layer 1: translateZ) */}
        <div
          className="w-full h-full flex items-center justify-center p-3 relative"
          style={{
            transform: 'translateZ(28px)',
            transformStyle: 'preserve-3d',
          }}
        >
          <img
            src="/logo-lsd.png"
            alt="Logo LSD"
            className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-200"
            style={{
              filter: isHovered
                ? `drop-shadow(${coords.x * 6}px ${coords.y * 6 + 6}px 10px rgba(37, 99, 235, 0.35))`
                : 'drop-shadow(0 2px 5px rgba(30, 58, 138, 0.12))',
            }}
          />
        </div>

        {/* Corner Tech Accent Dots */}
        <div
          className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isHovered ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-300'
          }`}
          style={{ transform: 'translateZ(15px)' }}
        />
        <div
          className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isHovered ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-slate-300'
          }`}
          style={{ transform: 'translateZ(15px)' }}
        />
      </div>
    </div>
  );
}
