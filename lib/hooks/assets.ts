import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  userId: string;
  growthValue?: number;
  kind?: string;
  sourceTemplateId?: string;
  isPublic: boolean;
  themes?: any[];
  createdAt: string;
  updatedAt: string;
}

interface AssetsResponse {
  data: Asset[];
  total: number;
  totalPages: number;
  currentPage: number;
}

interface UseAssetsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export function useAssets(params: UseAssetsParams = {}) {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async (): Promise<AssetsResponse> => {
      const token = await getToken();
      const url = new URL('/api/assets', window.location.origin);
      
      if (params.search) url.searchParams.set('search', params.search);
      if (params.page) url.searchParams.set('page', params.page.toString());
      if (params.limit) url.searchParams.set('limit', params.limit.toString());
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
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

export function useCreateAsset(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newAsset: Partial<Asset>) => {
      const token = await getToken();
      
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newAsset),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create asset');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      options?.onSuccess?.();
    },
  });
}

export function useUpdateAsset(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Asset> }) => {
      const token = await getToken();
      
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update asset');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteAsset(options?: { onSuccess?: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken();
      
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      options?.onSuccess?.();
    },
  });
} 