import { api } from './client';
import type { SubmissionRecord, SubmitResult } from './types';

export const submissionsApi = {
  submit: (challengeId: string, flag: string) =>
    api.post<SubmitResult>('/submissions', { challengeId, flag }),
  mine: () => api.get<{ submissions: SubmissionRecord[] }>('/submissions/me'),
};
