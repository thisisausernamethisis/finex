'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { MatrixGrid } from '@/components/MatrixGrid';
import { EnhancedMatrixGrid } from '@/components/EnhancedMatrixGrid';
import { LiveCategorizationPanel } from '@/components/LiveCategorizationPanel';
import { DiscoveryFeed } from '@/components/DiscoveryCard';
import { Plus, Filter, Download, RefreshCw, Zap, Brain } from 'lucide-react';

// Mock data for demonstration
const mockAssets = [
  { id: '1', name: 'NVIDIA', category: 'ai' as const, ticker: 'NVDA' },
  { id: '2', name: 'Tesla', category: 'robotics' as const, ticker: 'TSLA' },
  { id: '3', name: 'Microsoft', category: 'ai' as const, ticker: 'MSFT' },
  { id: '4', name: 'Google', category: 'ai' as const, ticker: 'GOOGL' },
  { id: '5', name: 'IonQ', category: 'quantum' as const, ticker: 'IONQ' },
  { id: '6', name: 'Apple', category: 'traditional' as const, ticker: 'AAPL' }
];

const mockScenarios = [
  {
    id: '1',
    name: 'AI Acceleration',
    type: 'TECHNOLOGY' as const,
    timeline: '2024-2026',
    description: 'Rapid AI adoption across industries'
  },
  {
    id: '2', 
    name: 'Robotics Boom',
    type: 'TECHNOLOGY' as const,
    timeline: '2025-2030',
    description: 'Mass deployment of physical AI'
  },
  {
    id: '3',
    name: 'Quantum Breakthrough',
    type: 'TECHNOLOGY' as const,
    timeline: '2027-2032',
    description: 'Quantum computing advantage achieved'
  },
  {
    id: '4',
    name: 'Economic Downturn',
    type: 'ECONOMIC' as const,
    timeline: '2024-2025',
    description: 'Global recession impacts tech spending'
  }
];

const mockMatrix = [
  { assetId: '1', scenarioId: '1', impact: 4.2, confidence: 0.9, explanation: 'NVIDIA is the primary beneficiary of AI acceleration with GPU dominance' },
  { assetId: '1', scenarioId: '2', impact: 2.8, confidence: 0.7, explanation: 'Robotics requires significant compute, benefiting NVIDIA' },
  { assetId: '1', scenarioId: '3', impact: 1.5, confidence: 0.6, explanation: 'Quantum computing may eventually compete with classical compute' },
  { assetId: '1', scenarioId: '4', impact: -2.1, confidence: 0.8, explanation: 'Economic downturn reduces enterprise AI spending' },
  
  { assetId: '2', scenarioId: '1', impact: 3.5, confidence: 0.8, explanation: 'Tesla benefits from AI advances in autonomous driving' },
  { assetId: '2', scenarioId: '2', impact: 4.8, confidence: 0.95, explanation: 'Tesla is fundamentally a robotics company - massive upside' },
  { assetId: '2', scenarioId: '3', impact: 0.5, confidence: 0.4, explanation: 'Limited direct impact from quantum breakthroughs' },
  { assetId: '2', scenarioId: '4', impact: -3.2, confidence: 0.85, explanation: 'Luxury EV demand drops significantly in recession' },
  
  { assetId: '3', scenarioId: '1', impact: 3.8, confidence: 0.85, explanation: 'Microsoft AI services and Copilot drive growth' },
  { assetId: '3', scenarioId: '2', impact: 2.2, confidence: 0.6, explanation: 'Cloud infrastructure benefits from robotics deployment' },
  { assetId: '3', scenarioId: '3', impact: 2.1, confidence: 0.7, explanation: 'Microsoft invests heavily in quantum computing research' },
  { assetId: '3', scenarioId: '4', impact: -1.5, confidence: 0.75, explanation: 'Enterprise software spending resilient but not immune' },
  
  { assetId: '5', scenarioId: '3', impact: 4.9, confidence: 0.8, explanation: 'IonQ is pure-play quantum computing leader' },
  { assetId: '5', scenarioId: '1', impact: 1.2, confidence: 0.5, explanation: 'Quantum may accelerate some AI workloads' },
  { assetId: '5', scenarioId: '4', impact: -1.8, confidence: 0.7, explanation: 'Quantum investment may be delayed in downturn' }
];

