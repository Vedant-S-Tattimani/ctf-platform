import { Link } from 'react-router-dom';
import type { ScoreboardSeries } from '@/api/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTimeUTC, formatPoints } from '@/lib/format';

const SERIES_COLORS = [
  'var(--accent)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--danger)',
];

const WIDTH = 720;
const HEIGHT = 220;
const PAD_X = 6;
const PAD_Y = 10;

/** Matches the podium card so the scoreboard reads as a stack of panels. */
const chartShell = 'rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8';

export function ScoreChart({
  series,
  isPending,
}: {
  series: ScoreboardSeries[];
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <section aria-labelledby="points-chart-title" className={chartShell} aria-busy="true">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="points-chart-title" className="type-h3 text-primary">
              Points over time
            </h2>
            <p className="type-small text-secondary">
              Cumulative points for the top five teams, all times UTC.
            </p>
          </div>
          <Skeleton className="h-[1.3125rem] w-20" />
        </div>
        <Skeleton className="mt-4 aspect-[720/220] w-full" />
        <div className="mt-1 flex justify-between">
          <Skeleton className="h-[1.3125rem] w-28" />
          <Skeleton className="h-[1.3125rem] w-28" />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[1.3125rem] w-36" />
          ))}
        </div>
      </section>
    );
  }

  const prepared = series
    .map((entry, index) => ({
      ...entry,
      color: SERIES_COLORS[index % SERIES_COLORS.length] ?? 'var(--accent)',
      points: [...entry.points].sort((a, b) => Date.parse(a.t) - Date.parse(b.t)),
    }))
    .filter((entry) => entry.points.length > 0);

  if (prepared.length === 0) {
    return (
      <section aria-labelledby="points-chart-title" className={chartShell}>
        <h2 id="points-chart-title" className="type-h3 text-primary">
          Points over time
        </h2>
        <p className="mt-1 max-w-measure type-small text-secondary">
          The chart draws itself as teams score. It starts with the first solve of the event.
        </p>
      </section>
    );
  }

  const times = prepared.flatMap((entry) => entry.points.map((point) => Date.parse(point.t)));
  const firstT = Math.min(...times);
  const lastT = Math.max(...times);
  const rawSpan = lastT - firstT;
  // A single burst of solves shares one timestamp; give the domain room so the
  // step renders as a jump on a timeline instead of a sliver at the left edge.
  const padding = rawSpan > 0 ? Math.max(rawSpan * 0.03, 60_000) : 10 * 60_000;
  const minT = firstT - padding;
  const maxT = lastT + padding;
  const maxY = Math.max(1, ...prepared.flatMap((entry) => entry.points.map((point) => point.y)));
  const span = Math.max(1, maxT - minT);

  const x = (t: number) => PAD_X + ((t - minT) / span) * (WIDTH - PAD_X * 2);
  const y = (value: number) => PAD_Y + (1 - value / maxY) * (HEIGHT - PAD_Y * 2);

  return (
    <section aria-labelledby="points-chart-title" className={chartShell}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="points-chart-title" className="type-h3 text-primary">
            Points over time
          </h2>
          <p className="type-small text-secondary">
            Cumulative points for the top five teams, all times UTC.
          </p>
        </div>
        <span className="type-small text-muted nums">peak {formatPoints(maxY)} pts</span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Cumulative points over time for ${prepared.map((entry) => entry.name).join(', ')}`}
        className="mt-4 h-auto w-full"
      >
        {[0, 1 / 3, 2 / 3, 1].map((fraction) => (
          <line
            key={fraction}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={PAD_Y + fraction * (HEIGHT - PAD_Y * 2)}
            y2={PAD_Y + fraction * (HEIGHT - PAD_Y * 2)}
            stroke="var(--border-hairline)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {prepared.map((entry) => (
          <g key={entry.id}>
            <path
              d={stepPath(entry.points, x, y, maxT)}
              fill="none"
              stroke={entry.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {entry.points.map((point, index) => (
              <circle
                key={`${point.t}-${index}`}
                cx={x(Date.parse(point.t))}
                cy={y(point.y)}
                r={index === entry.points.length - 1 ? 3 : 2}
                fill={entry.color}
              />
            ))}
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between type-small text-muted">
        <span>{formatDateTimeUTC(new Date(minT).toISOString())}</span>
        <span>{formatDateTimeUTC(new Date(maxT).toISOString())}</span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {prepared.map((entry) => {
          const last = entry.points[entry.points.length - 1];
          return (
            <li key={entry.id} className="flex items-center gap-2 type-small">
              <span
                aria-hidden
                className="size-2 rounded-pill"
                style={{ backgroundColor: entry.color }}
              />
              <Link to={`/teams/${entry.id}`} className="text-secondary hover:text-primary">
                {entry.name}
              </Link>
              <span className="nums font-mono text-primary">{formatPoints(last?.y ?? 0)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function stepPath(
  points: { t: string; y: number }[],
  x: (t: number) => number,
  y: (value: number) => number,
  endT: number,
): string {
  const first = points[0];
  if (!first) return '';
  let path = `M ${x(Date.parse(first.t))} ${y(first.y)}`;
  for (let index = 1; index < points.length; index++) {
    const point = points[index]!;
    const previous = points[index - 1]!;
    const px = x(Date.parse(point.t));
    path += ` L ${px} ${y(previous.y)} L ${px} ${y(point.y)}`;
  }
  const last = points[points.length - 1]!;
  path += ` L ${x(endT)} ${y(last.y)}`;
  return path;
}
