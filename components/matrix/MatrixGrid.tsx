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
  // Organize data into grid structure with enhanced metadata
  const assetMap = new Map<string, { id: string; name: string; impacts: number[] }>();
  const scenarioMap = new Map<string, { id: string; name: string; type: string; impacts: number[] }>();
  
  calculations.forEach(calc => {
    // Build asset data and calculate resilience
    if (!assetMap.has(calc.assetId)) {
      assetMap.set(calc.assetId, {
        id: calc.assetId,
        name: calc.assetName,
        impacts: []
      });
    }
    assetMap.get(calc.assetId)!.impacts.push(calc.impact);
    
    // Build scenario data
    if (!scenarioMap.has(calc.scenarioId)) {
      scenarioMap.set(calc.scenarioId, {
        id: calc.scenarioId,
        name: calc.scenarioName,
        type: calc.scenarioType,
        impacts: []
      });
    }
    scenarioMap.get(calc.scenarioId)!.impacts.push(calc.impact);
  });
  
  // Calculate resilience scores (average impact)
  const assets = Array.from(assetMap.values()).map(asset => ({
    ...asset,
    avgImpact: asset.impacts.length > 0 
      ? asset.impacts.reduce((sum: number, impact: number) => sum + impact, 0) / asset.impacts.length 
      : 0
  }));
  
  const scenarios = Array.from(scenarioMap.values()).map(scenario => ({
    ...scenario,
    avgImpact: scenario.impacts.length > 0
      ? scenario.impacts.reduce((sum: number, impact: number) => sum + impact, 0) / scenario.impacts.length
      : 0
  }));
  
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