import React, { useEffect, useState } from 'react';

interface DialloLampLightProps {
  isLit?: boolean;
}

export const DialloLampLight: React.FC<DialloLampLightProps> = ({ isLit = true }) => {
  const [pos, setPos] = useState({ x: 50, y: 35 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      // Soft interpolated tracking of mouse position across window percentages
      const xPct = Math.round((e.clientX / window.innerWidth) * 100);
      const yPct = Math.round((e.clientY / window.innerHeight) * 100);
      setPos({ x: xPct, y: yPct });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden transition-opacity duration-1000"
      style={{ opacity: isLit ? 1 : 0.2 }}
    >
      {/* Primary Warm Lamp Glow centered on top / tracking */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(55vmax 40vmax at ${pos.x}% ${pos.y}%, rgba(242, 220, 180, 0.08) 0%, rgba(242, 220, 180, 0.02) 45%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* Secondary Cyber Cyan Ambient Rim Glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70vmax 50vmax at 80% 20%, rgba(0, 239, 252, 0.04) 0%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />


      {/* Subtle Analog Film Grain / Noise Overlay */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
};
