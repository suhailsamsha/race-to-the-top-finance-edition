import { useEffect, useRef } from 'react';

interface SpaceCanvasProps {
  confettiSeed: number;
}

export function SpaceCanvas({ confettiSeed }: SpaceCanvasProps) {
  const starCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Twinkling deep-space starfield canvas
  useEffect(() => {
    const canvas = starCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;

    interface Star {
      x: number;
      y: number;
      r: number;
      a: number;
      da: number;
    }

    let stars: Star[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.02,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#34d399';
      for (const s of stars) {
        if (!prefersReducedMotion) {
          s.a += s.da;
          if (s.a <= 0.1 || s.a >= 0.95) s.da = -s.da;
        }
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Confetti burst when crossing $10,000 finish stargate
  useEffect(() => {
    if (confettiSeed === 0) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const palette = ['#10b981', '#f59e0b', '#38bdf8', '#ec4899', '#ffffff'];
    const pieces = Array.from({ length: 95 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: Math.random() * 6 + 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      vy: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 3,
    }));

    let frames = 0;
    let rafId = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.y += p.vy;
        p.x += p.vx;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frames += 1;
      if (frames < 140) {
        rafId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [confettiSeed]);

  return (
    <>
      <canvas
        ref={starCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9998] h-full w-full"
      />
    </>
  );
}
