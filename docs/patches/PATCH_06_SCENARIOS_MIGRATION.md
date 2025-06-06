# Patch 6: Scenarios & Other Pages Migration

## Overview

**Goal**: Apply React Query patterns to scenarios page and all remaining pages, completing the data layer modernization across the entire application.

**Impact**: Standardizes data management patterns and completes the transformation from manual fetch calls to React Query hooks.

**Risk Level**: 🟡 **Medium** - Building on proven patterns from Patch 5

---

## Target Pages & Components

### **Primary Targets**

#### **1. Scenarios Page (`app/scenarios/page.tsx`)**
- **Current**: Similar manual fetch patterns as assets page
- **Target**: Mirror the assets page architecture with scenario-specific components
- **Complexity**: Medium (fewer features than assets but similar patterns)

#### **2. Matrix Page (`app/matrix/page.tsx`)**
- **Current**: Placeholder implementation
- **Target**: Basic matrix display using React Query hooks
- **Complexity**: Low (foundation for Patch 8)

#### **3. Dashboard Page (`app/dashboard/page.tsx`)**
- **Current**: Basic dashboard with manual data fetching
- **Target**: React Query hooks for summary data
- **Complexity**: Medium (multiple data sources)

### **Secondary Targets**

#### **4. Themes Pages (`app/themes/`)**
- **Current**: Basic CRUD with manual fetch
- **Target**: React Query hooks integration
- **Complexity**: Low (simple patterns)

#### **5. Profile/Settings Pages**
- **Current**: User data manual fetching
- **Target**: React Query hooks for user operations
- **Complexity**: Low (user-focused operations)

---

## Implementation Strategy

### **Phase 6A: Scenarios Page Migration (2 hours)**

#### **Component Architecture**
```
app/scenarios/page.tsx (75 lines)
├── components/scenarios/
│   ├── ScenariosHeader.tsx        # Search, filters, create
│   ├── ScenariosGrid.tsx          # Scenario cards layout  
│   ├── ScenarioCard.tsx           # Individual scenario display
│   ├── ScenariosSkeleton.tsx      # Loading states
│   ├── ScenariosErrorBoundary.tsx # Error handling
│   └── ScenariosPagination.tsx    # Page navigation
└── hooks/scenarios/ (from Patch 4)
    ├── useScenarios.ts            # Data fetching
    ├── useCreateScenario.ts       # Create mutation
    ├── useUpdateScenario.ts       # Update mutation
    └── useDeleteScenario.ts       # Delete mutation
```

#### **Scenarios Page Implementation**
```tsx
// app/scenarios/page.tsx
'use client';

import { useState } from 'react';
import { 
  useScenarios, 
  useCreateScenario, 
  useUpdateScenario, 
  useDeleteScenario 
} from '@/lib/hooks/scenarios';
import { ScenariosHeader } from '@/components/scenarios/ScenariosHeader';
import { ScenariosGrid } from '@/components/scenarios/ScenariosGrid';
import { ScenariosSkeleton } from '@/components/scenarios/ScenariosSkeleton';
import { ScenariosErrorBoundary } from '@/components/scenarios/ScenariosErrorBoundary';

export default function ScenariosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ScenarioType>();
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    data: scenariosResponse,
    isLoading,
    error,
    refetch
  } = useScenarios({
    search: searchTerm,
    type: selectedType,
    page: currentPage,
    limit: 12
  });
  
  const createScenario = useCreateScenario({
    onSuccess: () => toast.success('Scenario created successfully')
  });
  
  const updateScenario = useUpdateScenario({
    onSuccess: () => toast.success('Scenario updated successfully')
  });
  
  const deleteScenario = useDeleteScenario({
    onSuccess: () => toast.success('Scenario deleted successfully')
  });
  
  if (isLoading) return <ScenariosSkeleton />;
  if (error) return <ScenariosErrorBoundary error={error} retry={refetch} />;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Scenarios</h1>
      </div>
      
      <ScenariosHeader
        onSearch={setSearchTerm}
        onTypeFilter={setSelectedType}
        onCreateNew={() => createScenario.mutate({
          name: 'New Scenario',
          type: 'TECHNOLOGY',
          probability: 0.5
        })}
        isCreating={createScenario.isPending}
      />
      
      <ScenariosGrid
        scenarios={scenariosResponse?.data || []}
        onEdit={(id, data) => updateScenario.mutate({ id, data })}
        onDelete={(id) => deleteScenario.mutate({ id })}
        isUpdating={updateScenario.isPending ? updateScenario.variables?.id : undefined}
        isDeleting={deleteScenario.isPending ? deleteScenario.variables?.id : undefined}
      />
    </div>
  );
}
```

