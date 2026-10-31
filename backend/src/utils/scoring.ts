export type ScoringMode = 'static' | 'dynamic';

export interface DecayOptions {
  /** Points a challenge converges to once fully solved out. */
  minimumPoints: number;
  /** Number of solves at which the challenge reaches minimumPoints. */
  decayThreshold: number;
}

export const DEFAULT_DECAY: DecayOptions = {
  minimumPoints: 100,
  decayThreshold: 40,
};

/** Static mode: a flag is always worth its configured points. */
export function staticPoints(basePoints: number): number {
  return basePoints;
}

/**
 * Dynamic mode: CTFd-style decay. Worth basePoints at 1 solve, decaying
 * quadratically to minimumPoints at decayThreshold solves.
 */
export function dynamicPoints(
  basePoints: number,
  solveCount: number,
  options: DecayOptions = DEFAULT_DECAY,
): number {
  const solves = Math.max(1, solveCount);
  // A floor above the base value would inflate cheap flags, so cap it.
  const floor = Math.min(basePoints, options.minimumPoints);
  if (options.decayThreshold <= 1) return floor;
  const span = options.decayThreshold - 1;
  const decay = ((basePoints - floor) / (span * span)) * (solves - 1) ** 2;
  return Math.max(floor, Math.floor(basePoints - decay));
}

export function scoreFor(
  mode: ScoringMode,
  basePoints: number,
  solveCount: number,
  options: DecayOptions = DEFAULT_DECAY,
): number {
  return mode === 'dynamic' ? dynamicPoints(basePoints, solveCount, options) : staticPoints(basePoints);
}

export interface ScoringConfig {
  mode: ScoringMode;
  options: DecayOptions;
}

export const STATIC_SCORING: ScoringConfig = { mode: 'static', options: DEFAULT_DECAY };

/** Event rows store the mode uppercase and the decay knobs alongside it. */
export function scoringConfigFor(
  event: { scoringMode: string; scoringMinimumPoints: number; scoringDecayThreshold: number } | null,
): ScoringConfig {
  if (!event || event.scoringMode !== 'DYNAMIC') return STATIC_SCORING;
  return {
    mode: 'dynamic',
    options: {
      minimumPoints: Math.max(0, event.scoringMinimumPoints),
      decayThreshold: Math.max(2, event.scoringDecayThreshold),
    },
  };
}

/**
 * Award for the solve being recorded now. `solvesBefore` counts existing
 * solves on this flag, so the first solver receives the base value and every
 * later award is equal or smaller.
 */
export function awardFor(
  config: ScoringConfig,
  basePoints: number,
  solvesBefore: number,
): number {
  return scoreFor(config.mode, basePoints, solvesBefore + 1, config.options);
}
