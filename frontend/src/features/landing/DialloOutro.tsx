import React from 'react';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/audio';

export const DialloOutro: React.FC = () => {
  return (
    <section className="relative mx-auto flex min-h-[100svh] w-full max-w-[1320px] flex-col justify-between px-6 pt-28 pb-32 sm:px-12 sm:pt-36 sm:pb-40 lg:px-20 border-t border-line select-none">
      {/* Chapter Header */}
      <div className="flex items-baseline justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <div className="flex items-baseline gap-3">
          <span className="text-lit font-bold">05</span>
          <span className="text-line">/</span>
          <h2 className="text-ink font-semibold">DISPATCH PROTOCOL</h2>
        </div>
        <span className="text-faint font-mono">STANDBY MODE</span>
      </div>

      {/* Center is left open for the return of the 3D cinematic room & hanging pendant lamp! */}
      <div className="flex-1 min-h-[22vh]" />

      {/* Bottom Content Area */}
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="max-w-[56ch]">
          <h3 className="font-display text-[clamp(40px,6vw,92px)] font-bold uppercase leading-[0.9] tracking-[-0.04em] text-ink">
            JOIN THE <br />
            <span className="text-lit">WAR ROOM.</span>
          </h3>

          <p className="mt-6 font-sans text-[15px] leading-relaxed text-secondary">
            Register your team handle, generate invite tokens, and access live Jeopardy targets.
            All flags validated in constant-time with dynamic solve degradation.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              onClick={() => playClickSound('high')}
              className="diallo-cta group !border-lit text-lit hover:!bg-lit hover:!text-night"
            >
              <span>INITIALIZE OPERATIVE ACCOUNT</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              to="/challenges"
              onClick={() => playClickSound('low')}
              className="diallo-link text-dim hover:text-ink text-[13px] uppercase tracking-wider"
            >
              BROWSE TARGET BOARD
            </Link>
          </div>
        </div>

        {/* Telemetry info & System Status (spaced comfortably above bottom HUD) */}
        <div className="flex flex-col items-start lg:items-end gap-3 font-mono text-[11px] text-faint">
          <span className="text-lit font-bold tracking-wider">SEASON 2026 // OPEN REGISTRATION</span>
          <span>CRYPTOGRAPHIC FLAG VERIFICATION READY</span>
          <span className="text-dim">DEFCON RULES ACTIVE · CONSTANT-TIME</span>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-faint/70 border-t border-line/60 pt-2">
            <span>SHA-256 SALTED HASH</span>
            <span>·</span>
            <span>WAR ROOM ENGINE ACTIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
};
