import Link from 'next/link'
import { Plus, FileText, Target, BarChart3, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Finex v3</h1>
          </div>
          <p className="text-muted-foreground">Asset scenario analysis platform</p>
        </div>

        {/* Core Workflow Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Assets */}
          <Link 
            href="/dashboard" 
            className="group bg-card border border-border rounded-xl p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Assets</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your asset portfolio. Add, edit, and organize assets for analysis.
            </p>
            <div className="flex items-center space-x-2 text-sm text-primary group-hover:text-primary/80">
              <Plus className="w-4 h-4" />
              <span>Add/Manage Assets</span>
            </div>
          </Link>

          {/* Themes */}
          <Link 
            href="/dashboard" 
            className="group bg-card border border-border rounded-xl p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Themes</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage thematic research. Organize analysis by themes.
            </p>
            <div className="flex items-center space-x-2 text-sm text-primary group-hover:text-primary/80">
              <Plus className="w-4 h-4" />
              <span>Add/Manage Themes</span>
            </div>
          </Link>

          {/* Analysis */}
          <Link 
            href="/matrix" 
            className="group bg-card border border-border rounded-xl p-6 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Run scenario analysis. Generate impact matrix and insights.
            </p>
            <div className="flex items-center space-x-2 text-sm text-primary group-hover:text-primary/80">
              <BarChart3 className="w-4 h-4" />
              <span>View Matrix</span>
            </div>
          </Link>

        </div>

        {/* Quick Actions */}
        <div className="bg-muted/30 rounded-xl p-6">
          <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span>Add New Asset</span>
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span>Create Theme</span>
            </Link>
            <Link 
              href="/matrix" 
              className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span>Run Analysis</span>
            </Link>
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors text-sm"
            >
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>View All Assets</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
