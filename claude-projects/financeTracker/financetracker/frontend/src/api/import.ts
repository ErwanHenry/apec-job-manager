import { apiClient } from './client';
import { ImportResult } from './types';

export const importApi = {
  /**
   * Upload and import CSV file
   */
  uploadCSV: async (
    file: File,
    accountId: string,
    autoCategorize: boolean = true
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('account_id', accountId);
    formData.append('auto_categorize', autoCategorize.toString());

    const response = await apiClient.post<ImportResult>('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get import history
   */
  getHistory: async (): Promise<ImportResult[]> => {
    const response = await apiClient.get<ImportResult[]>('/import/history');
    return response.data;
  },
};
