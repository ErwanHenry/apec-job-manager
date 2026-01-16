import { useEffect, useState, useCallback } from 'react';
import { ProjectionResponse } from '../api/types';
import { projectionApi } from '../api/projection';

interface UseProjectionReturn {
  projection: ProjectionResponse | null;
  loading: boolean;
  error: Error | null;
  months: number;
  setMonths: (months: number) => void;
  refetch: () => Promise<void>;
}

export function useProjection(initialMonths: number = 6): UseProjectionReturn {
  const [projection, setProjection] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [months, setMonthsState] = useState(initialMonths);

  const fetchProjection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectionApi.get(months);
      setProjection(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projection'));
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchProjection();
  }, [fetchProjection]);

  const setMonths = useCallback((newMonths: number) => {
    setMonthsState(newMonths);
  }, []);

  return {
    projection,
    loading,
    error,
    months,
    setMonths,
    refetch: fetchProjection,
  };
}
