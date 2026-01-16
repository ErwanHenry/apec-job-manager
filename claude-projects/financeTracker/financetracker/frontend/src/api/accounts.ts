import { apiClient } from './client';
import { Account, CreateAccountRequest } from './types';

export const accountsApi = {
  /**
   * Get all accounts
   */
  list: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  },

  /**
   * Create a new account
   */
  create: async (data: CreateAccountRequest): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts', data);
    return response.data;
  },

  /**
   * Get account by ID
   */
  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  /**
   * Update account
   */
  update: async (id: string, data: Partial<CreateAccountRequest>): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  /**
   * Deactivate account
   */
  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },
};
