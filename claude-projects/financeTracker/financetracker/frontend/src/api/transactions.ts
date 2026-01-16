import { apiClient } from './client';
import { Transaction, TransactionListResponse, TransactionFilters } from './types';

export const transactionsApi = {
  /**
   * Get paginated list of transactions with optional filters
   */
  list: async (filters?: TransactionFilters): Promise<TransactionListResponse> => {
    const params = {
      ...filters,
    };
    const response = await apiClient.get<TransactionListResponse>('/transactions', {
      params,
    });
    return response.data;
  },

  /**
   * Get transaction by ID
   */
  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Assign category to transaction
   */
  assignCategory: async (id: string, categoryId: string, confidence: number = 1.0): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(
      `/transactions/${id}/category`,
      {
        category_id: categoryId,
        confidence,
      }
    );
    return response.data;
  },

  /**
   * Update transaction notes
   */
  updateNotes: async (id: string, notes: string): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(
      `/transactions/${id}`,
      { notes }
    );
    return response.data;
  },

  /**
   * Delete transaction
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },
};
