# Patch 8: Matrix Implementation

## 🎯 **Mission: Transform Matrix Placeholder into Rich Interactive Grid**

Replace the current placeholder matrix page with a comprehensive **Asset × Scenario Interactive Grid** that provides visual impact analysis, drill-down capabilities, and real-time insights.

**Duration**: 4-5 hours  
**Risk Level**: Medium  
**Priority**: High (Core Phase 3 deliverable)  

---

## 📋 **Current State Analysis**

### **✅ Existing Foundation**
- Basic matrix page at `app/matrix/page.tsx` (124 lines)
- Matrix data hook `lib/hooks/matrix.ts` with data fetching
- Comprehensive API endpoints:
  - `/api/matrix` - Matrix data aggregation
  - `/api/matrix/calculate` - Real-time impact calculations  
  - `/api/matrix/analyze` - AI-powered analysis
  - `/api/matrix/[assetId]/[scenarioId]` - Specific pair analysis
  - `/api/matrix/insights` - Portfolio insights

### **❌ Critical Missing Components**
- **No visual matrix grid** - currently just metrics cards
- **No interactive cells** - no drill-down or selection
- **No impact visualization** - no color coding or scoring display
- **No cell hover states** - no detailed impact previews
- **No matrix navigation** - no asset/scenario filtering

### **🎯 Target Vision**
Transform from basic metrics dashboard into:
- **Interactive Asset × Scenario Grid** with color-coded impact cells
- **Drill-down capabilities** for detailed analysis  
- **Real-time hover insights** with impact explanations
- **Advanced filtering and search** across assets and scenarios
- **Visual impact scoring** with color gradients and icons

---

## 🏗️ **Implementation Architecture**

### **Component Structure**
```
components/matrix/
├── MatrixGrid.tsx              # Main interactive grid container
├── MatrixCell.tsx              # Individual impact cell
├── MatrixHeader.tsx            # Column headers (scenarios)  
├── MatrixRowHeader.tsx         # Row headers (assets)
├── MatrixToolbar.tsx           # Search, filters, view controls
├── MatrixInsights.tsx          # AI insights panel
├── MatrixCellDialog.tsx        # Detailed cell analysis modal
├── MatrixSkeleton.tsx          # Loading states
└── MatrixErrorBoundary.tsx     # Error handling
```

### **Data Flow Architecture**
```
Matrix Page → useMatrixCalculation → API → Matrix Grid → Cells
     ↓              ↓                    ↓         ↓
 Toolbar        Loading              Results    Interactions
```

### **API Integration Points**
- **Primary**: `/api/matrix/calculate` (real-time calculations)
- **Detail**: `/api/matrix/[assetId]/[scenarioId]` (cell drill-down)
- **Analysis**: `/api/matrix/analyze` (AI insights)
- **Insights**: `/api/matrix/insights` (portfolio analysis)

---

## 📐 **Detailed Implementation Spec**

### **Step 1: Enhanced Matrix Data Hook (45 minutes)**

**Create comprehensive matrix data management:**

```typescript
// lib/hooks/matrix.ts (enhancement)
export interface MatrixCalculationData {
  portfolioMetrics: {
    totalAssets: number;
    totalScenarios: number;
    averageImpact: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    opportunityScore: number;
  };
  calculations: MatrixCalculation[];
  lastCalculatedAt: string;
}

export interface MatrixCalculation {
  assetId: string;
  assetName: string;
  assetCategory: string;
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  impact: number;            // -5 to +5 scale
  confidenceScore: number;   // 0 to 1
  explanation: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Enhanced hook for matrix calculations
export function useMatrixCalculation(mode: 'summary' | 'detailed' = 'detailed') {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['matrix', 'calculation', mode],
    queryFn: async (): Promise<MatrixCalculationData> => {
      const token = await getToken();
      const response = await fetch(`/api/matrix/calculate?mode=${mode}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matrix calculations');
      }
      
      const result = await response.json();
      return result.data;
    },
    enabled: !!getToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for individual cell analysis
