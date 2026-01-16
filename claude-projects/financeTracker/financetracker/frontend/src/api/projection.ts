import { apiClient } from './client';
import { ProjectionResponse } from './types';

export const projectionApi = {
  /**
   * Get balance projection for all scenarios
   */
  get: async (months: number = 6, scenario?: 'pessimistic' | 'realistic' | 'optimistic'): Promise<ProjectionResponse> => {
    const params: Record<string, unknown> = {
      months,
    };
    if (scenario) {
      params.scenario = scenario;
    }

    const response = await apiClient.get<ProjectionResponse>('/projection', {
      params,
    });
    return response.data;
  },

  /**
   * Get projection for a specific scenario
   */
  getScenario: async (
    scenario: 'pessimistic' | 'realistic' | 'optimistic',
    months: number = 6
  ): Promise<ProjectionResponse> => {
    return projectionApi.get(months, scenario);
  },
};
