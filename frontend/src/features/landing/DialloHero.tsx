import React from 'react';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/audio';

interface DialloHeroProps {
  isLit: boolean;
  onToggleLamp: () => void;
  targetCount?: number;
  solvesCount?: number;
  teamCount?: number;
}

export const DialloHero: React.FC<DialloHeroProps> = ({
  targetCount = 12,
  solvesCount = 137,
  teamCount = 48,
}) => {
  return (
    <section className="relative flex h-[100svh] w-full flex-col justify-between px-6 pt-28 pb-24 sm:px-12 sm:pt-36 sm:pb-32 lg:px-20 select-none">
      {/* Top Meta info */}
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-faint">
        <div className="flex items-center gap-3">
          <span className="text-lit font-bold">STATUS: OPERATIONAL</span>
          <span className="text-line">/</span>
          <span>SEASON 2026 QUALIFIERS</span>
        </div>
        <div className="hidden sm:flex items-center gap-5">
          <span>{targetCount} TARGETS ARMED</span>
          <span>{solvesCount} TOTAL SOLVES</span>
        </div>
      </div>

      {/* Center is left open for the 3D Three.js swinging lamp and hacker desk! */}
      <div className="flex-1" />

      {/* Bottom Row (Screenshots 1 & 4) */}
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        {/* Bottom Left Pitch */}
        <div className="flex flex-col items-start gap-3">
          <span className="text-[12px] font-mono uppercase tracking-wider text-faint">
            WAR ROOM // DEFENSE & ATTACK ARENA
          </span>
          <h1 className="font-sans text-[clamp(24px,2.6vw,42px)] font-normal leading-[1.25] tracking-[-0.02em] text-ink max-w-[28ch]">
            Host events, breach targets, and command the real-time scoreboard.
          </h1>
        </div>

        {/* Bottom Right Actions */}
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="text-[12px] font-mono text-faint uppercase tracking-wider">
            {teamCount} TEAMS COMPETING LIVE
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/challenges"
              onClick={() => playClickSound('high')}
              className="diallo-cta group !border-lit text-lit hover:!bg-lit hover:!text-night"
            >
              <span>ENTER THE ARENA</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              to="/register"
              onClick={() => playClickSound('low')}
              className="diallo-link text-dim hover:text-ink text-[13px] uppercase tracking-wider"
            >
              REGISTER TEAM
            </Link>
          </div>
        </div>
      </div>

      {/* Center Bottom Scroll Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-faint">
          Scroll
        </span>
        <div className="h-5 w-[1px] bg-line overflow-hidden">
          <div className="h-full w-full bg-lit animate-drip" />
        </div>
      </div>
    </section>
  );
};
