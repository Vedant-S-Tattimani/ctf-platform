import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Deliberately small allowlist: formats a CTF handout needs, nothing that a
 * browser would render as active content (no HTML, SVG or scripts).
 */
export const ALLOWED_UPLOAD_TYPES = new Set([
  'application/octet-stream',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/gzip',
  'application/x-tar',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

const STORED_NAME = /^[a-f0-9]{32}$/;

export function uploadRoot(): string {
  return resolve(env.UPLOAD_DIR);
}

export function ensureUploadRoot(): void {
  mkdirSync(uploadRoot(), { recursive: true });
}

/**
 * Display names are cosmetic only. Stripping separators, control characters
 * and the Windows-reserved set keeps them safe in headers and UI, while the
 * on-disk name is always a random hex string.
 */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? 'download';
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'download').slice(0, 120);
}

export function normalizeMimeType(raw: string | undefined): string {
  return (raw ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

export function assertAllowedMimeType(mimeType: string): string {
  if (!ALLOWED_UPLOAD_TYPES.has(mimeType)) {
    throw new HttpError(415, 'That file type is not allowed for handouts');
  }
  return mimeType;
}

export function newStoredName(): string {
  return randomBytes(16).toString('hex');
}

/** Rejects anything that is not a generated name, so callers cannot escape root. */
export function resolveStoredFile(storedName: string): string {
  if (!STORED_NAME.test(storedName)) throw new HttpError(404, 'File not found');
  return join(uploadRoot(), storedName);
}

export function downloadUrlFor(assetId: string): string {
  return `/api/v1/files/${assetId}`;
}

/** RFC 5987-safe attachment header without ever reflecting raw header values. */
export function attachmentHeader(displayName: string): string {
  const fallback = displayName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(displayName)}`;
}
