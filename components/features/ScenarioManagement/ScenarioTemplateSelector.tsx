'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Zap, Globe, Gavel, TrendingUp, Target } from 'lucide-react';

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  type: 'TECHNOLOGY' | 'ECONOMIC' | 'GEOPOLITICAL' | 'REGULATORY' | 'MARKET';
  probability: number;
  timeline: string;
  impactFactors: string[];
  examples: string[];
}

interface ScenarioTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ScenarioTemplate) => void;
  onCreateFromScratch: () => void;
}

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'ai-regulation',
    name: 'AI Regulation Tightening',
    description: 'Government regulations significantly restrict AI development and deployment',
    type: 'REGULATORY',
    probability: 0.7,
    timeline: '2-3 years',
    impactFactors: ['Compliance costs', 'Development restrictions', 'Market access'],
    examples: ['EU AI Act enforcement', 'US federal AI regulations', 'China AI oversight']
  },
  {
    id: 'quantum-breakthrough',
    name: 'Quantum Computing Breakthrough',
    description: 'Major advancement in quantum computing makes it commercially viable',
    type: 'TECHNOLOGY',
    probability: 0.4,
    timeline: '5-7 years',
    impactFactors: ['Cryptography disruption', 'Computing power shift', 'Industry transformation'],
    examples: ['Error-corrected quantum computers', 'Quantum supremacy in optimization', 'Quantum internet']
  },
  {
    id: 'economic-recession',
    name: 'Global Economic Recession',
    description: 'Worldwide economic downturn significantly impacts markets and investment',
    type: 'ECONOMIC',
    probability: 0.6,
    timeline: '1-2 years',
    impactFactors: ['Reduced spending', 'Investment pullback', 'Market volatility'],
    examples: ['Banking sector stress', 'Inflation spike', 'Supply chain disruptions']
  },
  {
    id: 'taiwan-conflict',
    name: 'Taiwan-China Conflict',
    description: 'Military or economic conflict disrupts Taiwan-based supply chains',
    type: 'GEOPOLITICAL',
    probability: 0.3,
    timeline: '1-5 years',
    impactFactors: ['Semiconductor shortage', 'Supply chain disruption', 'Global trade impact'],
    examples: ['Naval blockade', 'Economic sanctions', 'Manufacturing disruption']
  },
  {
    id: 'energy-transition',
    name: 'Accelerated Energy Transition',
    description: 'Rapid shift to renewable energy transforms energy markets',
    type: 'MARKET',
    probability: 0.8,
    timeline: '3-5 years',
    impactFactors: ['Fossil fuel decline', 'Green technology adoption', 'Grid modernization'],
    examples: ['Carbon pricing', 'Battery cost reduction', 'Grid storage deployment']
  },
  {
    id: 'pandemic-resurgence',
    name: 'Pandemic Resurgence',
    description: 'New pandemic or COVID variant significantly disrupts global operations',
    type: 'ECONOMIC',
    probability: 0.4,
    timeline: '1-3 years',
    impactFactors: ['Remote work shift', 'Supply chain stress', 'Healthcare demand'],
    examples: ['Travel restrictions', 'Lockdown measures', 'Healthcare system strain']
  }
];

const typeIcons = {
  TECHNOLOGY: <Zap className="h-4 w-4" />,
  ECONOMIC: <TrendingUp className="h-4 w-4" />,
  GEOPOLITICAL: <Globe className="h-4 w-4" />,
  REGULATORY: <Gavel className="h-4 w-4" />,
  MARKET: <Target className="h-4 w-4" />
};

const typeColors = {
  TECHNOLOGY: 'bg-blue-100 text-blue-800',
  ECONOMIC: 'bg-green-100 text-green-800',
  GEOPOLITICAL: 'bg-red-100 text-red-800',
  REGULATORY: 'bg-purple-100 text-purple-800',
  MARKET: 'bg-orange-100 text-orange-800'
};

export function ScenarioTemplateSelector({ 
  isOpen, 
  onClose, 
  onSelectTemplate, 
  onCreateFromScratch 
}: ScenarioTemplateSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredTemplates = scenarioTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                         template.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getProbabilityLabel = (prob: number) => {
    if (prob <= 0.3) return 'Low';
    if (prob <= 0.6) return 'Medium';
    return 'High';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Choose Scenario Template
          </DialogTitle>
          <DialogDescription>
            Select a pre-built scenario template to get started quickly, or create your own from scratch.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search scenario templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-[180px] px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="TECHNOLOGY">Technology</option>
            <option value="ECONOMIC">Economic</option>
            <option value="GEOPOLITICAL">Geopolitical</option>
            <option value="REGULATORY">Regulatory</option>
            <option value="MARKET">Market</option>
          </select>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  {typeIcons[template.type]}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={typeColors[template.type]}>
                    {template.type}
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(template.probability * 100)}% ({getProbabilityLabel(template.probability)})
                  </Badge>
                  <Badge variant="secondary">
                    {template.timeline}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Impact Factors:</div>
                  <div className="text-xs text-muted-foreground">
                    {template.impactFactors.slice(0, 3).join(', ')}
                    {template.impactFactors.length > 3 && '...'}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Examples:</div>
                  <div className="text-xs text-muted-foreground">
                    {template.examples.slice(0, 2).join(', ')}
                    {template.examples.length > 2 && '...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No templates match your search criteria.</p>
          </div>
        )}

        {/* Create from Scratch Option */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Create Custom Scenario</h4>
              <p className="text-sm text-muted-foreground">
                Start with a blank scenario and define all parameters yourself
              </p>
            </div>
            <Button variant="outline" onClick={onCreateFromScratch}>
              <Zap className="w-4 h-4 mr-2" />
              Create from Scratch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}