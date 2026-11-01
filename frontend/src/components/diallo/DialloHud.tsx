import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { playClickSound, toggleAmbientAudio } from '@/lib/audio';

interface DialloHudProps {
  onOpenTerminal?: () => void;
  currentChapter?: string;
}

export const DialloHud: React.FC<DialloHudProps> = ({
  onOpenTerminal,
  currentChapter = '01 // BRIEFING',
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [utcTime, setUtcTime] = useState('');
  const [audioOn, setAudioOn] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / totalScroll)));
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };

    const updateClock = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().slice(11, 19) + ' UTC'
      );
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handlePointerMove);
      clearInterval(clockInterval);
    };
  }, []);

  const handleAudioToggle = () => {
    const active = toggleAmbientAudio();
    setAudioOn(active);
    playClickSound('high');
  };

  return (
    <aside
      aria-label="Platform HUD Telemetry"
      className="pointer-events-none fixed inset-0 z-40 select-none text-[12px] font-mono leading-none text-dim transition-opacity duration-1000"
    >
      {/* Top Navigation Bar Solid Backdrop & Blur - completely protects HUD controls from scrolling text */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 right-0 h-24 bg-[#040303]/95 backdrop-blur-md border-b border-[#221c17]/50 -z-10 shadow-lg shadow-black/50"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-24 left-0 right-0 h-12 bg-gradient-to-b from-[#040303]/90 to-transparent -z-10"
      />

      {/* Bottom Telemetry Bar Solid Backdrop & Blur - protects chapter indicator and defense meter from scrolling text */}
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#040303] via-[#040303]/90 to-transparent backdrop-blur-[6px] -z-10"
      />

      {/* Top Left: Brand & Operation */}
      <div className="pointer-events-auto absolute left-6 top-6 flex flex-col gap-1 sm:left-8 sm:top-8">
        <Link
          to="/"
          onClick={() => playClickSound('low')}
          className="group flex items-baseline gap-2.5"
        >
          <span className="font-display text-[22px] font-bold uppercase tracking-wider text-ink transition-colors group-hover:text-lit sm:text-[26px]">
            YOURCTF
          </span>
          <span className="text-[10px] uppercase tracking-widest text-faint">
            v0.1.0
          </span>
        </Link>
        <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-faint">
          DEFCON WAR ROOM // COMPETITION PLATFORM
        </span>
      </div>

      {/* Top Right: Mission Controls & Quick Navigation */}
      <div className="pointer-events-auto absolute right-6 top-6 flex items-center gap-4 sm:right-8 sm:top-8 sm:gap-7">
        {/* Equalizer Audio */}
        <button
          onClick={handleAudioToggle}
          title="Toggle ambient audio"
          className="hidden items-center gap-2 text-[11px] uppercase tracking-wider text-dim transition-colors hover:text-ink md:inline-flex"
        >
          <span>AUDIO</span>
          <span className="inline-flex h-3 items-end gap-0.5">
            <i
              className={`w-0.5 bg-current transition-all duration-300 ${
                audioOn ? 'h-3 animate-pulse' : 'h-1'
              }`}
            />
            <i
              className={`w-0.5 bg-current transition-all duration-300 ${
                audioOn ? 'h-2 animate-pulse delay-100' : 'h-1'
              }`}
            />
            <i
              className={`w-0.5 bg-current transition-all duration-300 ${
                audioOn ? 'h-3.5 animate-pulse delay-200' : 'h-1'
              }`}
            />
          </span>
        </button>

        {/* Live Status indicator */}
        <div className="hidden items-center gap-2 text-[11px] text-faint lg:inline-flex">
          <span className="size-1.5 rounded-full bg-lit animate-pulse" />
          <span>API :4000 ONLINE</span>
        </div>

        {/* Terminal trigger */}
        {onOpenTerminal && (
          <button
            onClick={() => {
              playClickSound('snap');
              onOpenTerminal();
            }}
            className="hidden items-center gap-2 border border-hairline px-2.5 py-1 text-[11px] uppercase tracking-wider text-dim transition-all hover:border-lit hover:text-lit sm:inline-flex"
          >
            <span>&gt;_ CMD</span>
            <kbd className="text-[9px] text-faint border border-line px-1">Ctrl K</kbd>
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex items-center gap-3 sm:gap-5 text-[12px] font-sans font-medium uppercase tracking-wider">
          <Link
            to="/challenges"
            onClick={() => playClickSound('low')}
            className={`transition-colors hover:text-lit ${
              pathname.startsWith('/challenges') ? 'text-lit font-semibold' : 'text-dim'
            }`}
          >
            Targets
          </Link>
          <Link
            to="/scoreboard"
            onClick={() => playClickSound('low')}
            className={`transition-colors hover:text-lit ${
              pathname.startsWith('/scoreboard') ? 'text-lit font-semibold' : 'text-dim'
            }`}
          >
            Scoreboard
          </Link>
          <Link
            to="/teams"
            onClick={() => playClickSound('low')}
            className={`transition-colors hover:text-lit ${
              pathname.startsWith('/teams') ? 'text-lit font-semibold' : 'text-dim'
            }`}
          >
            Teams
          </Link>
          <Link
            to="/login"
            onClick={() => playClickSound('high')}
            className="diallo-cta !px-3 !py-1.5 !text-[11px]"
          >
            Sign In
          </Link>
        </nav>
      </div>

      {/* Bottom Left: Chapter indicator */}
      <div className="absolute bottom-6 left-6 hidden items-baseline gap-3 text-ink sm:bottom-8 sm:left-8 sm:flex">
        <span className="text-lit font-mono font-medium text-[11px] uppercase tracking-widest">
          CHAPTER
        </span>
        <span className="font-display text-[18px] uppercase tracking-wide text-ink">
          {currentChapter}
        </span>
      </div>

      {/* Bottom Right: Telemetry & Time */}
      <div className="absolute bottom-6 right-6 hidden items-end gap-5 text-right sm:bottom-8 sm:right-8 sm:flex">
        <div className="flex flex-col gap-1 text-[10px] text-faint">
          <div className="text-dim font-mono">{utcTime}</div>
          <div className="font-mono tabular-nums">
            X: {String(coords.x).padStart(4, '0')} Y: {String(coords.y).padStart(4, '0')}
          </div>
        </div>

        {/* Solve meter bar */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] uppercase tracking-wider text-faint">
            DEFENSE METER
          </span>
          <div className="h-[2px] w-24 overflow-hidden bg-line">
            <div
              className="h-full bg-lit transition-all duration-300"
              style={{ width: `${Math.round(scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Edge: Vertical Scroll Progress Bar (Diallo signature) */}
      <div className="pointer-events-none absolute right-4 top-1/2 hidden h-[24vh] w-[1px] -translate-y-1/2 bg-line lg:block">
        <div
          className="w-full bg-ink origin-top transition-transform duration-150"
          style={{
            height: '100%',
            transform: `scaleY(${scrollProgress})`,
          }}
        />
      </div>
    </aside>
  );
};
