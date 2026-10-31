import { useEffect, useRef } from 'react';

interface ParticleFieldProps {
  /** Marks are drawn in these colours, cycled by index. */
  colors?: string[];
  /** Marks per 100k square pixels, so density is width-independent. */
  density?: number;
  /** Base drift in px/s at the calm end of the range. */
  speed?: number;
  /** Pointer influence radius in CSS pixels. */
  influence?: number;
  className?: string;
}

/** mulberry32 — small, seedable, so the layout of the field is stable. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Mark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  angle: number;
  spin: number;
  color: string;
  alpha: number;
}

const MARK_COLORS = ['#4285f4', '#7c5cff', '#ea5b4c', '#2ec4a6', '#f4b400'];

/**
 * Sparse confetti field for the landing hero. One canvas per page, transform and
 * opacity only, paused whenever the field is off-screen or the tab is hidden.
 * The caller decides the reduced-motion and coarse-pointer fallback: this
 * component never checks the media queries itself.
 */
export default function ParticleField({
  colors = MARK_COLORS,
  density = 9,
  speed = 7,
  influence = 150,
  className,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let marks: Mark[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;
    let last = 0;
    const pointer = { x: -9999, y: -9999, active: false };

    const build = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(((width * height) / 100_000) * density);
      const rand = random(20261101);
      const fallback = colors[0] ?? MARK_COLORS[0] ?? '#4285f4';
      marks = Array.from({ length: Math.min(count, 130) }, (_, index) => ({
        x: rand() * width,
        y: rand() * height,
        vx: (rand() - 0.5) * speed,
        vy: -speed * (0.45 + rand() * 0.8),
        length: 3 + rand() * 5,
        angle: rand() * Math.PI,
        spin: (rand() - 0.5) * 0.5,
        color: colors[index % colors.length] ?? fallback,
        alpha: 0.26 + rand() * 0.34,
      }));
    };

    const draw = (time: number) => {
      const delta = Math.min((time - last) / 1000, 0.05);
      last = time;
      ctx.clearRect(0, 0, width, height);

      for (const mark of marks) {
        mark.x += mark.vx * delta;
        mark.y += mark.vy * delta;
        mark.angle += mark.spin * delta;

        if (pointer.active) {
          const dx = mark.x - pointer.x;
          const dy = mark.y - pointer.y;
          const squared = dx * dx + dy * dy;
          if (squared < influence * influence && squared > 1) {
            const distance = Math.sqrt(squared);
            const force = (1 - distance / influence) * 90 * delta;
            mark.x += (dx / distance) * force;
            mark.y += (dy / distance) * force;
          }
        }

        if (mark.y < -20) mark.y = height + 20;
        if (mark.x < -20) mark.x = width + 20;
        else if (mark.x > width + 20) mark.x = -20;

        const half = mark.length / 2;
        const cos = Math.cos(mark.angle);
        const sin = Math.sin(mark.angle);
        ctx.globalAlpha = mark.alpha;
        ctx.strokeStyle = mark.color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mark.x - cos * half, mark.y - sin * half);
        ctx.lineTo(mark.x + cos * half, mark.y + sin * half);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    build();
    start();

    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { rootMargin: '120px' },
    );
    observer.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    const resize = new ResizeObserver(build);
    resize.observe(parent);

    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [colors, density, speed, influence]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
