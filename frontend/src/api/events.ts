import { api } from './client';
import type { CurrentEventResponse } from './types';

export const eventsApi = {
  current: (signal?: AbortSignal) =>
    api.get<CurrentEventResponse>('/events/current', undefined, signal),
};
