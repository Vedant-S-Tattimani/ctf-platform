import { api } from './client';
import type { ScoreboardEntry, ScoreboardSeries } from './types';

export interface ScoreboardParams {
  scope?: 'teams' | 'users';
  eventId?: string;
  limit?: number;
  offset?: number;
}

export const scoreboardApi = {
  list: (params: ScoreboardParams = {}, signal?: AbortSignal) =>
    api.get<{ entries: ScoreboardEntry[] }>('/scoreboard', params, signal),
  history: (params: ScoreboardParams = {}, signal?: AbortSignal) =>
    api.get<{ series: ScoreboardSeries[] }>('/scoreboard/history', params, signal),
};
