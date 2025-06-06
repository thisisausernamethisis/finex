# Patch 4: Core Data Hooks

## Overview
Creates a comprehensive set of React Query hooks to replace all manual fetch calls throughout the application. This establishes the modern data management foundation that eliminates the 614-line assets page problem.

## Dependencies
- Patches 1-3 (React Query Setup, Route Protection, Enhanced UI Components)

## Estimated Effort
4-5 hours

## Risk Level
Medium (core infrastructure change)

---

## Changes Required

### 1. Query Key Factory

**File**: `lib/queryKeys.ts` (new file)
```ts
export const queryKeys = {
  assets: ['assets'] as const,
  asset: (id: string) => ['assets', id] as const,
  themes: (assetId: string) => ['themes', assetId] as const,
  cards: (themeId: string) => ['cards', themeId] as const,
  scenarios: ['scenarios'] as const,
  scenario: (id: string) => ['scenarios', id] as const,
  matrix: ['matrix'] as const,
  matrixData: (params?: Record<string, unknown>) => ['matrix', 'data', params] as const,
};
```

### 2. Asset Query Hooks

**File**: `hooks/useAssets.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface Asset {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetsResponse {
  items: Asset[];
  total: number;
}

export function useAssets(searchTerm?: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.assets, { search: searchTerm }],
    queryFn: async (): Promise<AssetsResponse> => {
      const token = await getToken();
      const url = new URL('/api/assets', window.location.origin);
      
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**File**: `hooks/useAsset.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface Asset {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function useAsset(assetId: string | undefined) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.asset(assetId!),
    queryFn: async (): Promise<Asset> => {
      const token = await getToken();
      const response = await fetch(`/api/assets/${assetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 3. Theme and Card Hooks

**File**: `hooks/useThemes.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface Theme {
  id: string;
  name: string;
  description?: string;
  assetId: string;
  createdAt: string;
  updatedAt: string;
}

interface ThemesResponse {
  items: Theme[];
  total: number;
}

export function useThemes(assetId: string | undefined) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.themes(assetId!),
    queryFn: async (): Promise<ThemesResponse> => {
      const token = await getToken();
      const response = await fetch(`/api/themes?assetId=${assetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
  });
}
```

**File**: `hooks/useCards.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface Card {
  id: string;
  title: string;
  content: string;
  source?: string;
  importance?: number;
  themeId: string;
  createdAt: string;
  updatedAt: string;
}

interface CardsResponse {
  items: Card[];
  total: number;
}

export function useCards(themeId: string | undefined) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.cards(themeId!),
    queryFn: async (): Promise<CardsResponse> => {
      const token = await getToken();
      const response = await fetch(`/api/cards?themeId=${themeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!themeId,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 4. Scenario and Matrix Hooks

**File**: `hooks/useScenarios.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface Scenario {
  id: string;
  name: string;
  description?: string;
  probability?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ScenariosResponse {
  items: Scenario[];
  total: number;
}

export function useScenarios() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.scenarios,
    queryFn: async (): Promise<ScenariosResponse> => {
      const token = await getToken();
      const response = await fetch('/api/scenarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch scenarios: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

**File**: `hooks/useMatrixData.ts` (new file)
```ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface MatrixCell {
  assetId: string;
  scenarioId: string;
  impactScore: number;
  growthPercentage?: number;
  riskPercentage?: number;
}

interface MatrixData {
  cells: MatrixCell[];
  assets: Array<{ id: string; name: string }>;
  scenarios: Array<{ id: string; name: string }>;
  lastUpdated: string;
}

export function useMatrixData(options?: { forceRefresh?: boolean; detailed?: boolean }) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: queryKeys.matrixData(options),
    queryFn: async (): Promise<MatrixData> => {
      const token = await getToken();
      const url = new URL('/api/matrix/calculate', window.location.origin);
      
      if (options?.forceRefresh) {
        url.searchParams.set('forceRefresh', 'true');
      }
      if (options?.detailed !== undefined) {
        url.searchParams.set('detailed', options.detailed.toString());
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch matrix data: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (matrix calculations are expensive)
  });
}
```

### 5. Asset Mutation Hooks

**File**: `hooks/mutations/useCreateAsset.ts` (new file)
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface CreateAssetData {
  name: string;
  description?: string;
}

export function useCreateAsset() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetData) => {
      const token = await getToken();
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create asset: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrix });
    },
  });
}
```

**File**: `hooks/mutations/useUpdateAsset.ts` (new file)
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

interface UpdateAssetData {
  id: string;
  name?: string;
  description?: string;
}

export function useUpdateAsset() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAssetData) => {
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
        throw new Error(`Failed to update asset: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.asset(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrix });
    },
  });
}
```

**File**: `hooks/mutations/useDeleteAsset.ts` (new file)
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { queryKeys } from '@/lib/queryKeys';

export function useDeleteAsset() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetId: string) => {
      const token = await getToken();
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete asset: ${response.statusText}`);
      }

      return { id: assetId };
    },
    onSuccess: (_, assetId) => {
      queryClient.removeQueries({ queryKey: queryKeys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets });
      queryClient.invalidateQueries({ queryKey: queryKeys.themes(assetId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrix });
    },
  });
}
```

---

## Testing

### Verification Checklist
- [ ] All query hooks return proper loading states
- [ ] All mutation hooks invalidate correct query keys  
- [ ] Error handling works for network failures
- [ ] TypeScript types compile without errors
- [ ] Authentication headers included in all requests
- [ ] Query keys follow consistent factory pattern

### Manual Testing
1. Import each hook without errors
2. Verify data fetching returns expected structure
3. Test mutations trigger proper cache invalidation
4. Confirm error states handled gracefully

---

## Success Criteria

**Before**: Manual fetch calls scattered throughout components
```tsx
// Current problematic pattern in assets page (614 lines)
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**After**: Clean hook usage
```tsx
// New pattern - declarative and cached
const { data: assets, isLoading, error } = useAssets(searchTerm);
const createAsset = useCreateAsset();
```

### Impact
- **Eliminates 614-line assets page problem**
- **Provides foundation for all subsequent patches**
- **Enables caching, optimistic updates, and better UX**
- **Centralizes auth header management**
- **Standardizes error handling**

---

## Rollback Plan
If issues arise:
1. Remove all `hooks/` directory files
2. Remove `lib/queryKeys.ts`
3. Components continue using existing fetch patterns
4. No data loss - only affects data fetching layer

---

## Notes
- All hooks follow React Query best practices
- Query keys support granular cache management
- Mutation hooks automatically invalidate related data
- TypeScript interfaces match existing API contracts
- Designed as drop-in replacements for current fetch logic
- Foundation for optimistic updates in later patches 