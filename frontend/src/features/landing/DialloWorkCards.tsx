import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/audio';

interface OperationTarget {
  id: string;
  num: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  solves: number;
  tags: string[];
  blurb: string;
  hasHandout?: boolean;
}

const FEATURED_TARGETS: OperationTarget[] = [
  {
    id: 'blog-vault',
    num: '01',
    title: 'BLOG VAULT',
    category: 'WEB EXPLOITATION',
    difficulty: 'Medium',
    points: 350,
    solves: 18,
    tags: ['IDOR', 'AUTH-BYPASS', 'SQLI', 'SESSION-TAMPER'],
    blurb:
      'An internal staging portal for the security staff blog was pushed with debug headers enabled. Pivot through an improper access control vulnerability on author drafts to retrieve the root administration flag.',
    hasHandout: true,
  },
  {
    id: 'cookie-jar',
    num: '02',
    title: 'COOKIE JAR',
    category: 'WEB EXPLOITATION',
    difficulty: 'Easy',
    points: 200,
    solves: 42,
    tags: ['COOKIES', 'BASE64', 'CRYPTO-WEAKNESS'],
    blurb:
      'Session cookies were generated using a custom serialization routine instead of cryptographic tokens. Deconstruct the client state, manipulate user privileges, and claim first blood.',
    hasHandout: false,
  },
  {
    id: 'caesars-lunch',
    num: '03',
    title: "CAESAR'S LUNCH",
    category: 'CRYPTOGRAPHY',
    difficulty: 'Easy',
    points: 150,
    solves: 59,
    tags: ['CLASSICAL', 'ROTATION', 'FREQUENCY-ANALYSIS'],
    blurb:
      'An encrypted dispatch was intercepted between rogue operatives. Standard frequency analysis and rotational heuristics reveal hidden coordinates and flag fragments.',
    hasHandout: true,
  },
  {
    id: 'pad-again',
    num: '04',
    title: 'PAD AGAIN',
    category: 'CRYPTOGRAPHY',
    difficulty: 'Hard',
    points: 450,
    solves: 9,
    tags: ['ONE-TIME-PAD', 'KEY-REUSE', 'XOR-RECOVERY'],
    blurb:
      'A stream cipher implementation with repeated keystream reuse across multiple intercepted high-value transmissions. Carry out known-plaintext recovery to extract the flag.',
    hasHandout: true,
  },
  {
    id: 'echo-chamber',
    num: '05',
    title: 'ECHO CHAMBER',
    category: 'BINARY PWN',
    difficulty: 'Medium',
    points: 300,
    solves: 14,
    tags: ['FORMAT-STRING', 'ARBITRARY-READ', 'GOT-OVERWRITE'],
    blurb:
      'A legacy telemetry daemon echoes back raw user input through printf without explicit formatting specifiers. Leak stack canary values and hijack the control flow.',
    hasHandout: true,
  },
  {
    id: 'memory-lane',
    num: '06',
    title: 'MEMORY LANE',
    category: 'DIGITAL FORENSICS',
    difficulty: 'Medium',
    points: 250,
    solves: 23,
    tags: ['VOLATILITY', 'MEM-DUMP', 'PROCESS-CARVING'],
    blurb:
      'A compromised Linux server memory snapshot was captured during a live intrusion. Reconstruct the malicious process tree, isolate injected shared objects, and identify the exfiltrated flag.',
    hasHandout: true,
  },
];

