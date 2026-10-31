import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';

export function useCurrentEvent() {
  return useQuery({
    queryKey: ['events', 'current'],
    queryFn: ({ signal }) => eventsApi.current(signal),
    staleTime: 60_000,
    retry: false,
  });
}
