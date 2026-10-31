import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function newSalt(): string {
  return randomBytes(16).toString('hex');
}

export function normalizeFlag(flag: string): string {
  return flag.trim();
}

export type FlagHashAlgorithm = 'sha256' | 'sha512';

export function hashFlag(flag: string, salt: string, algo: FlagHashAlgorithm = 'sha256'): string {
  return createHash(algo).update(`${salt}:${normalizeFlag(flag)}`).digest('hex');
}

/** Constant-time check against the algorithm stored with the flag. */
export function verifyFlag(
  flag: string,
  salt: string,
  hash: string,
  algo: FlagHashAlgorithm = 'sha256',
): boolean {
  const candidate = Buffer.from(hashFlag(flag, salt, algo), 'hex');
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

/**
 * Wrong guesses are retained only as a salted digest plus length. The digest
 * uses SHA-256 regardless of flag algorithm: it exists for duplicate-attempt
 * analysis, never for checking.
 */
export function hashAttempt(value: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

/** Random, URL-safe token for email links. Only its hash is persisted. */
export function newOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
