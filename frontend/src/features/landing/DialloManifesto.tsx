import React from 'react';

const STACK_TAGS = [
  'PRISMA ORM',
  'SQLITE / POSTGRES',
  'TIMING-SAFE EQUAL',
  'SHA-256 SALTED HASH',
  'JWT HTTPONLY SESSIONS',
  'HELMET SECURITY HEADERS',
  'ZOD RUNTIME VALIDATION',
  'EXPRESS RATE LIMITING',
  'REACT 18 & TANSTACK QUERY',
  'MOTION & GSAP',
  'TAILWIND CSS',
  'CANVAS DYNAMICS',
];

export const DialloManifesto: React.FC = () => {
  return (
    <section className="relative mx-auto max-w-[1320px] px-6 py-24 sm:px-12 sm:py-32 lg:px-20 border-t border-line">
      {/* Soft gradient veil so the 3D room remains visible while text is razor-sharp */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -left-[50vw] -right-[50vw] -z-10 bg-gradient-to-b from-transparent via-[#070605]/85 to-[#070605]/95 backdrop-blur-[2px]"
      />
      {/* Chapter Header */}
      <div className="flex items-baseline justify-between text-[13px] font-mono uppercase tracking-wider text-faint">
        <div className="flex items-baseline gap-3">
          <span className="text-lit font-bold">01</span>
          <span className="text-line">/</span>
          <h2 className="text-ink font-semibold">SECURITY ARCHITECTURE</h2>
        </div>
        <span className="hidden sm:inline text-faint">ZERO-TRUST AUDIT</span>
      </div>

      {/* Manifesto statement */}
      <div className="mt-12 max-w-[50ch]">
        <p className="font-sans text-[clamp(24px,3.2vw,46px)] font-normal leading-[1.25] tracking-[-0.03em] text-dim">
          Flags are <span className="font-semibold text-ink">never stored in plaintext</span>.
          Each submission runs against a 16-byte cryptographically random salt using{' '}
          <span className="text-lit font-semibold">timingSafeEqual</span> to eliminate side-channel
          leakage. No administrative dump, build bundle, or API response ever exposes the secret.
        </p>
      </div>

      {/* Facts & Tech Stack Matrix */}
      <div className="mt-20 grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        {/* Left: Giant Telemetry Numbers */}
        <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-8 gap-y-10">
          <div>
            <dt className="font-display text-[clamp(52px,5.5vw,90px)] font-bold leading-none text-ink">
              12
            </dt>
            <dd className="mt-1 text-[13px] font-sans text-faint uppercase tracking-wider">
              PUBLISHED TARGETS
            </dd>
          </div>
          <div>
            <dt className="font-display text-[clamp(52px,5.5vw,90px)] font-bold leading-none text-lit">
              13
            </dt>
            <dd className="mt-1 text-[13px] font-sans text-faint uppercase tracking-wider">
              SALTED FLAGS ACTIVE
            </dd>
          </div>
          <div>
            <dt className="font-display text-[clamp(52px,5.5vw,90px)] font-bold leading-none text-cyan-lit">
              100%
            </dt>
            <dd className="mt-1 text-[13px] font-sans text-faint uppercase tracking-wider">
              TIMING-SAFE VERIFICATION
            </dd>
          </div>
          <div>
            <dt className="font-display text-[clamp(52px,5.5vw,90px)] font-bold leading-none text-ink">
              0
            </dt>
            <dd className="mt-1 text-[13px] font-sans text-faint uppercase tracking-wider">
              PLAINTEXT SECRETS ON CLIENT
            </dd>
          </div>
        </dl>

        {/* Right: Technical Stack Badges */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-faint">
            DEFENSIVE & OFFENSIVE ARSENAL
          </span>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {STACK_TAGS.map((tag) => (
              <li
                key={tag}
                className="border border-line px-3.5 py-2 text-[12px] font-mono uppercase tracking-wider text-dim transition-all duration-300 hover:border-lit hover:text-ink hover:bg-surface"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
