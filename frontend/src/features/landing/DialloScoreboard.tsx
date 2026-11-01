import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/audio';

interface LeaderTeam {
  rank: string;
  name: string;
  score: number;
  solves: number;
  lastSolve: string;
  members: number;
  country: string;
  badge: string;
}

const TOP_TEAMS: LeaderTeam[] = [
  {
    rank: '01',
    name: 'KERNEL PANIC',
    score: 2150,
    solves: 9,
    lastSolve: '8m ago on Format Feast',
    members: 4,
    country: 'GLOBAL',
    badge: 'FIRST BLOOD LEADER',
  },
  {
    rank: '02',
    name: 'CYBER ZERO',
    score: 1850,
    solves: 8,
    lastSolve: '14m ago on Pad Again',
    members: 4,
    country: 'US',
    badge: 'PWN SPECIALIST',
  },
  {
    rank: '03',
    name: 'BIT SHIFTERS',
    score: 1600,
    solves: 7,
    lastSolve: '23m ago on Blog Vault',
    members: 3,
    country: 'EU',
    badge: 'WEB AUDITOR',
  },
  {
    rank: '04',
    name: 'NULL POINTERS',
    score: 1350,
    solves: 6,
    lastSolve: '41m ago on Cookie Jar',
    members: 4,
    country: 'APAC',
    badge: 'CRYPTO HUNTER',
  },
  {
    rank: '05',
    name: 'SHADOW BYTE',
    score: 1100,
    solves: 5,
    lastSolve: '1h ago on Memory Lane',
    members: 2,
    country: 'LATAM',
    badge: 'FORENSICS ACE',
  },
];

export const DialloScoreboard: React.FC = () => {
  const [activeRank, setActiveRank] = useState(0);
  const selectedTeam = (TOP_TEAMS[activeRank] ?? TOP_TEAMS[0]) as LeaderTeam;

  return (
    <section className="relative mx-auto max-w-[1320px] px-6 py-24 sm:px-12 sm:py-32 lg:px-20 border-t border-line">
      {/* Soft gradient veil so the 3D room remains visible in background while scoreboard is crystal clear */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -left-[50vw] -right-[50vw] -z-10 bg-gradient-to-b from-[#070605]/92 via-[#070605]/98 to-[#070605] backdrop-blur-[3px]"
      />

      {/* Chapter Header */}
      <div className="flex items-baseline justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <div className="flex items-baseline gap-3">
          <span className="text-lit font-bold">04</span>
          <span className="text-line">/</span>
          <h2 className="text-ink font-semibold">BATTLEFIELD SCOREBOARD</h2>
        </div>
        <Link
          to="/scoreboard"
          onClick={() => playClickSound('low')}
          className="diallo-link text-[12px] text-faint hover:text-lit uppercase tracking-wider"
        >
          FULL LIVE SCOREBOARD →
        </Link>
      </div>

      {/* Main Timeline & Team Intel View */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_0.9fr] lg:gap-20 lg:items-start">
        {/* Left: Selected Team Intel Card */}
        <div className="flex flex-col justify-between border border-line bg-surface/50 p-8 sm:p-12">
          <div>
            <div className="flex items-center justify-between text-[12px] font-mono uppercase tracking-widest text-faint">
              <span>RANK #{selectedTeam.rank} · {selectedTeam.country}</span>
              <span className="border border-line px-2.5 py-0.5 text-lit font-semibold">
                {selectedTeam.badge}
              </span>
            </div>

            <h3 className="mt-6 font-display text-[clamp(44px,6vw,96px)] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink">
              {selectedTeam.name}
            </h3>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-b border-line py-6 font-mono text-[13px]">
              <div>
                <span className="text-faint text-[11px] uppercase tracking-wider">CUMULATIVE POINTS</span>
                <p className="mt-1 font-display text-[32px] font-bold text-lit leading-none">
                  {selectedTeam.score} PTS
                </p>
              </div>
              <div>
                <span className="text-faint text-[11px] uppercase tracking-wider">CAPTURED TARGETS</span>
                <p className="mt-1 font-display text-[32px] font-bold text-ink leading-none">
                  {selectedTeam.solves} FLAGS
                </p>
              </div>
            </div>

            <div className="mt-6 text-[13px] font-mono text-dim">
              <span className="text-faint">LATEST BREACH:</span> {selectedTeam.lastSolve}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-line flex items-center justify-between">
            <Link
              to="/scoreboard"
              onClick={() => playClickSound('high')}
              className="diallo-cta group !border-lit text-lit hover:!bg-lit hover:!text-night"
            >
              <span>INSPECT ATTACK TIMELINE</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <span className="text-[11px] font-mono text-faint">
              ROSTER: {selectedTeam.members} OPERATIVES
            </span>
          </div>
        </div>

        {/* Right: Timeline Node Track (Diallo style) */}
        <div className="relative border-l border-line pl-8 lg:pl-10 space-y-6">
          <span className="block mb-2 text-[11px] font-mono uppercase tracking-widest text-faint">
            PODIUM TIMELINE
          </span>

          {TOP_TEAMS.map((team, idx) => {
            const isActive = idx === activeRank;
            return (
              <div key={team.name} className="relative group">
                {/* Timeline Node Bullet */}
                <span
                  className={`absolute -left-[37px] lg:-left-[45px] top-4 size-2.5 transition-all duration-300 border ${
                    isActive
                      ? 'bg-lit border-lit shadow-[0_0_12px_rgba(242,220,180,0.8)] scale-125'
                      : 'bg-night border-faint group-hover:border-lit'
                  }`}
                />

                <button
                  onClick={() => {
                    setActiveRank(idx);
                    playClickSound('snap');
                  }}
                  className={`w-full text-left p-4 border transition-all duration-300 ${
                    isActive
                      ? 'border-line bg-surface/80 text-ink translate-x-2'
                      : 'border-transparent text-dim hover:text-ink hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-lit font-bold">#{team.rank}</span>
                    <span className="text-faint">{team.score} PTS</span>
                  </div>
                  <h4 className="mt-1 font-display text-[22px] font-bold uppercase tracking-wider text-inherit">
                    {team.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] font-mono text-faint truncate">
                    {team.lastSolve}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
