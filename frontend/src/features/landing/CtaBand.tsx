import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/lib/icons';

export function CtaBand() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="band-ink relative isolate overflow-hidden" aria-labelledby="cta-title">
      {/* The reference's dark band carries a starfield. This one is painted with
          gradients so the page keeps a single canvas — the hero's. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, oklch(0.95 0.01 250 / 0.7) 0 1px, transparent 1.6px), radial-gradient(circle at center, oklch(0.8 0.12 292 / 0.55) 0 1px, transparent 1.6px), radial-gradient(45% 60% at 82% 100%, oklch(0.55 0.22 292 / 0.28), transparent 70%)',
          backgroundSize: '148px 148px, 212px 212px, 100% 100%',
          backgroundPosition: '12px 20px, 90px 60px, center',
        }}
      />

      <div className="mx-auto grid max-w-container gap-10 px-4 py-20 sm:px-6 sm:py-band-lg lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
        <Reveal className="flex flex-col gap-4">
          <h2 id="cta-title" className="max-w-[16ch] font-display text-display font-medium leading-[1.03] tracking-[-0.035em] text-primary">
            The board is <span className="text-accent-strong">open.</span>
          </h2>
          <p className="max-w-measure text-secondary">
            Create an account, join a team with an invite code, and start submitting flags.
            Everything is scoped to your team line, so a solve counts once and stays counted.
          </p>
        </Reveal>

        <Reveal delay={80} className="flex flex-col gap-5 lg:items-end">
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/challenges" className={buttonVariants('primary', 'lg')}>
                Browse challenges
                <Icon name="arrow-right" size={16} />
              </Link>
            ) : (
              <Link to="/register" className={buttonVariants('primary', 'lg')}>
                Create your account
                <Icon name="arrow-right" size={16} />
              </Link>
            )}
            <Link
              to={isAuthenticated ? '/scoreboard' : '/login'}
              className={buttonVariants('secondary', 'lg')}
            >
              {isAuthenticated ? 'View scoreboard' : 'Sign in'}
            </Link>
          </div>
          <p className="type-small text-muted">
            {isAuthenticated
              ? 'Your team line updates on the next board refresh.'
              : 'Free to join. No install, no plugins — just a browser.'}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
