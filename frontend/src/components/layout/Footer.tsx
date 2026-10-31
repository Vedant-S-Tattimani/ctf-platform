import { Link } from 'react-router-dom';
import { EventStatus } from '@/components/events/EventStatus';
import { useCurrentEvent } from '@/features/events/queries';
import { useAuth } from '@/hooks/useAuth';
import { BRAND } from '@/lib/brand';

const columnHeading = 'type-label text-muted';
const footerLink = 'type-small text-secondary transition-colors duration-instant hover:text-primary';

export function Footer() {
  const { isAdmin } = useAuth();
  const { data } = useCurrentEvent();
  const event = data?.event ?? null;

  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between md:gap-16">
        <div className="flex max-w-xs flex-col gap-3">
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

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:gap-16">
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

          {isAdmin && (
            <div className="flex flex-col gap-3">
              <p className={columnHeading}>Organizer</p>
              <Link to="/admin" className={footerLink}>
                Admin
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