#### **ScenarioCard Component**
```tsx
// components/scenarios/ScenarioCard.tsx
interface ScenarioCardProps {
  scenario: Scenario;
  onEdit: (data: Partial<Scenario>) => void;
  onDelete: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ScenarioCard({ 
  scenario, 
  onEdit, 
  onDelete,
  isUpdating,
  isDeleting 
}: ScenarioCardProps) {
  return (
    <Card className="relative">
      {(isUpdating || isDeleting) && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{scenario.name}</CardTitle>
            <div className="flex space-x-2 mt-2">
              {scenario.type && (
                <Badge variant="outline">
                  {scenario.type}
                </Badge>
              )}
              {scenario.timeline && (
                <Badge variant="secondary">
                  {scenario.timeline}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit({})}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {scenario.description}
        </p>
        
        {scenario.probability && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <BarChart className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {Math.round(scenario.probability * 100)}% probability
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### **Phase 6B: Matrix Page Foundation (1 hour)**

#### **Matrix Page Implementation**
```tsx
// app/matrix/page.tsx
'use client';

import { useState } from 'react';
import { useAssets } from '@/lib/hooks/assets';
import { useScenarios } from '@/lib/hooks/scenarios';
import { useMatrixAnalysis } from '@/lib/hooks/matrix';
import { MatrixGrid } from '@/components/matrix/MatrixGrid';
import { MatrixSkeleton } from '@/components/matrix/MatrixSkeleton';

export default function MatrixPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>();
  
  // Load assets and scenarios for selection
  const { data: assets, isLoading: assetsLoading } = useAssets({ limit: 100 });
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios({ limit: 100 });
  
  // Load matrix analysis results
  const { 
    data: matrixResults, 
    isLoading: matrixLoading,
    refetch: refetchMatrix
  } = useMatrixAnalysis({
    assetId: selectedAssetId,
    scenarioId: selectedScenarioId
  });
  
  const isLoading = assetsLoading || scenariosLoading || matrixLoading;
  
  if (isLoading) return <MatrixSkeleton />;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Matrix Analysis</h1>
        <Button onClick={() => refetchMatrix()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetSelector
          assets={assets?.data || []}
          selectedId={selectedAssetId}
          onSelect={setSelectedAssetId}
        />
        
        <ScenarioSelector
          scenarios={scenarios?.data || []}
          selectedId={selectedScenarioId}
          onSelect={setSelectedScenarioId}
        />
      </div>
      
      <MatrixGrid
        results={matrixResults}
        assets={assets?.data || []}
        scenarios={scenarios?.data || []}
      />
    </div>
  );
}
```

### **Phase 6C: Dashboard Migration (1 hour)**

#### **Dashboard with React Query**
```tsx
// app/dashboard/page.tsx
'use client';

import { 
  useAssets, 
  useScenarios, 
  useMatrixSummary,
  useUserStats 
} from '@/lib/hooks';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  // Multiple React Query hooks for dashboard data
  const { data: assets, isLoading: assetsLoading } = useAssets({ limit: 5 });
  const { data: scenarios, isLoading: scenariosLoading } = useScenarios({ limit: 5 });
  const { data: matrixSummary, isLoading: matrixLoading } = useMatrixSummary();
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  
  const isLoading = assetsLoading || scenariosLoading || matrixLoading || statsLoading;
  
  if (isLoading) return <DashboardSkeleton />;
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <DashboardCards
        assetCount={assets?.total || 0}
        scenarioCount={scenarios?.total || 0}
        matrixCount={matrixSummary?.totalAnalyses || 0}
        recentActivity={userStats?.recentActivity || 0}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCharts data={matrixSummary} />
        <RecentActivity 
          assets={assets?.data || []}
          scenarios={scenarios?.data || []}
        />
      </div>
    </div>
  );
}
```

---

## React Query Hook Extensions

### **Additional Hooks Needed**

#### **Matrix Hooks**
```tsx
// lib/hooks/matrix.ts
export function useMatrixAnalysis(params: {
  assetId?: string;
  scenarioId?: string;
}) {
  return useQuery({
    queryKey: ['matrix-analysis', params],
    queryFn: () => matrixApi.getAnalysis(params),
    enabled: !!(params.assetId && params.scenarioId)
  });
}

export function useMatrixSummary() {
  return useQuery({
    queryKey: ['matrix-summary'],
    queryFn: () => matrixApi.getSummary()
  });
}
```

#### **User Stats Hooks**
```tsx
// lib/hooks/user.ts
export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: () => userApi.getStats(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}
```

#### **Dashboard-Specific Hooks**
```tsx
// lib/hooks/dashboard.ts
export function useDashboardData() {
  // Combine multiple queries for dashboard
  const assets = useAssets({ limit: 5 });
  const scenarios = useScenarios({ limit: 5 });
  const matrix = useMatrixSummary();
  const stats = useUserStats();
  
  return {
    data: {
      assets: assets.data,
      scenarios: scenarios.data,
      matrix: matrix.data,
      stats: stats.data
    },
    isLoading: assets.isLoading || scenarios.isLoading || matrix.isLoading || stats.isLoading,
    error: assets.error || scenarios.error || matrix.error || stats.error
  };
}
```

---

## Component Reusability Patterns

### **Shared Component Library**

#### **Generic Grid Components**
```tsx
// components/common/DataGrid.tsx
interface DataGridProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  isLoading?: boolean;
  error?: Error;
  emptyMessage?: string;
  columns?: number;
}

