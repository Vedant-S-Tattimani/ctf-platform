import { ApiError } from '@/api/client';

type FieldErrors = Record<string, string>;

/** Extracts the first message per field from a zod `flatten()` payload. */
export function fieldErrorsFromApi(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.status !== 400 || !error.details) return {};
  const details = error.details as { fieldErrors?: Record<string, string[] | undefined> };
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(details.fieldErrors ?? {})) {
    const first = messages?.[0];
    if (first) result[field] = first;
  }
  return result;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
