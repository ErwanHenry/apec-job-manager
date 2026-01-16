import { useEffect, useState, useCallback } from 'react';
import { Transaction, TransactionListResponse, TransactionFilters } from '../api/types';
import { transactionsApi } from '../api/transactions';

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    size: number;
    total: number;
    pages: number;
  };
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: TransactionFilters) => void;
  refetch: () => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilterState] = useState<TransactionFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    size: 50,
    total: 0,
    pages: 0,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transactionsApi.list({
        ...filters,
        page,
        size: pageSize,
      });
      setTransactions(data.items);
      setPagination({
        page: data.page,
        size: data.size,
        total: data.total,
        pages: data.pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setFilters = useCallback((newFilters: TransactionFilters) => {
    setFilterState(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  return {
    transactions,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setFilters,
    refetch: fetchTransactions,
  };
}
