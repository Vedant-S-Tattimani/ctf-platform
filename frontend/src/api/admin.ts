import { ApiError, api } from './client';
import type {
  AdminCategory,
  AdminChallenge,
  AdminChallengeDetail,
  AdminEvent,
  AdminSubmissionRow,
  AdminTeamRow,
  AdminUserRow,
  ChallengeFile,
  Hint,
  UploadedAsset,
} from './types';

export interface ListParams {
  limit?: number;
  offset?: number;
}

export interface CreateChallengeInput {
  title: string;
  description: string;
  categoryId: string;
  eventId?: string | null;
  difficulty: string;
  points: number;
  published: boolean;
  order?: number;
  flags: { label?: string; value: string; points: number; algo?: 'sha256' | 'sha512' }[];
  hints: { content: string; cost: number }[];
  files: { name: string; path: string; sizeBytes?: number | null }[];
}

export type UpdateChallengeInput = Partial<Omit<CreateChallengeInput, 'flags' | 'hints' | 'files'>>;

/** Attach either a stored upload or an external reference to a challenge. */
export type FileAttachInput =
  | { assetId: string }
  | { name: string; path: string; sizeBytes?: number | null };

async function uploadHandout(file: File): Promise<{ asset: UploadedAsset }> {
  const response = await fetch('/api/v1/admin/files', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as { error?: string; details?: unknown };
    throw new ApiError(
      response.status,
      record.error ?? `Upload failed (${response.status})`,
      record.details,
    );
  }
  return payload as { asset: UploadedAsset };
}

export interface CategoryInput {
  name: string;
  slug?: string;
  color?: string | null;
  icon?: string | null;
}

export interface EventInput {
  name: string;
  slug?: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  teamMaxSize?: number;
  published?: boolean;
  scoringMode?: 'STATIC' | 'DYNAMIC';
  scoringMinimumPoints?: number;
  scoringDecayThreshold?: number;
}

export const adminApi = {
  challenges: {
    list: () => api.get<{ challenges: AdminChallenge[] }>('/admin/challenges'),
    byId: (id: string) =>
      api.get<{ challenge: AdminChallengeDetail }>(`/admin/challenges/${id}`),
    create: (input: CreateChallengeInput) =>
      api.post<{ challenge: AdminChallengeDetail }>('/admin/challenges', input),
    update: (id: string, input: UpdateChallengeInput) =>
      api.patch<{ challenge: AdminChallenge }>(`/admin/challenges/${id}`, input),
    remove: (id: string) => api.delete<{ ok: boolean }>(`/admin/challenges/${id}`),
    addFlag: (id: string, input: { label?: string; value: string; points: number }) =>
      api.post<{ flag: AdminChallengeDetail['flags'][number] }>(
        `/admin/challenges/${id}/flags`,
        input,
      ),
    removeFlag: (flagId: string) => api.delete<{ ok: boolean }>(`/admin/flags/${flagId}`),
    addHint: (id: string, input: { content: string; cost: number }) =>
      api.post<{ hint: Hint }>(`/admin/challenges/${id}/hints`, input),
    removeHint: (hintId: string) => api.delete<{ ok: boolean }>(`/admin/hints/${hintId}`),
    addFile: (id: string, input: FileAttachInput) =>
      api.post<{ file: ChallengeFile }>(`/admin/challenges/${id}/files`, input),
    removeFile: (fileId: string) => api.delete<{ ok: boolean }>(`/admin/files/${fileId}`),
    upload: (file: File) => uploadHandout(file),
  },
  categories: {
    list: () => api.get<{ categories: AdminCategory[] }>('/admin/categories'),
    create: (input: CategoryInput) =>
      api.post<{ category: AdminCategory }>('/admin/categories', input),
    update: (id: string, input: Partial<CategoryInput>) =>
      api.patch<{ category: AdminCategory }>(`/admin/categories/${id}`, input),
    remove: (id: string) => api.delete<{ ok: boolean }>(`/admin/categories/${id}`),
  },
  events: {
    list: () => api.get<{ events: AdminEvent[] }>('/admin/events'),
    create: (input: EventInput) => api.post<{ event: AdminEvent }>('/admin/events', input),
    update: (id: string, input: Partial<EventInput>) =>
      api.patch<{ event: AdminEvent }>(`/admin/events/${id}`, input),
  },
  users: (params: ListParams) =>
    api.get<{ users: AdminUserRow[]; total: number }>('/admin/users', params),
  teams: (params: ListParams) =>
    api.get<{ teams: AdminTeamRow[]; total: number }>('/admin/teams', params),
  submissions: (params: ListParams) =>
    api.get<{ submissions: AdminSubmissionRow[]; total: number }>(
      '/admin/submissions',
      params,
    ),
};
