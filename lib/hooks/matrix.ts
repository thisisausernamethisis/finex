import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';

export interface MatrixData {
  scenarios: {
    id: string;
    name: string;
    probability: number;
  }[];
  assets: {
    id: string;
    name: string;
    currentValue: number;
  }[];
  impacts: {
    scenarioId: string;
    assetId: string;
    impactScore: number;
    description?: string;
  }[];
}

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
  breakdown?: {
    baseImpact: number;
    technologyMultiplier: number;
    timelineAdjustment: number;
    confidenceScore: number;
  };
}

export function useMatrixData() {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['matrix'],
    queryFn: async (): Promise<MatrixData> => {
      const token = await getToken();
      
      const response = await fetch('/api/matrix', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matrix data');
      }
      
      return response.json();
    },
    enabled: !!getToken,
  });
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
    enabled: !!(assetId && scenarioId),
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