export function useMatrixCellAnalysis(assetId?: string, scenarioId?: string) {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['matrix', 'cell', assetId, scenarioId],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`/api/matrix/${assetId}/${scenarioId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cell analysis');
      }
      
      return response.json();
    },
    enabled: !!(getToken && assetId && scenarioId),
  });
}

// Hook for AI-powered insights
export function useMatrixInsights() {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['matrix', 'insights'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/matrix/insights', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matrix insights');
      }
      
      return response.json();
    },
    enabled: !!getToken,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
```

### **Step 2: Matrix Grid Container (60 minutes)**

**Create the main interactive grid component:**

```typescript
// components/matrix/MatrixGrid.tsx
import { useState } from 'react';
import { MatrixCalculation } from '@/lib/hooks/matrix';
import { MatrixCell } from './MatrixCell';
import { MatrixRowHeader } from './MatrixRowHeader';
import { MatrixHeader } from './MatrixHeader';

interface MatrixGridProps {
  calculations: MatrixCalculation[];
  onCellClick: (assetId: string, scenarioId: string) => void;
  selectedCell?: { assetId: string; scenarioId: string };
}

export function MatrixGrid({ calculations, onCellClick, selectedCell }: MatrixGridProps) {
  // Organize data into grid structure
  const assets = Array.from(new Set(calculations.map(c => ({
    id: c.assetId,
    name: c.assetName,
    category: c.assetCategory
  }))));
  
  const scenarios = Array.from(new Set(calculations.map(c => ({
    id: c.scenarioId,
    name: c.scenarioName,
    type: c.scenarioType
  }))));
  
  // Create lookup map for quick impact retrieval
  const impactMap = new Map<string, MatrixCalculation>();
  calculations.forEach(calc => {
    impactMap.set(`${calc.assetId}-${calc.scenarioId}`, calc);
  });
  
  const getImpactForCell = (assetId: string, scenarioId: string) => {
    return impactMap.get(`${assetId}-${scenarioId}`);
  };
  
  return (
    <div className="matrix-grid-container overflow-auto border rounded-lg">
      <div className="grid matrix-grid" 
           style={{ 
             gridTemplateColumns: `200px repeat(${scenarios.length}, 120px)`,
             minWidth: `${200 + scenarios.length * 120}px`
           }}>
        
        {/* Top-left corner cell */}
        <div className="matrix-corner-cell bg-muted border-r border-b p-3 font-semibold sticky top-0 left-0 z-20">
          Assets × Scenarios
        </div>
        
        {/* Scenario headers (columns) */}
        {scenarios.map(scenario => (
          <MatrixHeader
            key={scenario.id}
            scenario={scenario}
            className="sticky top-0 z-10"
          />
        ))}
        
        {/* Asset rows */}
        {assets.map(asset => (
          <div key={asset.id} className="contents">
            {/* Asset row header */}
            <MatrixRowHeader
              asset={asset}
              className="sticky left-0 z-10"
            />
            
            {/* Impact cells for this asset */}
            {scenarios.map(scenario => {
              const calculation = getImpactForCell(asset.id, scenario.id);
              const isSelected = selectedCell?.assetId === asset.id && 
                               selectedCell?.scenarioId === scenario.id;
              
              return (
                <MatrixCell
                  key={`${asset.id}-${scenario.id}`}
                  assetId={asset.id}
                  scenarioId={scenario.id}
                  calculation={calculation}
                  isSelected={isSelected}
                  onClick={() => onCellClick(asset.id, scenario.id)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **Step 3: Interactive Matrix Cell (45 minutes)**

**Create rich, interactive impact cells:**

```typescript
// components/matrix/MatrixCell.tsx
import { MatrixCalculation } from '@/lib/hooks/matrix';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface MatrixCellProps {
  assetId: string;
  scenarioId: string;
  calculation?: MatrixCalculation;
  isSelected: boolean;
  onClick: () => void;
}

export function MatrixCell({ 
  assetId, 
  scenarioId, 
  calculation, 
  isSelected, 
  onClick 
}: MatrixCellProps) {
  if (!calculation) {
    return (
      <div className="matrix-cell matrix-cell-empty border border-border bg-muted/20 h-20 flex items-center justify-center cursor-not-allowed">
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }
  
  const { impact, confidenceScore, riskLevel } = calculation;
  
  // Determine cell styling based on impact
  const getCellStyles = () => {
    const baseClasses = "matrix-cell border border-border h-20 p-2 cursor-pointer transition-all duration-200 relative overflow-hidden";
    
    if (impact > 2) {
      return cn(baseClasses, "matrix-cell-positive bg-green-50 hover:bg-green-100 border-green-200");
    } else if (impact < -1) {
      return cn(baseClasses, "matrix-cell-negative bg-red-50 hover:bg-red-100 border-red-200");
    } else {
      return cn(baseClasses, "matrix-cell-neutral bg-gray-50 hover:bg-gray-100 border-gray-200");
    }
  };
  
  const getImpactIcon = () => {
    if (impact > 2) return TrendingUp;
    if (impact < -1) return TrendingDown;
    return Minus;
  };
  
  const ImpactIcon = getImpactIcon();
  
  return (
    <div 
      className={cn(getCellStyles(), isSelected && "ring-2 ring-primary shadow-lg")}
      onClick={onClick}
    >
      {/* Impact Score */}
      <div className="flex items-start justify-between mb-1">
        <span className={cn(
          "text-lg font-bold",
          impact > 2 ? "text-green-700" : 
          impact < -1 ? "text-red-700" : "text-gray-600"
        )}>
          {impact > 0 ? '+' : ''}{impact.toFixed(1)}
        </span>
        
        <ImpactIcon className={cn(
          "w-4 h-4",
          impact > 2 ? "text-green-600" : 
          impact < -1 ? "text-red-600" : "text-gray-500"
        )} />
      </div>
      
      {/* Confidence & Risk Indicators */}
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline" 
          className="text-xs px-1 py-0"
        >
          {Math.round(confidenceScore * 100)}%
        </Badge>
        
        {riskLevel === 'HIGH' && (
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        )}
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
}
```

### **Step 4: Matrix Headers & Navigation (30 minutes)**

**Create row and column headers with categorization:**

```typescript
// components/matrix/MatrixHeader.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MatrixHeaderProps {
  scenario: {
    id: string;
    name: string;
    type: string;
  };
  className?: string;
}

export function MatrixHeader({ scenario, className }: MatrixHeaderProps) {
  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TECHNOLOGY': return 'bg-blue-100 text-blue-700';
      case 'MARKET': return 'bg-green-100 text-green-700';
      case 'REGULATORY': return 'bg-orange-100 text-orange-700';
      case 'ECONOMIC': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className={cn("matrix-header bg-background border-r border-b p-3 text-center", className)}>
      <div className="space-y-2">
        <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={scenario.name}>
          {scenario.name}
        </h4>
        <Badge 
          variant="outline" 
          className={cn("text-xs", getTypeColor(scenario.type))}
        >
          {scenario.type}
        </Badge>
      </div>
    </div>
  );
}

// components/matrix/MatrixRowHeader.tsx
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MatrixRowHeaderProps {
  asset: {
    id: string;
    name: string;
    category: string;
  };
  className?: string;
}

export function MatrixRowHeader({ asset, className }: MatrixRowHeaderProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case 'AI_COMPUTE': return 'bg-blue-100 text-blue-700';
      case 'ROBOTICS_PHYSICAL_AI': return 'bg-green-100 text-green-700';
      case 'QUANTUM_COMPUTING': return 'bg-purple-100 text-purple-700';
      case 'TRADITIONAL_TECH': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };
  
  return (
    <div className={cn("matrix-row-header bg-background border-r border-b p-3", className)}>
      <div className="space-y-2">
        <h4 className="font-semibold text-sm leading-tight" title={asset.name}>
          {asset.name}
        </h4>
        <Badge 
          variant="outline" 
          className={cn("text-xs", getCategoryColor(asset.category))}
        >
          {asset.category.replace(/_/g, ' ')}
        </Badge>
      </div>
    </div>
  );
}
```

### **Step 5: Matrix Toolbar & Controls (30 minutes)**

**Create search, filtering, and view controls:**

```typescript
// components/matrix/MatrixToolbar.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download,
  Grid,
  BarChart3,
  X
} from 'lucide-react';

