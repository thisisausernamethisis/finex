import Link from 'next/link'
import { ArrowRight, Target, Map, TrendingUp, BarChart3, Shield, Brain, Users, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">Finex v3</h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              Strategic scenario analysis platform. Create a low-resolution map of the future 
              through systematic asset-scenario impact analysis for data-driven strategic planning.
            </p>
            
            <p className="text-lg text-muted-foreground/80 mb-8 max-w-2xl mx-auto">
              Replace ad-hoc speculation with systematic analysis. Discover portfolio resilience, 
              identify hidden risks, and make informed strategic decisions.
            </p>
            
            <div className="flex items-center justify-center space-x-4 mb-12">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <span>Start Strategic Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/matrix"
                className="flex items-center space-x-2 px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Explore Matrix</span>
              </Link>
            </div>
            
            {/* Demo insight card */}
            <div className="max-w-md mx-auto bg-card rounded-xl border border-border p-6 text-left">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Portfolio Resilience</div>
                  <div className="text-xs text-muted-foreground">Strategic Analysis</div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Portfolio shows 73% resilience across recession scenarios
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analysis across 8 economic scenarios reveals strong defensive positioning with moderate growth exposure.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Confidence: 84%</span>
                <div className="flex space-x-1">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                    RESILIENT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Strategic Analysis Process */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Strategic Planning Reimagined
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Systematic 4-phase approach to scenario analysis. Build comprehensive understanding 
              of how future events impact your strategic position.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Asset Research</h3>
              <p className="text-muted-foreground text-sm">
                Define assets and build comprehensive profiles. Create themes and populate with 
                research data, market analysis, and strategic context.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Scenario Planning</h3>
              <p className="text-muted-foreground text-sm">
                Create time-bound future variables. Define geopolitical, economic, and technological 
                scenarios with probability estimates and timelines.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Matrix Generation</h3>
              <p className="text-muted-foreground text-sm">
                AI analyzes every asset × scenario combination. Generate impact scores (-5 to +5) 
                with detailed reasoning and confidence levels.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Strategic Analysis</h3>
              <p className="text-muted-foreground text-sm">
                Discover portfolio resilience patterns, concentration risks, and optimization 
                opportunities. Make data-driven strategic decisions.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Strategic Applications
            </h2>
            <p className="text-lg text-muted-foreground">
              From portfolio resilience to strategic positioning—systematic scenario analysis 
              for confident decision-making
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Portfolio Resilience Analysis</h3>
                  <p className="text-muted-foreground mb-4">
                    Test portfolio performance across recession, inflation, and geopolitical scenarios. 
                    Identify concentration risks and defensive positioning opportunities.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Cross-scenario resilience scoring</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Concentration risk detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Defensive asset identification</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Growth Opportunity Discovery</h3>
                  <p className="text-muted-foreground mb-4">
                    Combine TAM projections with scenario analysis to identify undervalued assets 
                    with strong future positioning across multiple scenarios.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>TAM / Risk-adjusted opportunity ratios</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Scenario-resilient growth assets</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Strategic positioning insights</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Map className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Strategic Risk Assessment</h3>
                  <p className="text-muted-foreground mb-4">
                    Quantify exposure to regulatory changes, technological disruption, and market shifts. 
                    Build systematic understanding of strategic vulnerabilities.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Regulatory impact analysis</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Technology disruption exposure</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Market sensitivity mapping</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl p-8 border border-border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Data-Driven Planning</h3>
                  <p className="text-muted-foreground mb-4">
                    Replace subjective planning with systematic analysis. Generate quantified confidence 
                    in strategic decisions through comprehensive scenario modeling.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Quantified uncertainty analysis</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <ChevronRight className="w-3 h-3" />
                      <span>Evidence-based recommendations</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ChevronRight className="w-3 h-3" />
                      <span>Systematic decision frameworks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Strategic Value */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
                             Create Your &ldquo;Low Resolution Map of the Future&rdquo;
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Move beyond ad-hoc speculation. Build systematic understanding of how future events 
              impact your strategic position through comprehensive scenario analysis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Systematic Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Replace gut feelings with structured methodology. Consistent evaluation criteria 
                across all scenarios and assets.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quantified Uncertainty</h3>
              <p className="text-sm text-muted-foreground">
                Impact scores from -5 to +5 with confidence levels. Transform uncertainty 
                into actionable strategic intelligence.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Strategic Positioning</h3>
              <p className="text-sm text-muted-foreground">
                Identify optimal positioning for uncertain futures. Portfolio optimization 
                based on scenario resilience and opportunity discovery.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to build your strategic advantage?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start with systematic scenario analysis. Discover portfolio resilience patterns, 
            identify strategic risks, and make confident decisions about uncertain futures.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
            >
              <span>Begin Strategic Analysis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/scenarios"
              className="inline-flex items-center space-x-2 px-8 py-4 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium text-lg"
            >
              <Map className="w-5 h-5" />
              <span>Explore Scenarios</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
