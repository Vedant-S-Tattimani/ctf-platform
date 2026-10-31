import type { Difficulty } from '@/api/types';

const dateFormatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
});

const utcDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const utcDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

const utcCompactFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatDateUTC(iso: string): string {
  return utcDateFormatter.format(new Date(iso));
}

export function formatDateTimeUTC(iso: string): string {
  return utcDateTimeFormatter.format(new Date(iso));
}

/** "2 Nov, 18:00 UTC" — the shell's compact event clock. */
export function formatCompactUTC(iso: string): string {
  return utcCompactFormatter.format(new Date(iso));
}

export function formatCountdown(targetIso: string, nowMs: number): string {
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return 'now';
  const minutes = Math.floor(diff / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'under a minute';
}

export function formatBytes(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  if (parts.length >= 2) {
    const second = parts[1] ?? '';
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export function difficultyLabel(value: string): string {
  return DIFFICULTY_LABELS[value.toUpperCase() as Difficulty] ?? value;
}

export function difficultyTone(value: string): 'success' | 'warning' | 'danger' {
  const level = value.toUpperCase();
  if (level === 'EASY') return 'success';
  if (level === 'MEDIUM') return 'warning';
  return 'danger';
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
