import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-container flex-col gap-6 px-4 py-24 sm:px-6">
      <h1 className="type-display max-w-[18ch] text-primary">404 — no such signal</h1>
      <p className="max-w-measure text-secondary">
        That page is not on the board. It may have moved, or it never existed. Nothing about your
        account or progress changed.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
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
      <p className="type-small text-muted">
        Followed a link from inside {BRAND.name}? That link is broken —{' '}
        <a href={`mailto:${BRAND.supportEmail}`} className="text-secondary underline underline-offset-2 hover:text-primary">
          tell us where it was
        </a>
        .
      </p>
    </main>
  );
}
