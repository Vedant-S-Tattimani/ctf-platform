import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';
import { NAV_LINKS } from '@/lib/nav';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-container flex-col gap-7 px-4 py-20 sm:px-6 lg:py-28">
      <p className="type-mono text-small text-muted">404 · route not found</p>

      <h1 className="max-w-[16ch] font-display text-display font-medium tracking-[-0.035em] text-primary">
        No such signal on this board
      </h1>

      <p className="max-w-measure text-body text-secondary">
        That page is not on the board. It may have moved, or it never existed. Nothing about your
        account or progress changed.
      </p>

      <div className="mt-1 flex flex-wrap gap-3">
        <Link to="/challenges" className={buttonVariants('primary', 'md')}>
          Back to challenges
        </Link>
        <Link to="/scoreboard" className={buttonVariants('secondary', 'md')}>
          Scoreboard
        </Link>
        <Link to="/" className={buttonVariants('ghost', 'md')}>
          Home
        </Link>
      </div>

      <nav
        aria-label="Other pages"
        className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-6"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="type-small text-muted transition-colors duration-instant hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <p className="type-small text-muted">
        Followed a link from inside {BRAND.name}? That link is broken —{' '}
        <a
          href={`mailto:${BRAND.supportEmail}`}
          className="text-secondary underline underline-offset-2 transition-colors duration-instant hover:text-primary"
        >
          tell us where it was
        </a>
        .
      </p>
    </main>
  );
}
