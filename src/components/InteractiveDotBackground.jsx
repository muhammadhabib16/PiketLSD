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

    // Responsive configuration state with smaller, more transparent particles
    let config = {
      spacing: 44,
      baseRadius: 1.3,
      interactionRadius: 130,
      repelDistance: 28,
    };

    const mouse = {
      x: -1000,
      y: -1000,
      radius: 130,
      isActive: false
    };

    let dots = [];
    let time = 0;

    const calculateResponsiveConfig = (w) => {
      if (w < 640) {
        // Mobile screen (< 640px)
        return {
          spacing: 32,
          baseRadius: 0.9,
          interactionRadius: 85,
          repelDistance: 18,
        };
      } else if (w < 1024) {
        // Tablet screen (640px - 1024px)
        return {
          spacing: 38,
          baseRadius: 1.1,
          interactionRadius: 110,
          repelDistance: 22,
        };
      } else {
        // Desktop screen (> 1024px)
        return {
          spacing: 44,
          baseRadius: 1.3,
          interactionRadius: 130,
          repelDistance: 28,
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
      time += 0.025;

      // Update and draw subtle responsive dots
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Soft, gentle breathing pulse
        const wave = Math.sin(time + dot.phase) * 0.2;
        let targetX = dot.originX;
        let targetY = dot.originY;
        let radius = config.baseRadius + wave;
        let fillStyle = 'rgba(59, 130, 246, 0.18)'; // Subtle, elegant translucent blue

        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && mouse.isActive) {
          const force = (1 - dist / mouse.radius);
          const angle = Math.atan2(dy, dx);
          
          // Smooth repel physics away from cursor
          targetX = dot.originX - Math.cos(angle) * (force * config.repelDistance);
          targetY = dot.originY - Math.sin(angle) * (force * config.repelDistance);
          
          // Delicate glow and enlargement
          radius = config.baseRadius + force * (config.baseRadius * 1.2);
          fillStyle = `rgba(37, 99, 235, ${0.22 + force * 0.38})`;

          // Draw soft subtle halo ring on closest dots
          if (force > 0.45) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius + 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${force * 0.10})`;
            ctx.fill();
          }
        }

        // Spring ease back to origin
        dot.x += (targetX - dot.x) * 0.16;
        dot.y += (targetY - dot.y) * 0.16;

        // Render dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Math.max(0.6, radius), 0, Math.PI * 2);
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
