import { prisma } from '../../db/prisma.js';
import type { ScoreboardQuery } from './scoreboard.schema.js';

export interface ScoreboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number | null;
  points: number;
  solveCount: number;
  lastSolveAt: string | null;
}

export interface ScoreboardSeries {
  id: string;
  name: string;
  points: { t: string; y: number }[];
}

function solveWhere(query: ScoreboardQuery) {
  return {
    ...(query.scope === 'teams' ? { teamId: { not: null } } : {}),
    ...(query.eventId ? { challenge: { eventId: query.eventId } } : {}),
  };
}

function unlockWhere(query: ScoreboardQuery) {
  return query.eventId ? { challenge: { eventId: query.eventId } } : {};
}

/** Points spent on hints, keyed by team id or user id depending on scope. */
async function spentByPayer(query: ScoreboardQuery): Promise<Map<string, number>> {
  const spend = new Map<string, number>();

  if (query.scope === 'teams') {
    const rows = await prisma.hintUnlock.groupBy({
      by: ['teamId'],
      where: { teamId: { not: null }, ...unlockWhere(query) },
      _sum: { pointsSpent: true },
    });
    for (const row of rows) {
      if (row.teamId) spend.set(row.teamId, row._sum.pointsSpent ?? 0);
    }
    return spend;
  }

  const rows = await prisma.hintUnlock.groupBy({
    by: ['payerKey'],
    where: { payerKey: { startsWith: 'user:' }, ...unlockWhere(query) },
    _sum: { pointsSpent: true },
  });
  for (const row of rows) {
    spend.set(row.payerKey.slice('user:'.length), row._sum.pointsSpent ?? 0);
  }
  return spend;
}

export async function listScoreboard(query: ScoreboardQuery): Promise<ScoreboardEntry[]> {
  const [grouped, spend] = await Promise.all([
    prisma.solve.groupBy({
      by: query.scope === 'teams' ? ['teamId'] : ['userId'],
      where: solveWhere(query),
      _sum: { points: true },
      _count: { _all: true },
      _max: { solvedAt: true },
    }),
    spentByPayer(query),
  ]);

  const rows = grouped
    .map((g) => {
      const id = (query.scope === 'teams' ? g.teamId : g.userId) as string;
      return {
        id,
        points: (g._sum.points ?? 0) - (spend.get(id) ?? 0),
        solveCount: g._count._all,
        lastSolveAt: g._max.solvedAt,
      };
    })
    .filter((r): r is typeof r & { id: string } => Boolean(r.id))
    .sort(
      (a, b) =>
        b.points - a.points || (a.lastSolveAt?.getTime() ?? Infinity) - (b.lastSolveAt?.getTime() ?? Infinity),
    )
    .slice(query.offset, query.offset + query.limit);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const names = new Map<string, { name: string; avatarUrl: string | null; memberCount: number | null }>();

  if (query.scope === 'teams') {
    const teams = await prisma.team.findMany({
      where: { id: { in: ids } },
      include: { _count: { select: { members: true } } },
    });
    for (const t of teams) {
      names.set(t.id, { name: t.name, avatarUrl: t.avatarUrl, memberCount: t._count.members });
    }
  } else {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, avatarUrl: true },
    });
    for (const u of users) {
      names.set(u.id, { name: u.username, avatarUrl: u.avatarUrl, memberCount: null });
    }
  }

  return rows.map((r, i) => {
    const meta = names.get(r.id);
    return {
      rank: query.offset + i + 1,
      id: r.id,
      name: meta?.name ?? 'unknown',
      avatarUrl: meta?.avatarUrl ?? null,
      memberCount: meta?.memberCount ?? null,
      points: r.points,
      solveCount: r.solveCount,
      lastSolveAt: r.lastSolveAt?.toISOString() ?? null,
    };
  });
}

export async function scoreboardHistory(query: ScoreboardQuery): Promise<ScoreboardSeries[]> {
  const top = await listScoreboard({ ...query, scope: 'teams', limit: 5, offset: 0 });
  if (top.length === 0) return [];

  const ids = top.map((t) => t.id);
  const event = query.eventId
    ? await prisma.event.findUnique({ where: { id: query.eventId } })
    : null;

  const [solves, unlocks] = await Promise.all([
    prisma.solve.findMany({
      where: { teamId: { in: ids }, ...unlockWhere(query) },
      orderBy: { solvedAt: 'asc' },
      select: { teamId: true, points: true, solvedAt: true },
    }),
    prisma.hintUnlock.findMany({
      where: { teamId: { in: ids }, ...unlockWhere(query) },
      select: { teamId: true, pointsSpent: true, unlockedAt: true },
    }),
  ]);

  return top.map((team) => {
    const events = [
      ...solves
        .filter((s) => s.teamId === team.id)
        .map((s) => ({ at: s.solvedAt, delta: s.points })),
      // Hint spend is a downward step in the cumulative line, never an edit.
      ...unlocks
        .filter((u) => u.teamId === team.id)
        .map((u) => ({ at: u.unlockedAt, delta: -u.pointsSpent })),
    ].sort((a, b) => a.at.getTime() - b.at.getTime());

    let cumulative = 0;
    const points = events.map((event) => {
      cumulative += event.delta;
      return { t: event.at.toISOString(), y: cumulative };
    });
    const start =
      event?.startsAt?.toISOString() ?? events[0]?.at.toISOString() ?? new Date().toISOString();
    return { id: team.id, name: team.name, points: [{ t: start, y: 0 }, ...points] };
  });
}
