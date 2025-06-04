import Link from 'next/link'
import { ArrowRight, Zap, Brain, Atom, BarChart3, Target, Lightbulb } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-cyan-950/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Atom className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-foreground">MetaMap</h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-powered technology disruption analysis. Discover hidden patterns, 
              assess portfolio concentration, and reveal unexpected insights about your investments.
            </p>
            
            <div className="flex items-center justify-center space-x-4 mb-12">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <span>Try Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/insights"
                className="flex items-center space-x-2 px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                <span>View Insights</span>
              </Link>
            </div>
            
            {/* Demo insight card */}
            <div className="max-w-md mx-auto bg-card rounded-xl border border-border p-6 text-left">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">AI Revelation</div>
                  <div className="text-xs text-muted-foreground">Just discovered</div>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Tesla is fundamentally a robotics company
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analysis reveals 80% of future value comes from AI and robotics capabilities.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Confidence: 87%</span>
                <div className="flex space-x-1">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                    ROBOTICS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Technology Analysis Reimagined
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Move beyond traditional analysis with AI-powered insights that reveal 
              the true nature of your technology investments.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Categorization</h3>
              <p className="text-muted-foreground">
                Automatically classify assets into AI/Compute, Robotics, Quantum, and Traditional categories 
                with &gt;90% accuracy.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Impact Matrix Analysis</h3>
              <p className="text-muted-foreground">
                Visualize how technology scenarios affect your portfolio with confidence-weighted 
                impact scoring across multiple timeframes.
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Instant Revelations</h3>
              <p className="text-muted-foreground">
                Discover surprising insights like "Tesla is 80% robotics" through continuous 
                AI analysis of your portfolio composition.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Technology Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Technology Categories We Track
            </h2>
            <p className="text-lg text-muted-foreground">
              Focus on the four pillars of technological disruption
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-ai rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI/Compute</h3>
              <p className="text-sm text-muted-foreground">
                NVIDIA, Microsoft, Google, OpenAI ecosystem
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-robotics rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Robotics/Physical AI</h3>
              <p className="text-sm text-muted-foreground">
                Tesla, Boston Dynamics, automation platforms
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-quantum rounded-xl flex items-center justify-center mx-auto mb-4">
                <Atom className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quantum</h3>
              <p className="text-sm text-muted-foreground">
                IonQ, IBM Quantum, emerging quantum players
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 gradient-traditional rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Traditional</h3>
              <p className="text-sm text-muted-foreground">
                Established tech companies adapting to disruption
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to discover hidden patterns?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the future of technology analysis. Start with our essential features, 
            upgrade as you need more sophistication.
          </p>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg"
          >
            <span>Start Analyzing</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
