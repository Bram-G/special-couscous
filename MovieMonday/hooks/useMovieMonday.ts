// hooks/useMovieMonday.ts
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  }).then((res) => res.json());

export function useMovieMonday(dateStr: string) {
  const { data, error, isLoading } = useSWR(
    dateStr ? `/api/movie-monday/${dateStr}` : null,
    fetcher,
    {
      revalidateOnFocus: false,      // don't refetch just from tab-switching
      revalidateIfStale: false,      // trust cached data within the session
      dedupingInterval: 60000,       // collapse duplicate calls within 60s
    }
  );

  return { movieMonday: data, isLoading, error };
}