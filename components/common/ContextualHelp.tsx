'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  HelpCircle, 
  Book, 
  Target, 
  Map, 
  BarChart3, 
  Brain,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Users,
  FileText
} from 'lucide-react';

interface HelpContent {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  relatedPhases?: number[];
}

interface ContextualHelpProps {
  phase?: number;
  topic?: string;
  className?: string;
  triggerText?: string;
  variant?: 'inline' | 'dialog' | 'tooltip';
}

const helpContent: Record<string, HelpContent> = {
  'phase-1': {
    title: 'Phase 1: Asset Research',
    description: 'Define and research the assets you want to analyze. Build comprehensive profiles with themes and supporting data.',
    steps: [
      'Create assets representing investments, companies, or strategies you want to analyze',
      'Organize research into themes (e.g., Market Position, Technology, Competition)',
      'Add research cards to themes with data, reports, and analysis',
      'Include TAM projections and growth estimates where relevant'
    ],
    tips: [
      'Start with 3-5 key assets to keep analysis manageable',
      'Use diverse themes to capture different analytical angles',
      'Quality over quantity - focus on high-relevance research',
      'Template library can accelerate asset creation'
    ],
    relatedPhases: [2, 3]
  },
  'phase-2': {
    title: 'Phase 2: Scenario Planning',
    description: 'Create future scenarios that could impact your assets. Define time-bound variables and events to test.',
    steps: [
      'Define scenarios as specific future events or conditions',
      'Set probability estimates and timelines for each scenario',
      'Categorize by type (Technology, Economic, Geopolitical, etc.)',
      'Add impact factors and uncertainty assessments'
    ],
    tips: [
      'Focus on scenarios that could materially impact your assets',
      'Balance probable scenarios with high-impact edge cases',
      'Keep scenarios specific and time-bound',
      'Consider both positive and negative scenarios'
    ],
    relatedPhases: [1, 3]
  },
  'phase-3': {
    title: 'Phase 3: Matrix Generation',
    description: 'Generate AI-powered impact analysis for every Asset × Scenario combination in your matrix.',
    steps: [
      'Review your assets and scenarios for completeness',
      'Initiate matrix calculation to analyze all combinations',
      'Monitor processing status and review results as they complete',
      'Examine impact scores, confidence levels, and AI reasoning'
    ],
    tips: [
      'Ensure assets have sufficient research data for quality analysis',
      'Matrix calculation can take time for large portfolios',
      'Review low-confidence results for data quality issues',
      'Use filters to focus on specific impact ranges or categories'
    ],
    relatedPhases: [1, 2, 4]
  },
  'phase-4': {
    title: 'Phase 4: Strategic Analysis',
    description: 'Analyze results and extract strategic insights for decision-making and portfolio optimization.',
    steps: [
      'Review portfolio-level metrics and performance patterns',
      'Analyze AI-generated insights for opportunities and risks',
      'Identify assets with strong scenario resilience',
      'Develop strategic recommendations based on findings'
    ],
    tips: [
      'Look for assets that perform well across multiple scenarios',
      'Pay attention to concentration risks and vulnerabilities',
      'Use insights to guide portfolio rebalancing decisions',
      'Document key findings for future reference'
    ],
    relatedPhases: [3]
  },
  'templates': {
    title: 'Template Library',
    description: 'Accelerate asset creation using pre-built templates with research themes and structure.',
    steps: [
      'Browse available templates by category and tags',
      'Preview template structure and content before using',
      'Clone templates to create new assets',
      'Customize cloned assets with your specific research'
    ],
    tips: [
      'Templates provide proven analytical frameworks',
      'Start with templates, then customize for your needs',
      'Create your own templates from successful assets',
      'Share useful templates with the community'
    ]
  },
  'matrix-analysis': {
    title: 'Matrix Analysis',
    description: 'Understanding impact scores, confidence levels, and AI reasoning in matrix results.',
    steps: [
      'Impact scores range from -5 (very negative) to +5 (very positive)',
      'Confidence levels indicate AI certainty in the analysis',
      'Click cells for detailed reasoning and evidence trails',
      'Use filters to focus on specific impact ranges or asset types'
    ],
    tips: [
      'Higher confidence scores indicate more reliable analysis',
      'Look for patterns across rows (assets) and columns (scenarios)',
      'Low confidence may indicate insufficient research data',
      'Evidence tabs show which research supported the analysis'
    ]
  },
  'ai-insights': {
    title: 'AI Insights',
    description: 'Portfolio-level discoveries, opportunities, and strategic recommendations powered by AI.',
    steps: [
      'Review opportunity insights for potential portfolio additions',
      'Analyze risk insights for vulnerability mitigation',
      'Track trend insights for emerging patterns',
      'Act on actionable recommendations with high confidence'
    ],
    tips: [
      'Insights are generated from completed matrix analysis',
      'High confidence insights deserve immediate attention',
      'Combine multiple insights for strategic themes',
      'Regular analysis updates improve insight quality'
    ]
  }
};

export function ContextualHelp({ 
  phase, 
  topic, 
  className = '', 
  triggerText = 'Help',
  variant = 'dialog'
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getHelpKey = () => {
    if (topic) return topic;
    if (phase) return `phase-${phase}`;
    return 'general';
  };

  const helpKey = getHelpKey();
  const content = helpContent[helpKey];

  if (!content) {
    return null;
  }

  const getPhaseIcon = (phaseNum: number) => {
    switch (phaseNum) {
      case 1: return <Users className="h-4 w-4" />;
      case 2: return <Map className="h-4 w-4" />;
      case 3: return <BarChart3 className="h-4 w-4" />;
      case 4: return <Brain className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const HelpContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {phase && getPhaseIcon(phase)}
        <div>
          <h3 className="text-xl font-semibold">{content.title}</h3>
          <p className="text-muted-foreground">{content.description}</p>
        </div>
      </div>

      {/* Steps */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Step-by-Step Guide
        </h4>
        <div className="space-y-3">
          {content.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-medium flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <p className="text-sm">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Pro Tips
        </h4>
        <div className="space-y-2">
          {content.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Related Phases */}
      {content.relatedPhases && content.relatedPhases.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Related Phases
          </h4>
          <div className="flex flex-wrap gap-2">
            {content.relatedPhases.map((relatedPhase) => (
              <Badge key={relatedPhase} variant="outline" className="flex items-center gap-1">
                {getPhaseIcon(relatedPhase)}
                Phase {relatedPhase}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HelpContent />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
          onClick={() => setIsOpen(true)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          {triggerText}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Help & Guidance
            </DialogTitle>
          </DialogHeader>
          <HelpContent />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

// Quick help tips component for specific UI elements
interface QuickTipProps {
  tip: string;
  className?: string;
}

export function QuickTip({ tip, className = '' }: QuickTipProps) {
  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <Lightbulb className="h-3 w-3" />
      <span>{tip}</span>
    </div>
  );
}

// Progress indicator for current workflow step
interface WorkflowStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  className?: string;
}

export function WorkflowStepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  className = ''
}: WorkflowStepIndicatorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span>Step {currentStep} of {totalSteps}</span>
        <span className="text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}% complete
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      
      <div className="text-sm font-medium">
        {stepLabels[currentStep - 1] || 'Unknown step'}
      </div>
    </div>
  );
}