import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  userId: string;
  type?: ScenarioType;
  timeline?: string;
  probability?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ScenarioType = 'TECHNOLOGY' | 'ECONOMIC' | 'GEOPOLITICAL' | 'REGULATORY' | 'MARKET';

interface ScenariosResponse {
  data: Scenario[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface UseScenariosParams {
  search?: string;
  type?: ScenarioType;
  page?: number;
  limit?: number;
}

export function useScenarios(params: UseScenariosParams = {}) {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['scenarios', params],
    queryFn: async (): Promise<ScenariosResponse> => {
      const token = await getToken();
      const url = new URL('/api/scenarios', window.location.origin);
      
      if (params.search) url.searchParams.set('search', params.search);
      if (params.type) url.searchParams.set('type', params.type);
      if (params.page) url.searchParams.set('page', params.page.toString());
      if (params.limit) url.searchParams.set('limit', params.limit.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch scenarios');
      }
      
      const data = await response.json();
      
      return {
        data: data.items || [],
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      };
    },
    enabled: !!getToken,
  });
}

export function useCreateScenario(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newScenario: Partial<Scenario>) => {
      const token = await getToken();
      
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newScenario),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create scenario');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      // Invalidate matrix calculations when scenarios change
      queryClient.invalidateQueries({ queryKey: ['matrix'] });
      options?.onSuccess?.();
    },
  });
}

export function useUpdateScenario(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Scenario> }) => {
      const token = await getToken();
      
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update scenario');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      // Invalidate matrix calculations when scenarios change
      queryClient.invalidateQueries({ queryKey: ['matrix'] });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteScenario(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken();
      
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete scenario');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      // Invalidate matrix calculations when scenarios change
      queryClient.invalidateQueries({ queryKey: ['matrix'] });
      options?.onSuccess?.();
    },
  });
} 