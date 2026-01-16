import { useEffect, useState, useCallback } from 'react';
import { Account, CreateAccountRequest } from '../api/types';
import { accountsApi } from '../api/accounts';

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: Error | null;
  createAccount: (data: CreateAccountRequest) => Promise<Account>;
  refetch: () => Promise<void>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountsApi.list();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch accounts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = useCallback(async (data: CreateAccountRequest): Promise<Account> => {
    try {
      const newAccount = await accountsApi.create(data);
      setAccounts((prev) => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create account'));
      throw err;
    }
  }, []);

  return {
    accounts,
    loading,
    error,
    createAccount,
    refetch: fetchAccounts,
  };
}
