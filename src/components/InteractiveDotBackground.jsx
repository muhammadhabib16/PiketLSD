import React, { useRef, useEffect } from 'react';

export default function InteractiveDotBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

    // Responsive configuration state
    let config = {
      spacing: 38,
      baseRadius: 2.2,
      interactionRadius: 140,
      repelDistance: 32,
    };

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
      isActive: false
    };

    let dots = [];
    let time = 0;

    const calculateResponsiveConfig = (w) => {
      if (w < 640) {
        // Mobile screen (< 640px)
        return {
          spacing: 26,
          baseRadius: 1.6,
          interactionRadius: 90,
          repelDistance: 20,
        };
      } else if (w < 1024) {
        // Tablet screen (640px - 1024px)
        return {
          spacing: 32,
          baseRadius: 2.0,
          interactionRadius: 120,
          repelDistance: 26,
        };
      } else {
        // Desktop screen (> 1024px)
        return {
          spacing: 38,
          baseRadius: 2.3,
          interactionRadius: 150,
          repelDistance: 34,
        };
      }
    };

    const initDots = () => {
      dots = [];
      const cols = Math.ceil(width / config.spacing) + 2;
      const rows = Math.ceil(height / config.spacing) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const originX = i * config.spacing;
          const originY = j * config.spacing;
          dots.push({
            originX,
            originY,
            x: originX,
            y: originY,
            phase: (i * 0.35) + (j * 0.35)
          });
        }
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;

      // Update responsive settings according to current screen width
      config = calculateResponsiveConfig(width);
      mouse.radius = config.interactionRadius;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initDots();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);

    const handlePointerMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = clientX;
      mouse.y = clientY;
      mouse.isActive = true;
    };

    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isActive = false;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.03;

      // Update and draw responsive dots (No connecting lines)
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Subtle gentle breathing pulse
        const wave = Math.sin(time + dot.phase) * 0.35;
        let targetX = dot.originX;
        let targetY = dot.originY;
        let radius = config.baseRadius + wave;
        let fillStyle = 'rgba(59, 130, 246, 0.38)'; // Elegant clean blue

        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.isActive) {
          const force = (1 - dist / mouse.radius);
          const angle = Math.atan2(dy, dx);
          
          // Smooth repel physics away from cursor
          targetX = dot.originX - Math.cos(angle) * (force * config.repelDistance);
          targetY = dot.originY - Math.sin(angle) * (force * config.repelDistance);
          
          // Glow and enlarge proportionally without any lines
          radius = config.baseRadius + force * (config.baseRadius * 1.5);
          fillStyle = `rgba(37, 99, 235, ${0.45 + force * 0.55})`;

          // Draw gentle halo ring on active dots
          if (force > 0.4) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${force * 0.20})`;
            ctx.fill();
          }
        }

        // Spring ease back to origin
        dot.x += (targetX - dot.x) * 0.16;
        dot.y += (targetY - dot.y) * 0.16;

        // Render dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.8, radius), 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
