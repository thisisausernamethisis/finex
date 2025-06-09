'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Target, Grid3X3, Lock } from 'lucide-react';
import { AssetWorkflowManager } from '@/components/features/AssetWorkflow/AssetWorkflowManager';
import { ScenarioWorkflowManager } from '@/components/features/ScenarioWorkflow/ScenarioWorkflowManager';
// import { useWorkflow } from '@/lib/hooks/workflow'; // Temporarily disabled
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MainTabsProps {
  defaultTab?: 'assets' | 'scenarios' | 'matrix';
}

export function MainTabs({ defaultTab = 'assets' }: MainTabsProps) {
  // Simplified: Always allow access to all tabs
  const canAccessScenarios = true;
  const canAccessMatrix = true;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Simplified Header - NEW UX v4 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Finex v3 - Simplified UX</h1>
          <p className="text-muted-foreground">
            Only 2 buttons: Add Asset and Add Scenario (v4)
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="scenarios" 
              disabled={!canAccessScenarios}
              className={`flex items-center gap-2 ${!canAccessScenarios ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!canAccessScenarios && <Lock className="w-4 h-4" />}
              <Target className="w-4 h-4" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger 
              value="matrix" 
              disabled={!canAccessMatrix}
              className={`flex items-center gap-2 ${!canAccessMatrix ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!canAccessMatrix && <Lock className="w-4 h-4" />}
              <Grid3X3 className="w-4 h-4" />
              Matrix Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Asset Management</h2>
                <p className="text-muted-foreground text-sm">
                  Create and organize your assets with themes and research cards. Assets become matrix rows.
                </p>
              </div>
            </div>
            <AssetWorkflowManager />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Scenario Planning</h2>
                <p className="text-muted-foreground text-sm">
                  Define future scenarios with supporting research. Scenarios become matrix columns.
                </p>
              </div>
            </div>
            <ScenarioWorkflowManager />
          </TabsContent>

          <TabsContent value="matrix" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Matrix Analysis</h2>
                <p className="text-muted-foreground text-sm">
                  AI-powered impact scoring (-5 to +5) for Asset × Scenario combinations.
                </p>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Matrix Analysis</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                The matrix analysis provides AI-powered insights into how your scenarios impact each asset. 
                Build your assets and scenarios first, then generate the analysis matrix.
              </p>
              <p className="text-sm text-muted-foreground">
                <Link href="/matrix" className="text-primary hover:underline">
                  Visit the Matrix Analysis page
                </Link>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 