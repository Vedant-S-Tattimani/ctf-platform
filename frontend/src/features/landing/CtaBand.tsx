import { Link } from 'react-router-dom';
import AnimatedContent from '@/components/reactbits/AnimatedContent';
import { buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/lib/icons';

export function CtaBand() {
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="border-t border-hairline bg-surface"
      aria-labelledby="cta-title"
    >
      <div className="mx-auto grid max-w-container gap-8 px-4 py-16 sm:px-6 sm:py-band lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-16">
        <AnimatedContent distance={20} duration={0.6} once>
          <div className="flex flex-col gap-4">
            <h2 id="cta-title" className="type-h1 max-w-[18ch] text-primary">
              The board is <span className="text-accent-strong">open.</span>
            </h2>
            <p className="max-w-measure text-secondary">
              Create an account, join a team with an invite code, and start submitting flags.
              Everything is scoped to your team line, so a solve counts once and stays counted.
            </p>
          </div>
        </AnimatedContent>

        <div className="flex flex-col gap-5 lg:items-end">
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
        </div>
      </div>
    </section>
  );
}
