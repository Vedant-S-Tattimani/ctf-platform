import { prisma } from '../../db/prisma.js';

export type EventState = 'live' | 'upcoming' | 'ended';

export interface CurrentEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  teamMaxSize: number;
  challengeCount: number;
  state: EventState;
}

interface EventRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  teamMaxSize: number;
  _count: { challenges: number };
}

function stateOf(startsAt: Date | null, endsAt: Date | null, now: Date): EventState {
  if (startsAt && startsAt > now) return 'upcoming';
  if (endsAt && endsAt < now) return 'ended';
  return 'live';
}

/**
 * The single event a public visitor should see: a published event that is live
 * now, else the next upcoming one, else the most recently ended one. Drafts and
 * dates are the only inputs, so the header never invents event status.
 */
export async function getCurrentEvent(now = new Date()): Promise<CurrentEvent | null> {
  const events: EventRow[] = await prisma.event.findMany({
    where: { published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      startsAt: true,
      endsAt: true,
      teamMaxSize: true,
      _count: { select: { challenges: { where: { published: true } } } },
    },
  });

  const ranked = events.map((event) => ({
    ...event,
    state: stateOf(event.startsAt, event.endsAt, now),
  }));

  const live = ranked
    .filter((event) => event.state === 'live')
    .sort((a, b) => (b.startsAt?.getTime() ?? 0) - (a.startsAt?.getTime() ?? 0))[0];
  const upcoming = ranked
    .filter((event) => event.state === 'upcoming')
    .sort((a, b) => (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0))[0];
  const ended = ranked
    .filter((event) => event.state === 'ended')
    .sort((a, b) => (b.endsAt?.getTime() ?? 0) - (a.endsAt?.getTime() ?? 0))[0];

  const chosen = live ?? upcoming ?? ended;
  if (!chosen) return null;

  return {
    id: chosen.id,
    name: chosen.name,
    slug: chosen.slug,
    description: chosen.description,
    startsAt: chosen.startsAt,
    endsAt: chosen.endsAt,
    teamMaxSize: chosen.teamMaxSize,
    challengeCount: chosen._count.challenges,
    state: chosen.state,
  };
}
