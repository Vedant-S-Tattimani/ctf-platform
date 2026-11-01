import React from 'react';
import { Link } from 'react-router-dom';
import { playClickSound } from '@/lib/audio';

interface DisciplineItem {
  num: string;
  name: string;
  slug: string;
  count: number;
  sub: string;
  body: string;
}

const DISCIPLINES: DisciplineItem[] = [
  {
    num: '01',
    name: 'WEB EXPLOITATION',
    slug: 'web',
    count: 3,
    sub: 'SERVER-SIDE FLAW · INJECTION & PRIVILEGE ESCALATION',
    body: 'Modern web targets featuring authentication bypasses, broken object-level authorization (IDOR), session manipulation, and vulnerable API pipelines.',
  },
  {
    num: '02',
    name: 'CRYPTOGRAPHY',
    slug: 'crypto',
    count: 2,
    sub: 'ALGORITHMIC VULNERABILITIES & CIPHER RECOVERY',
    body: 'Attacking broken stream ciphers, non-random salts, key-reuse hazards, and classical mathematical structures to extract plaintext flags.',
  },
  {
    num: '03',
    name: 'REVERSE ENGINEERING',
    slug: 'rev',
    count: 2,
    sub: 'BINARY DECOMPILATION & DISASSEMBLY',
    body: 'Statically and dynamically unpacking compiled binaries, anti-debugging routines, stripped symbols, and algorithmic verification logic.',
  },
  {
    num: '04',
    name: 'BINARY EXPLOITATION',
    slug: 'pwn',
    count: 2,
    sub: 'MEMORY CORRUPTION & CONTROL FLOW HIJACKING',
    body: 'Stack buffer overflows, format string vulnerabilities, return-oriented programming (ROP chains), and bypassing modern NX/canary mitigations.',
  },
  {
    num: '05',
    name: 'DIGITAL FORENSICS',
    slug: 'forensics',
    count: 2,
    sub: 'ARTIFACT EXTRACTION & PACKET ANALYSIS',
    body: 'Investigating raw disk dumps, memory images, pcap packet captures, and carved hidden steganography embedded in media payloads.',
  },
  {
    num: '06',
    name: 'RECON & OSINT',
    slug: 'recon',
    count: 1,
    sub: 'OPEN SOURCE INTELLIGENCE & SATELLITE RECON',
    body: 'Tracing digital footprints, metadata trails, geolocation coordinates, and publicly exposed infrastructure to reconstruct target identities.',
  },
];

export const DialloDisciplines: React.FC = () => {
  return (
    <section className="relative mx-auto max-w-[1320px] px-6 py-24 sm:px-12 sm:py-32 lg:px-20 border-t border-line">
      {/* Soft gradient veil so the 3D room remains visible while grid is razor-sharp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -left-[50vw] -right-[50vw] -z-10 bg-gradient-to-b from-[#070605]/85 via-[#070605]/95 to-[#070605] backdrop-blur-[2px]"
      />
      {/* Chapter Header */}
      <div className="flex items-baseline justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <div className="flex items-baseline gap-3">
          <span className="text-lit font-bold">02</span>
          <span className="text-line">/</span>
          <h2 className="text-ink font-semibold">ARENA DISCIPLINES</h2>
        </div>
        <Link
          to="/challenges"
          onClick={() => playClickSound('low')}
          className="diallo-link text-[12px] text-faint hover:text-lit uppercase tracking-wider"
        >
          VIEW ALL CHALLENGES →
        </Link>
      </div>

      {/* Architectural Disciplines Grid (2 columns on desktop) */}
      <div className="mt-14 border-t border-line grid grid-cols-1 md:grid-cols-2">
        {DISCIPLINES.map((d, idx) => {
          const isOdd = idx % 2 === 0;
          return (
            <Link
              key={d.slug}
              to={`/challenges?category=${d.slug}`}
              onClick={() => playClickSound('high')}
              className={`group flex flex-col justify-between border-b border-line py-10 transition-colors duration-300 hover:bg-surface/40 ${
                isOdd ? 'md:border-r md:pr-10' : 'md:pl-10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-faint">
                  <span>{d.num} // {d.count} {d.count === 1 ? 'TARGET' : 'TARGETS'}</span>
                  <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-lit">
                    EXPLORE →
                  </span>
                </div>

                <h3 className="mt-4 font-display text-[clamp(34px,3.8vw,56px)] font-bold uppercase leading-[0.92] tracking-tight text-ink transition-colors duration-300 group-hover:text-lit">
                  {d.name}
                </h3>

                <p className="mt-3 text-[12px] font-mono uppercase tracking-wider text-faint">
                  {d.sub}
                </p>
              </div>

              <p className="mt-8 max-w-[42ch] font-sans text-[14px] leading-relaxed text-dim">
                {d.body}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
