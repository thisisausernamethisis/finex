import { useState } from 'react';
import { Search, Filter, Download, RefreshCw, Settings, Play, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MatrixToolbarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: MatrixFilters) => void;
  onRefresh: () => void;
  onExport: () => void;
  onGenerate?: () => void;
  isLoading?: boolean;
  matrixStats?: {
    totalCalculations: number;
    avgConfidence: number;
    lastUpdated?: string;
  };
}

export interface MatrixFilters {
  assetCategory?: string;
  scenarioType?: string;
  riskLevel?: string;
  impactRange?: { min: number; max: number };
}

export function MatrixToolbar({ 
  onSearch, 
  onFilterChange, 
  onRefresh, 
  onExport,
  onGenerate,
  isLoading = false,
  matrixStats
}: MatrixToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MatrixFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };
  
  const handleFilterChange = (key: keyof MatrixFilters, value: string | { min: number; max: number }) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    onFilterChange({});
    onSearch('');
  };
  
  return (
    <div className="matrix-toolbar bg-background border rounded-lg p-4 mb-4">
      {/* Matrix Status Row */}
      {matrixStats && (
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{matrixStats.totalCalculations} calculations</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(matrixStats.avgConfidence * 100)}% avg confidence
            </Badge>
            {matrixStats.lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {matrixStats.lastUpdated}
              </span>
            )}
          </div>
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              {isLoading ? 'Generating...' : 'Regenerate Matrix'}
            </Button>
          )}
        </div>
      )}

      {/* Main toolbar row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets or scenarios..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Quick filters */}
        <div className="flex items-center gap-2">
          <Select onValueChange={(value: string) => handleFilterChange('assetCategory', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Asset Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value: string) => handleFilterChange('scenarioType', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Scenario Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="economic">Economic</SelectItem>
              <SelectItem value="regulatory">Regulatory</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value: string) => handleFilterChange('riskLevel', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Advanced filters (collapsible) */}
      {showAdvancedFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Impact Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min="-5"
                  max="5"
                  onChange={(e) => {
                    const currentRange = filters.impactRange || { min: -5, max: 5 };
                    handleFilterChange('impactRange', {
                      min: parseInt(e.target.value) || -5,
                      max: currentRange.max
                    });
                  }}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  min="-5"
                  max="5"
                  onChange={(e) => {
                    const currentRange = filters.impactRange || { min: -5, max: 5 };
                    handleFilterChange('impactRange', {
                      min: currentRange.min,
                      max: parseInt(e.target.value) || 5
                    });
                  }}
                  className="w-20"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 