export const DialloWorkCards: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTarget = (FEATURED_TARGETS[activeIndex] ?? FEATURED_TARGETS[0]) as OperationTarget;

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    playClickSound('snap');
  };

  return (
    <section className="relative mx-auto max-w-[1320px] px-6 py-24 sm:px-12 sm:py-32 lg:px-20 border-t border-line">
      {/* Soft gradient veil so the 3D room remains visible in margins while cards are crisp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -left-[50vw] -right-[50vw] -z-10 bg-gradient-to-b from-[#070605]/92 via-[#070605]/98 to-[#070605] backdrop-blur-[3px]"
      />

      {/* Chapter Header */}
      <div className="flex items-baseline justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <div className="flex items-baseline gap-3">
          <span className="text-lit font-bold">03</span>
          <span className="text-line">/</span>
          <h2 className="text-ink font-semibold">FEATURED OPERATIONS</h2>
        </div>
        <span className="text-faint font-mono">
          SELECTION {activeTarget.num} OF 06
        </span>
      </div>

      {/* Main Split Work View */}
      <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_0.9fr] lg:gap-20 lg:items-start">
        {/* Left: Dynamic Challenge Showcase Card */}
        <div className="flex flex-col justify-between border border-line bg-[#0a0907]/94 backdrop-blur-md p-8 sm:p-12 shadow-2xl transition-all duration-500">
          <div>
            {/* Top Odometer & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-display text-[44px] font-bold leading-none text-lit">
                  {activeTarget.num}
                </span>
                <span className="text-[12px] font-mono text-faint">/ 06</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase">
                <span className="border border-line px-2.5 py-1 text-dim">
                  {activeTarget.category}
                </span>
                <span className="border border-line px-2.5 py-1 text-lit font-semibold">
                  {activeTarget.points} PTS
                </span>
                <span
                  className={`border px-2.5 py-1 font-semibold ${
                    activeTarget.difficulty === 'Hard'
                      ? 'border-alert/50 text-alert'
                      : activeTarget.difficulty === 'Medium'
                      ? 'border-lit/50 text-lit'
                      : 'border-cyan-lit/50 text-cyan-lit'
                  }`}
                >
                  {activeTarget.difficulty}
                </span>
              </div>
            </div>

            {/* Massive Title */}
            <h3 className="mt-8 font-display text-[clamp(40px,5.5vw,84px)] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink">
              {activeTarget.title}
            </h3>

            {/* Tactical Blurb */}
            <p className="mt-6 font-sans text-[15px] leading-relaxed text-secondary max-w-[50ch]">
              {activeTarget.blurb}
            </p>

            {/* Tags */}
            <div className="mt-6 flex flex-wrap gap-2 text-[12px] font-mono text-faint">
              {activeTarget.tags.map((tag) => (
                <span key={tag} className="border border-line px-2.5 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-12 flex flex-wrap items-center gap-4 pt-6 border-t border-line">
            <Link
              to="/challenges"
              onClick={() => playClickSound('high')}
              className="diallo-cta group !border-lit text-lit hover:!bg-lit hover:!text-night"
            >
              <span>INSPECT TARGET BRIEF</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <span className="text-[12px] font-mono text-faint">
              SOLVED BY {activeTarget.solves} OPERATIVES
            </span>
          </div>
        </div>

        {/* Right: Interactive Vertical Selector List (Diallo style) */}
        <div className="flex flex-col gap-1 border border-line bg-[#0a0907]/90 backdrop-blur-md p-6 sm:p-8 shadow-xl">
          <span className="mb-4 text-[11px] font-mono uppercase tracking-widest text-faint">
            ACTIVE TARGET ROSTER
          </span>

          {FEATURED_TARGETS.map((target, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={target.id}
                onClick={() => handleSelect(idx)}
                className={`group flex items-baseline justify-between py-4 text-left border-b border-line transition-all duration-300 ${
                  isActive
                    ? 'text-ink pl-3 border-lit'
                    : 'text-faint hover:text-dim hover:pl-2'
                }`}
              >
                <div className="flex items-baseline gap-4">
                  <span
                    className={`font-mono text-[13px] ${
                      isActive ? 'text-lit font-bold' : 'text-faint'
                    }`}
                  >
                    {target.num}
                  </span>
                  <span className="font-display text-[22px] sm:text-[26px] font-bold uppercase tracking-wider text-inherit">
                    {target.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-faint">{target.category}</span>
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-lit font-bold' : 'text-faint'
                    }`}
                  >
                    {target.points}p
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
