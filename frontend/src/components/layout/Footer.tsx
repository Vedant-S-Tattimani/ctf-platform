import { Link } from 'react-router-dom';
import { EventStatus } from '@/components/events/EventStatus';
import { useCurrentEvent } from '@/features/events/queries';
import { useAuth } from '@/hooks/useAuth';
import { BRAND } from '@/lib/brand';

const columnHeading = 'type-label text-muted';
const footerLink = 'type-small text-secondary transition-colors duration-instant hover:text-primary';

export function Footer() {
  const { user, isAdmin } = useAuth();
  const { data } = useCurrentEvent();
  const event = data?.event ?? null;

  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto grid max-w-container gap-12 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 lg:py-20">
        <div className="flex max-w-sm flex-col gap-4">
          <p className="font-display text-h3 text-primary">{BRAND.name}</p>
          <p className="type-small text-muted">{BRAND.tagline}</p>
          <div className="min-h-[1.5rem]">
            {event ? (
              <EventStatus variant="line" event={event} />
            ) : (
              <p className="type-small text-muted">No event is published right now.</p>
            )}
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-x-12"
        >
          <div className="flex flex-col gap-3">
            <p className={columnHeading}>Play</p>
            <Link to="/challenges" className={footerLink}>
              Challenges
            </Link>
            <Link to="/scoreboard" className={footerLink}>
              Scoreboard
            </Link>
            <Link to="/teams" className={footerLink}>
              Teams
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className={columnHeading}>Account</p>
            {user ? (
              <>
                <Link to="/account" className={footerLink}>
                  My account
                </Link>
                <Link to={`/users/${user.id}`} className={footerLink}>
                  Public profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className={footerLink}>
                  Sign in
                </Link>
                <Link to="/register" className={footerLink}>
                  Create account
                </Link>
              </>
            )}
            <Link to="/forgot-password" className={footerLink}>
              Reset password
            </Link>
          </div>

          {isAdmin && (
            <div className="flex flex-col gap-3">
              <p className={columnHeading}>Organizer</p>
              <Link to="/admin" className={footerLink}>
                Admin
              </Link>
              <Link to="/admin/challenges" className={footerLink}>
                Challenges
              </Link>
              <Link to="/admin/events" className={footerLink}>
                Events
              </Link>
              <Link to="/admin/people" className={footerLink}>
                People
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className={columnHeading}>About</p>
            <Link to="/#scoring" className={footerLink}>
              How scoring works
            </Link>
            <a href={`mailto:${BRAND.supportEmail}`} className={footerLink}>
              Contact
            </a>
          </div>
        </nav>
      </div>

      {/* The reference's signature move: the wordmark at display size, edge to
          edge, in the same ink as the body copy. Clipped, never scrolled. */}
      <div aria-hidden className="overflow-hidden border-t border-hairline">
        <p className="select-none whitespace-nowrap text-center font-display text-[clamp(4rem,25vw,20rem)] font-medium leading-[0.82] tracking-[-0.05em] text-primary">
          {BRAND.name}
        </p>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-container flex-col gap-1 px-4 py-5 type-small text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Built for people who read the error message.
          </p>
          <p>All event times shown in UTC.</p>
        </div>
      </div>
    </footer>
  );
}