const mockInsights = [
  {
    id: '1',
    type: 'revelation' as const,
    title: 'Tesla is fundamentally a robotics company',
    description: 'Analysis reveals Tesla derives 80% of its future value from robotics and AI capabilities, not traditional automotive manufacturing.',
    category: 'robotics' as const,
    assets: ['Tesla', 'NVIDIA'],
    confidence: 0.87,
    impact: 'high' as const,
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    metadata: {
      percentage: 80,
      timeframe: '2025-2030',
      source: 'AI Analysis'
    }
  },
  {
    id: '2',
    type: 'concentration' as const,
    title: 'Portfolio has 65% AI/Compute exposure',
    description: 'Your portfolio shows significant concentration in AI and compute technologies, creating both opportunity and risk.',
    category: 'ai' as const,
    assets: ['NVIDIA', 'Microsoft', 'Google'],
    confidence: 0.93,
    impact: 'medium' as const,
    timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    metadata: {
      percentage: 65,
      timeframe: 'Current'
    }
  },
  {
    id: '3',
    type: 'opportunity' as const,
    title: 'Quantum computing breakthrough accelerating',
    description: 'Recent advances in quantum error correction suggest commercial viability arriving 2-3 years earlier than expected.',
    category: 'quantum' as const,
    assets: ['IonQ', 'Microsoft'],
    confidence: 0.72,
    impact: 'high' as const,
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    metadata: {
      timeframe: '2027-2029',
      source: 'Research Analysis'
    }
  }
];

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [realScenarios, setRealScenarios] = useState(mockScenarios);
  const [portfolioInsights, setPortfolioInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [useEnhancedMatrix, setUseEnhancedMatrix] = useState(true);
  const [showCategorizationPanel, setShowCategorizationPanel] = useState(false);

  // Fetch real technology scenarios
  useEffect(() => {
    async function fetchTechnologyScenarios() {
      try {
        const response = await fetch('/api/scenarios/technology');
        if (response.ok) {
          const data = await response.json();
          if (data.scenarios && data.scenarios.length > 0) {
            // Transform API data to match component expectations
            const transformedScenarios = data.scenarios.map((scenario: any) => ({
              id: scenario.id,
              name: scenario.name,
              type: scenario.type,
              timeline: scenario.timeline || 'Unknown',
              description: scenario.description || 'No description available'
            }));
            setRealScenarios(transformedScenarios);
          }
        }
      } catch (error) {
        console.error('Failed to fetch technology scenarios:', error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    }

    fetchTechnologyScenarios();
  }, []);

  // Fetch portfolio insights
  useEffect(() => {
    async function fetchPortfolioInsights() {
      try {
        const response = await fetch('/api/matrix/insights?detailed=false');
        if (response.ok) {
          const data = await response.json();
          setPortfolioInsights(data);
        }
      } catch (error) {
        console.error('Failed to fetch portfolio insights:', error);
        // Keep using mock data on error
      } finally {
        setInsightsLoading(false);
      }
    }

    fetchPortfolioInsights();
  }, []);

  const handleCellClick = (assetId: string, scenarioId: string, cellData?: any) => {
    console.log('Cell clicked:', assetId, scenarioId, cellData);
    // TODO: Open detailed analysis modal with cellData
  };

  const handleInsightExplore = (insightId: string) => {
    console.log('Explore insight:', insightId);
    // TODO: Navigate to detailed insight view
  };

  const handleInsightDismiss = (insightId: string) => {
    console.log('Dismiss insight:', insightId);
    // TODO: Remove insight from feed
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Enhanced Technology Analysis Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Real-time AI-powered insights into technology disruption patterns
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="1Y">1 Year</option>
              <option value="3Y">3 Years</option>
            </select>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Asset</span>
            </button>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setShowCategorizationPanel(!showCategorizationPanel)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showCategorizationPanel 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm">AI Status</span>
              </button>
              
              <button 
                onClick={() => setUseEnhancedMatrix(!useEnhancedMatrix)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  useEnhancedMatrix 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Enhanced</span>
              </button>
              
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Download className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insightsLoading ? (
            // Loading state
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            ))
          ) : portfolioInsights && portfolioInsights.summary ? (
            // Real data from portfolio insights
            <>
              <MetricCard
                title="Portfolio Health"
                value={portfolioInsights.quickStats?.portfolioHealth || 0}
                previousValue={(portfolioInsights.quickStats?.portfolioHealth || 0) - 5}
                suffix="/100"
                category="traditional"
                sparklineData={[65, 70, 75, 80, portfolioInsights.quickStats?.portfolioHealth || 0]}
                confidence={0.95}
                insight={`${portfolioInsights.summary.categorizedAssets} of ${portfolioInsights.summary.totalAssets} assets categorized`}
              />
              
              <MetricCard
                title="Top Technology Exposure"
                value={portfolioInsights.summary.topExposures?.[0]?.percentage || 0}
                previousValue={(portfolioInsights.summary.topExposures?.[0]?.percentage || 0) - 7}
                suffix="%"
                category="ai"
                sparklineData={[40, 45, 50, 55, portfolioInsights.summary.topExposures?.[0]?.percentage || 0]}
                confidence={0.90}
                insight={`${portfolioInsights.summary.topExposures?.[0]?.category || 'Technology'} dominance`}
              />
              
              <MetricCard
                title="Diversification Score"
                value={portfolioInsights.quickStats?.diversificationScore || 0}
                previousValue={(portfolioInsights.quickStats?.diversificationScore || 0) - 8}
                suffix="/100"
                category="robotics"
                sparklineData={[50, 55, 60, 65, portfolioInsights.quickStats?.diversificationScore || 0]}
                confidence={0.85}
                insight={`${portfolioInsights.summary.topExposures?.length || 0} technology categories`}
              />
              
              <MetricCard
                title="Risk Level"
                value={portfolioInsights.quickStats?.riskScore || 0}
                previousValue={(portfolioInsights.quickStats?.riskScore || 0) + 5}
                suffix="/100"
                category="quantum"
                trend={portfolioInsights.summary.riskLevel === 'LOW' ? 'down' : 'up'}
                sparklineData={[30, 25, 20, 15, portfolioInsights.quickStats?.riskScore || 0]}
                confidence={0.88}
                insight={`${portfolioInsights.summary.riskLevel} risk portfolio`}
              />
            </>
          ) : (
            // Fallback to mock data
            <>
              <MetricCard
                title="AI/Compute Exposure"
                value={65}
                previousValue={58}
                suffix="%"
                category="ai"
                sparklineData={[45, 52, 58, 61, 65]}
                confidence={0.93}
                insight="3 of top 6 holdings are AI-focused"
              />
              
              <MetricCard
                title="Robotics Potential"
                value={28}
                previousValue={15}
                suffix="%"
                category="robotics"
                sparklineData={[12, 15, 18, 24, 28]}
                confidence={0.87}
                insight="Tesla driving significant robotics exposure"
              />
              
              <MetricCard
                title="Portfolio Impact Score"
                value={3.4}
                previousValue={2.8}
                prefix=""
                category="traditional"
                trend="up"
                sparklineData={[2.1, 2.4, 2.8, 3.1, 3.4]}
                confidence={0.79}
              />
              
              <MetricCard
                title="Quantum Readiness"
                value={12}
                previousValue={8}
                suffix="%"
                category="quantum"
                sparklineData={[5, 6, 8, 10, 12]}
                confidence={0.64}
                insight="Early but growing quantum allocation"
              />
            </>
          )}
        </div>

        {/* AI Categorization Panel (Conditional) */}
        {showCategorizationPanel && (
          <div className="mb-8">
            <LiveCategorizationPanel />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Matrix - Takes up 2 columns */}
          <div className="lg:col-span-2">
            {useEnhancedMatrix ? (
              <EnhancedMatrixGrid
                assets={mockAssets}
                scenarios={realScenarios}
                onCellClick={handleCellClick}
              />
            ) : (
              <MatrixGrid
                assets={mockAssets}
                scenarios={realScenarios}
                matrix={mockMatrix}
                onCellClick={(assetId, scenarioId) => handleCellClick(assetId, scenarioId)}
              />
            )}
          </div>
          
          {/* Insights Feed */}
          <div className="lg:col-span-1">
            <DiscoveryFeed
              insights={portfolioInsights?.keyInsights ? 
                portfolioInsights.keyInsights.map((insight: any, index: number) => ({
                  id: insight.id,
                  type: insight.type === 'EXPOSURE' ? 'concentration' as const : 
                        insight.type === 'RISK' ? 'risk' as const :
                        insight.type === 'OPPORTUNITY' ? 'opportunity' as const : 'revelation' as const,
                  title: insight.title,
                  description: insight.description,
                  category: portfolioInsights.summary.topExposures?.[0]?.category?.toLowerCase() || 'ai' as const,
                  assets: [],
                  confidence: insight.confidence,
                  impact: insight.impact?.toLowerCase() as 'low' | 'medium' | 'high',
                  timestamp: new Date(Date.now() - index * 5 * 60 * 1000), // Stagger timestamps
                  metadata: {}
                })) : mockInsights
              }
              onExplore={handleInsightExplore}
              onDismiss={handleInsightDismiss}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-foreground">Add Technology Asset</div>
                <div className="text-sm text-muted-foreground">Expand your tech exposure</div>
              </div>
            </button>
            
            <button 
              onClick={async () => {
                setInsightsLoading(true);
                try {
                  const response = await fetch('/api/matrix/insights?forceRefresh=true&detailed=false');
                  if (response.ok) {
                    const data = await response.json();
                    setPortfolioInsights(data);
                  }
                } catch (error) {
                  console.error('Failed to refresh insights:', error);
                } finally {
                  setInsightsLoading(false);
                }
              }}
              className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 text-green-600 dark:text-green-400 ${insightsLoading ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="font-medium text-foreground">Refresh Portfolio Analysis</div>
                <div className="text-sm text-muted-foreground">Get latest insights</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-foreground">Export Report</div>
                <div className="text-sm text-muted-foreground">Share your analysis</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 