import { useQuery } from '@tanstack/react-query';
import { useAssets } from './assets';
import { useScenarios } from './scenarios';
import { useMatrixData } from './matrix';

export interface DashboardMetrics {
  totalAssets: number;
  totalScenarios: number;
  matrixCoverage: number;
  portfolioValue: number;
  topPerformers: {
    id: string;
    name: string;
    change: number;
  }[];
  recentScenarios: {
    id: string;
    name: string;
    type: string;
    createdAt: string;
  }[];
}

export function useDashboardMetrics() {
  const { data: assetsData, isLoading: assetsLoading } = useAssets();
  const { data: scenariosData, isLoading: scenariosLoading } = useScenarios();
  const { data: matrixData, isLoading: matrixLoading } = useMatrixData();
  
  return useQuery({
    queryKey: ['dashboard-metrics', assetsData, scenariosData, matrixData],
    queryFn: (): DashboardMetrics => {
      const assets = assetsData?.data || [];
      const scenarios = scenariosData?.data || [];
      const matrix = matrixData || { scenarios: [], assets: [], impacts: [] };
      
      // Calculate metrics
      const totalAssets = assets.length;
      const totalScenarios = scenarios.length;
      const matrixCoverage = matrix.impacts.length;
      
      // Calculate portfolio value (sum of growth values)
      const portfolioValue = assets.reduce((sum, asset) => {
        return sum + (asset.growthValue || 0);
      }, 0);
      
      // Get top performing assets (mock calculation)
      const topPerformers = assets
        .slice(0, 3)
        .map(asset => ({
          id: asset.id,
          name: asset.name,
          change: Math.random() * 20 - 10, // Mock change percentage
        }));
      
      // Get recent scenarios
      const recentScenarios = scenarios
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(scenario => ({
          id: scenario.id,
          name: scenario.name,
          type: scenario.type || 'Unknown',
          createdAt: scenario.createdAt,
        }));
      
      return {
        totalAssets,
        totalScenarios,
        matrixCoverage,
        portfolioValue,
        topPerformers,
        recentScenarios,
      };
    },
    enabled: !assetsLoading && !scenariosLoading && !matrixLoading,
  });
} 