import React, { useEffect, useState } from 'react';
import { playClickSound } from '@/lib/audio';

interface DialloIntroProps {
  onComplete: () => void;
}

export const DialloIntro: React.FC<DialloIntroProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  const [phaseText, setPhaseText] = useState('INITIALIZING WAR ROOM ARCHITECTURE');

  // Realistic asset loading count increment 0 -> 100 (~4.5 seconds with authentic milestone pauses)
  useEffect(() => {
    let current = 0;
    let timer: number;

    const step = () => {
      let increment = 1;
      let delay = 36 + Math.random() * 18;

      if (current < 24) {
        setPhaseText('INITIALIZING WAR ROOM ARCHITECTURE');
        increment = Math.random() > 0.4 ? 1 : 2;
        delay = 38 + Math.random() * 20;
      } else if (current === 24) {
        // Milestone pause: WebGL shaders compile
        setPhaseText('COMPILING 3D SHADERS & LIGHT CONES');
        increment = 1;
        delay = 180 + Math.random() * 60;
      } else if (current < 58) {
        setPhaseText('COMPILING 3D SHADERS & LIGHT CONES');
        increment = Math.random() > 0.35 ? 1 : 2;
        delay = 34 + Math.random() * 16;
      } else if (current === 58) {
        // Milestone pause: Decrypting targets
        setPhaseText('DECRYPTING CIPHER MATRIX & TARGETS');
        increment = 1;
        delay = 240 + Math.random() * 80;
      } else if (current < 84) {
        setPhaseText('DECRYPTING CIPHER MATRIX & TARGETS');
        increment = 1;
        delay = 42 + Math.random() * 22;
      } else if (current >= 84 && current <= 87) {
        // Realistic network telemetry handshake pause
        setPhaseText('SYNCING DEFCON TELEMETRY NODES');
        increment = Math.random() > 0.65 ? 1 : 0;
        delay = 120 + Math.random() * 80;
      } else if (current < 97) {
        setPhaseText('FINALIZING ARENA ENVIRONMENT');
        increment = 1;
        delay = 40 + Math.random() * 20;
      } else {
        setPhaseText('SYSTEM PRIMED // DEFCON READY');
        increment = 1;
        delay = 70;
      }

      current += increment;

      if (current >= 100) {
        current = 100;
        setCount(100);
        setPhaseText('SYSTEM PRIMED // DEFCON READY');
        setIsReady(true);
      } else {
        setCount(current);
        timer = window.setTimeout(step, delay);
      }
    };

    timer = window.setTimeout(step, 120);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerOpen = () => {
    playClickSound('cord');
    setIsLeaving(true);
    setTimeout(() => {
      onComplete();
    }, 1200);
  };

  // Keyboard 'Enter' trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isLeaving) {
        triggerOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLeaving]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPulling(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPulling || isLeaving) return;
    const offset = Math.max(0, Math.min(80, e.movementY * 1.5 + pullOffset));
    setPullOffset(offset);
  };

  const handlePointerUp = () => {
    if (!isPulling || isLeaving) return;
    setIsPulling(false);
    if (pullOffset > 25) {
      triggerOpen();
    } else {
      // Small click still opens!
      triggerOpen();
    }
    setPullOffset(0);
  };

  return (
    <div
      role="banner"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-10 bg-[#070707] text-ink select-none transition-all duration-1000 ease-out ${
        isLeaving ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(60vmax 40vmax at 50% 40%, #150f09 0%, #070707 70%)',
      }}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <span className="text-ink font-semibold">yourctf.local</span>
        <span>2026</span>
      </div>

      {/* Central Cord & Status Display */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-[6svh]">
        {/* Hanging Cord */}
        <div className="flex flex-col items-center">
          <div
            className="w-[1px] bg-gradient-to-b from-transparent via-[#e7e7e2]/60 to-[#e7e7e2] transition-all duration-75"
            style={{ height: `${160 + pullOffset}px` }}
          />
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="Pull cord or press Enter"
            className="cord__bead cursor-grab active:cursor-grabbing hover:scale-110"
            style={{
              transform: `translateY(${pullOffset}px)`,
              '--glow': isReady ? '1.5' : '0.8',
            } as React.CSSProperties}
          />
        </div>

        {/* Dynamic Status / Action */}
        <div className="mt-12 flex flex-col items-center text-center">
          {!isReady ? (
            <div className="flex flex-col items-center gap-2">
              <span className="font-display text-[clamp(64px,9vw,130px)] font-bold leading-none tracking-tight text-ink tabular-nums">
                {String(count).padStart(3, '0')}
              </span>
              <span className="text-[12px] font-mono tracking-widest uppercase text-lit/80 transition-all duration-300">
                {phaseText}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <button
                onClick={triggerOpen}
                className="font-display text-[clamp(48px,7.5vw,96px)] font-bold uppercase leading-none tracking-tight text-ink hover:text-lit transition-colors"
              >
                PULL THE CORD
              </button>
              <span className="text-[13px] font-mono tracking-wider text-faint uppercase">
                drag it down, or press enter
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Meta Bar */}
      <div className="flex items-center justify-between text-[12px] font-mono uppercase tracking-wider text-faint">
        <span>YOURCTF // WAR ROOM EXPERIMENTAL</span>
        <span>BEST WITH SOUND ON</span>
      </div>
    </div>
  );
};