interface MatrixToolbarProps {
  onSearch: (term: string) => void;
  onCategoryFilter: (category: string) => void;
  onScenarioTypeFilter: (type: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeFilters: {
    search?: string;
    category?: string;
    scenarioType?: string;
  };
  onClearFilters: () => void;
}

export function MatrixToolbar({
  onSearch,
  onCategoryFilter,
  onScenarioTypeFilter,
  onRefresh,
  isRefreshing,
  activeFilters,
  onClearFilters
}: MatrixToolbarProps) {
  const [search, setSearch] = useState(activeFilters.search || '');
  
  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };
  
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  
  return (
    <div className="matrix-toolbar space-y-4">
      {/* Top row - Main controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search assets or scenarios..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <Select onValueChange={onCategoryFilter} value={activeFilters.category || ""}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="AI_COMPUTE">AI/Compute</SelectItem>
              <SelectItem value="ROBOTICS_PHYSICAL_AI">Robotics/Physical AI</SelectItem>
              <SelectItem value="QUANTUM_COMPUTING">Quantum Computing</SelectItem>
              <SelectItem value="TRADITIONAL_TECH">Traditional Tech</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={onScenarioTypeFilter} value={activeFilters.scenarioType || ""}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by scenario type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Scenario Types</SelectItem>
              <SelectItem value="TECHNOLOGY">Technology</SelectItem>
              <SelectItem value="MARKET">Market</SelectItem>
              <SelectItem value="REGULATORY">Regulatory</SelectItem>
              <SelectItem value="ECONOMIC">Economic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{activeFilters.search}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearchChange('')}
                className="h-4 w-4 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {activeFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {activeFilters.category.replace(/_/g, ' ')}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryFilter('')}
                className="h-4 w-4 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {activeFilters.scenarioType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {activeFilters.scenarioType}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onScenarioTypeFilter('')}
                className="h-4 w-4 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
```

### **Step 6: Cell Detail Dialog (30 minutes)**

**Create detailed analysis modal for cell drill-down:**

```typescript
// components/matrix/MatrixCellDialog.tsx
import { useMatrixCellAnalysis } from '@/lib/hooks/matrix';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Clock, AlertTriangle } from 'lucide-react';

interface MatrixCellDialogProps {
  assetId?: string;
  scenarioId?: string;
  assetName?: string;
  scenarioName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MatrixCellDialog({
  assetId,
  scenarioId,
  assetName,
  scenarioName,
  isOpen,
  onClose
}: MatrixCellDialogProps) {
  const { data: analysis, isLoading, error } = useMatrixCellAnalysis(assetId, scenarioId);
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{assetName}</span>
            <span className="text-muted-foreground">×</span>
            <span>{scenarioName}</span>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load detailed analysis</p>
          </div>
        )}
        
        {analysis && (
          <div className="space-y-6">
            {/* Impact Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Impact Score</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      analysis.impact > 2 ? "text-green-600" : 
                      analysis.impact < -1 ? "text-red-600" : "text-gray-600"
                    )}>
                      {analysis.impact > 0 ? '+' : ''}{analysis.impact.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">
                      {Math.round(analysis.confidenceScore * 100)}%
                    </p>
                  </div>
                </div>
                
                {analysis.riskLevel === 'HIGH' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm text-amber-700">High risk scenario - monitor closely</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Detailed Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.explanation}</p>
              </CardContent>
            </Card>
            
            {/* Breakdown */}
            {analysis.breakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Impact Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Base Impact</span>
                      <span className="font-medium">{analysis.breakdown.baseImpact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Technology Multiplier</span>
                      <span className="font-medium">×{analysis.breakdown.technologyMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Timeline Adjustment</span>
                      <span className="font-medium">{analysis.breakdown.timelineAdjustment}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### **Step 7: Main Matrix Page Integration (60 minutes)**

**Transform the matrix page to use all new components:**

```typescript
// app/matrix/page.tsx (complete replacement)
'use client';

import { useState } from 'react';
import { useMatrixCalculation, useMatrixInsights } from '@/lib/hooks/matrix';
import { MatrixGrid } from '@/components/matrix/MatrixGrid';
import { MatrixToolbar } from '@/components/matrix/MatrixToolbar';
import { MatrixCellDialog } from '@/components/matrix/MatrixCellDialog';
import { MatrixInsights } from '@/components/matrix/MatrixInsights';
import { MatrixSkeleton } from '@/components/matrix/MatrixSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Activity, BarChart3 } from 'lucide-react';

export default function MatrixPage() {
  // State management
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    scenarioType: ''
  });
  const [selectedCell, setSelectedCell] = useState<{
    assetId: string;
    scenarioId: string;
    assetName: string;
    scenarioName: string;
  } | null>(null);
  
  // Data fetching
  const {
    data: matrixData,
    isLoading,
    isError,
    error,
    refetch
  } = useMatrixCalculation('detailed');
  
  const {
    data: insights,
    isLoading: insightsLoading
  } = useMatrixInsights();
  
  // Filtering logic
  const filteredCalculations = matrixData?.calculations?.filter(calc => {
    const matchesSearch = !filters.search || 
      calc.assetName.toLowerCase().includes(filters.search.toLowerCase()) ||
      calc.scenarioName.toLowerCase().includes(filters.search.toLowerCase());
      
    const matchesCategory = !filters.category || calc.assetCategory === filters.category;
    const matchesType = !filters.scenarioType || calc.scenarioType === filters.scenarioType;
    
    return matchesSearch && matchesCategory && matchesType;
  }) || [];
  
  // Event handlers
  const handleCellClick = (assetId: string, scenarioId: string) => {
    const calculation = filteredCalculations.find(
      c => c.assetId === assetId && c.scenarioId === scenarioId
    );
    
    if (calculation) {
      setSelectedCell({
        assetId,
        scenarioId,
        assetName: calculation.assetName,
        scenarioName: calculation.scenarioName
      });
    }
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ search: '', category: '', scenarioType: '' });
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <MatrixSkeleton />
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground text-lg mb-4">
                Failed to load matrix data
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const { portfolioMetrics } = matrixData || {};
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Matrix Analysis</h1>
          <p className="text-muted-foreground">
            Interactive analysis of scenario impacts on your asset portfolio
          </p>
        </div>
        
        {/* Metrics Cards */}
        {portfolioMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assets</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioMetrics.totalAssets}</div>
                <p className="text-xs text-muted-foreground">In portfolio</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioMetrics.totalScenarios}</div>
                <p className="text-xs text-muted-foreground">Being tracked</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Impact</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-2xl font-bold",
                  portfolioMetrics.averageImpact > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {portfolioMetrics.averageImpact > 0 ? '+' : ''}
                  {portfolioMetrics.averageImpact.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Portfolio average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={portfolioMetrics.riskLevel === 'HIGH' ? 'destructive' : 
                          portfolioMetrics.riskLevel === 'MEDIUM' ? 'secondary' : 'outline'}
                  className="text-lg font-bold"
                >
                  {portfolioMetrics.riskLevel}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Overall risk</p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main Content */}
        <Tabs defaultValue="matrix" className="space-y-6">
          <TabsList>
            <TabsTrigger value="matrix">Matrix Grid</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matrix" className="space-y-6">
            <MatrixToolbar
              onSearch={(term) => handleFilterChange('search', term)}
              onCategoryFilter={(category) => handleFilterChange('category', category)}
              onScenarioTypeFilter={(type) => handleFilterChange('scenarioType', type)}
              onRefresh={() => refetch()}
              isRefreshing={isLoading}
              activeFilters={filters}
              onClearFilters={clearFilters}
            />
            
            {filteredCalculations.length > 0 ? (
              <MatrixGrid
                calculations={filteredCalculations}
                onCellClick={handleCellClick}
                selectedCell={selectedCell ? {
                  assetId: selectedCell.assetId,
                  scenarioId: selectedCell.scenarioId
                } : undefined}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    {matrixData?.calculations?.length === 0 
                      ? 'Add assets and scenarios to begin matrix analysis'
                      : 'No results match your current filters'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="insights">
            <MatrixInsights 
              insights={insights} 
              isLoading={insightsLoading} 
            />
          </TabsContent>
        </Tabs>
        
        {/* Cell Detail Dialog */}
        <MatrixCellDialog
          assetId={selectedCell?.assetId}
          scenarioId={selectedCell?.scenarioId}
          assetName={selectedCell?.assetName}
          scenarioName={selectedCell?.scenarioName}
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      </div>
    </div>
  );
}
```

---

## 🎯 **Success Criteria & Validation**

### **✅ Functional Requirements**
- [ ] Interactive Asset × Scenario grid displays all calculations
- [ ] Color-coded impact cells (green=positive, red=negative, gray=neutral)
- [ ] Click-to-drill-down for detailed cell analysis
- [ ] Real-time search and filtering across assets/scenarios
- [ ] Responsive design works on desktop and tablet
- [ ] Loading states and error boundaries handle edge cases

### **🎨 Visual Requirements**
- [ ] Sticky headers for navigation in large matrices
- [ ] Smooth hover animations and visual feedback
- [ ] Clear impact scoring visualization (-5 to +5 scale)
- [ ] Confidence indicators and risk level badges
- [ ] Professional color coding matching design system

### **⚡ Performance Requirements**
- [ ] Matrix loads within 2 seconds for up to 50 assets × 20 scenarios
- [ ] Smooth scrolling and interactions (60fps)
- [ ] Efficient filtering without API calls
- [ ] Cached data prevents unnecessary refetches

### **🧪 Testing Checklist**
1. **Matrix Display**: Grid renders correctly with different data sizes
2. **Cell Interactions**: Click, hover, and selection states work
3. **Search & Filter**: All filtering combinations function properly
4. **Responsive Design**: Layout adapts to different screen sizes
5. **Error Handling**: API failures show appropriate messages
6. **Loading States**: Skeletons display during data fetching

---

## 🚀 **Implementation Timeline**

### **Phase 1 (2 hours): Core Matrix Grid**
- Step 1: Enhanced matrix data hooks (45 min)
- Step 2: Matrix grid container (60 min)
- Step 3: Interactive matrix cells (45 min)

### **Phase 2 (1.5 hours): Headers & Navigation**  
- Step 4: Matrix headers & row labels (30 min)
- Step 5: Matrix toolbar & controls (30 min)
- Step 6: Cell detail dialog (30 min)

### **Phase 3 (1 hour): Page Integration**
- Step 7: Complete matrix page transformation (60 min)

### **Phase 4 (30 minutes): Polish & Testing**
- Visual refinements and responsive adjustments
- Manual testing across different scenarios
- Performance optimization if needed

---

## 🎉 **Expected Impact**

### **User Experience Transformation**
**Before**: Basic metrics dashboard with placeholder text  
**After**: Rich interactive matrix with visual impact analysis

### **Developer Experience Benefits**
- **Reusable Components**: Matrix grid pattern for future features
- **Type-Safe Integration**: Full TypeScript support throughout
- **Performance Optimized**: Smart caching and efficient filtering
- **Maintainable Code**: Clean component architecture under 200 lines each

### **Business Value Delivered**
- **Professional Analytics**: Enterprise-grade matrix visualization
- **Actionable Insights**: Clear impact scoring and risk indicators  
- **Efficient Navigation**: Quick filtering and drill-down capabilities
- **Data-Driven Decisions**: Visual correlation between assets and scenarios

The Matrix Implementation transforms Finex v3 from a basic dashboard into a sophisticated analysis platform, providing users with the rich interactive experience envisioned in the original design specification. 