export function DataGrid<T>({ 
  data, 
  renderItem, 
  isLoading, 
  error, 
  emptyMessage = "No items found",
  columns = 3 
}: DataGridProps<T>) {
  if (isLoading) return <GridSkeleton columns={columns} />;
  if (error) return <GridErrorBoundary error={error} />;
  if (data.length === 0) return <EmptyState message={emptyMessage} />;
  
  return (
    <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
      {data.map((item, index) => (
        <div key={index}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
```

#### **Shared Header Pattern**
```tsx
// components/common/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  onSearch?: (term: string) => void;
  onFilter?: (filter: any) => void;
  onCreateNew?: () => void;
  createLabel?: string;
  isCreating?: boolean;
  filters?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  onSearch, 
  onCreateNew, 
  createLabel = "Create New",
  isCreating,
  filters 
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        {onCreateNew && (
          <Button onClick={onCreateNew} disabled={isCreating}>
            {isCreating ? <Spinner className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {createLabel}
          </Button>
        )}
      </div>
      
      <div className="flex space-x-4">
        {onSearch && (
          <SearchInput onSearch={onSearch} placeholder={`Search ${title.toLowerCase()}...`} />
        )}
        {filters}
      </div>
    </div>
  );
}
```

---

## Implementation Timeline

### **Total Effort**: 2-3 hours
### **Risk Level**: Medium
### **Dependencies**: Patches 1-5 complete

### **Breakdown**:
- **Phase 6A (Scenarios)**: 2 hours
  - Component extraction: 1 hour
  - Page migration: 30 minutes
  - Testing: 30 minutes

- **Phase 6B (Matrix Foundation)**: 1 hour
  - Basic component: 30 minutes
  - Hook integration: 20 minutes  
  - Testing: 10 minutes

- **Phase 6C (Dashboard)**: 30 minutes
  - Hook integration: 20 minutes
  - Component updates: 10 minutes

---

## Success Metrics

### **Code Quality**
- [ ] All pages use React Query hooks consistently
- [ ] No manual fetch calls remain in page components
- [ ] Component reusability >70% across pages
- [ ] Loading states standardized across all pages

### **Performance**
- [ ] Page load times <2s for all pages
- [ ] Search responsiveness <500ms across all pages  
- [ ] Cache hit rate >80% for repeated navigation
- [ ] No loading flicker on page transitions

### **User Experience**
- [ ] Consistent interaction patterns across all pages
- [ ] Optimistic updates for all CRUD operations
- [ ] Error handling standardized with retry options
- [ ] Toast notifications for all user actions

---

## Validation Checklist

### **Functional Testing**
- [ ] Scenarios page: CRUD operations work with optimistic updates
- [ ] Matrix page: Data loads correctly with asset/scenario selection
- [ ] Dashboard: All summary data displays accurately
- [ ] Navigation: Page transitions preserve state
- [ ] Search: Works consistently across all pages
- [ ] Filters: Apply correctly and update URLs

### **React Query Integration**
- [ ] DevTools show queries for all pages
- [ ] Cache invalidation works for related data
- [ ] Background refetching occurs appropriately
- [ ] Error boundaries catch and display errors properly
- [ ] Loading states appear during data fetching

---

## Risk Mitigation

### **Medium-Risk Elements**
1. **Data dependencies** between pages
2. **Shared component compatibility** 
3. **Cache synchronization** across different entities

### **Mitigation Strategies**

#### **1. Incremental Page Migration**
```tsx
// Migrate one page at a time with fallbacks
const MIGRATED_PAGES = ['assets']; // Add pages as completed

function useMigratedPage(pageName: string) {
  return MIGRATED_PAGES.includes(pageName);
}
```

#### **2. Shared Component Testing**
- Test shared components in isolation
- Verify compatibility across different page contexts
- Use Storybook for component validation

#### **3. Cache Strategy Validation**
```tsx
// Ensure proper cache invalidation
const queryClient = useQueryClient();

const invalidateRelatedData = (entityType: string, entityId: string) => {
  queryClient.invalidateQueries({ queryKey: [entityType] });
  queryClient.invalidateQueries({ queryKey: ['matrix-analysis'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};
```

---

This patch completes the data layer modernization by applying React Query patterns consistently across all remaining pages, establishing a solid foundation for the advanced features in Phase 3. 