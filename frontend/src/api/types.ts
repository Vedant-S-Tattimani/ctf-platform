export type Role = 'USER' | 'ADMIN';

/** What every other player may see. Never includes the email address. */
export interface PublicUser {
  id: string;
  username: string;
  role: Role;
  avatarUrl: string | null;
  bio: string | null;
  teamId: string | null;
  createdAt: string;
}

/** The authenticated caller's own user payload. */
export interface User extends PublicUser {
  email: string;
  emailVerifiedAt: string | null;
  teamName?: string | null;
}

export interface PublicProfile extends PublicUser {
  teamName: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  maxSize: number;
  /** Null on public lookups; only team members receive the code. */
  inviteCode: string | null;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  members: PublicUser[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ChallengeSummary {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Configured base value. */
  points: number;
  /** What the next solver earns right now (decays on dynamic events). */
  currentPoints: number;
  order: number;
  category: Category;
  eventId: string | null;
  flagsTotal: number;
  flagsSolved: number;
  solveCount: number;
  solvedByMe: boolean;
  firstBloodByMe: boolean;
}

/** Admin view: hint text is always present. */
export interface Hint {
  id: string;
  content: string;
  cost: number;
  order: number;
}

/** Public view: paid hint text stays null until unlocked. */
export interface PublicHint {
  id: string;
  order: number;
  cost: number;
  unlocked: boolean;
  content: string | null;
}

export interface UnlockHintResult {
  hint: PublicHint;
  alreadyUnlocked: boolean;
  pointsSpent: number;
  /** Score remaining after the unlock. */
  points: number;
}

export interface ChallengeFile {
  id: string;
  name: string;
  /** External reference or legacy path; null for stored uploads. */
  path: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  /** Same-origin download endpoint for stored uploads. */
  downloadUrl: string | null;
}

export interface FlagMeta {
  id: string;
  label: string | null;
  points: number;
  currentPoints: number;
  order: number;
  solvedByMe: boolean;
  firstBlood: boolean;
}

export interface ChallengeDetail extends ChallengeSummary {
  description: string;
  hints: PublicHint[];
  files: ChallengeFile[];
  flags: FlagMeta[];
}

export interface SubmitResult {
  correct: boolean;
  points?: number;
  firstBlood?: boolean;
  duplicate?: boolean;
  flagLabel?: string | null;
  message: string;
}

export interface SubmissionRecord {
  id: string;
  /** Length of the wrong attempt; the attempt itself is never returned. */
  providedLength: number | null;
  /** 8-char salted-hash prefix, only when the server enables it. */
  providedHashPrefix: string | null;
  correct: boolean;
  createdAt: string;
  challenge: { id: string; title: string };
  flag: { id: string; label: string | null; points: number } | null;
}

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

export interface ScoreboardPoint {
  t: string;
  y: number;
}

export interface ScoreboardSeries {
  id: string;
  name: string;
  points: ScoreboardPoint[];
}

export type EventState = 'live' | 'upcoming' | 'ended';

/** The published event the shell is currently presenting. No flags, no drafts. */
export interface PublicEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  teamMaxSize: number;
  challengeCount: number;
  state: EventState;
}

export interface CurrentEventResponse {
  event: PublicEvent | null;
  serverTime: string;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  env: string;
  time: string;
}

// --- admin ---

export interface AdminCounts {
  flags?: number;
  hints?: number;
  files?: number;
  solves: number;
  challenges?: number;
  members?: number;
}

export interface AdminChallenge {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  eventId: string | null;
  difficulty: string;
  points: number;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  event: { id: string; name: string } | null;
  _count: AdminCounts;
}

export interface AdminScoringPreview {
  mode: 'DYNAMIC';
  minimumPoints: number;
  decayThreshold: number;
  samples: { solves: number; points: number }[];
}

export interface AdminChallengeDetail extends AdminChallenge {
  flags: { id: string; label: string | null; points: number; order: number; algo: string }[];
  hints: Hint[];
  files: ChallengeFile[];
  scoring: AdminScoringPreview | null;
}

export interface UploadedAsset {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  downloadUrl: string;
}

export interface AdminCategory extends Category {
  icon: string | null;
  createdAt: string;
  _count: { challenges: number };
}

export interface AdminEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  teamMaxSize: number;
  published: boolean;
  scoringMode: 'STATIC' | 'DYNAMIC';
  scoringMinimumPoints: number;
  scoringDecayThreshold: number;
  createdAt: string;
  updatedAt: string;
  _count: { challenges: number };
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  team: { id: string; name: string } | null;
  _count: { solves: number };
}

export interface AdminTeamRow {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  maxSize: number;
  createdAt: string;
  owner: { username: string };
  _count: { members: number; solves: number };
}

export interface AdminSubmissionRow {
  id: string;
  correct: boolean;
  providedLength: number | null;
  providedHashPrefix: string | null;
  createdAt: string;
  user: string;
  team: string | null;
  challenge: string;
}
