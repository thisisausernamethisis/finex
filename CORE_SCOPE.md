# CORE SCOPE DEFINITION

## What Finex v3 IS

**ONLY these 4 core functions:**

1. **Asset Management**: Add/remove/edit Assets with nested Themes and Cards
2. **Scenario Management**: Add/remove/edit Scenarios with nested Themes and Cards  
3. **Matrix Impact Analysis**: AI scoring (-5 to +5) for Asset × Scenario intersections
4. **TAM Integration**: Basic Total Addressable Market fields for assets (future implementation)

## What Finex v3 is NOT

**ELIMINATED from scope - DO NOT implement or reference:**

❌ "Strategic insights" beyond basic matrix display  
❌ "Portfolio intelligence" or "portfolio analysis"  
❌ "Advanced analytics" or "enhanced intelligence"  
❌ "Scenario correlation" or "cross-scenario relationships"  
❌ "Cascading effects" or "second-order impacts"  
❌ "Historical validation" or "backtesting"  
❌ "Portfolio optimization" or "strategic recommendations"  
❌ "Risk analysis" beyond basic impact scoring  
❌ "Concentration risk" or "diversification analysis"  
❌ "Network effects" or "correlation analysis"  

## Core User Workflow

1. **Assets Tab**: Create assets → Add themes → Add research cards
2. **Scenarios Tab**: Create scenarios → Add themes → Add evidence cards  
3. **Matrix Tab**: View Asset × Scenario grid with AI impact scores

**That's it. Nothing more.**

## For AI Agents

When working on this project:
- ✅ ONLY implement CRUD operations for Assets/Scenarios/Themes/Cards
- ✅ ONLY work on basic matrix impact scoring 
- ✅ ONLY add TAM fields if explicitly requested
- ❌ DO NOT add any "advanced", "strategic", "intelligent", or "analytical" features
- ❌ DO NOT reference portfolio optimization, correlation, or intelligence features
- ❌ DO NOT implement anything beyond the 4 core functions listed above

**This scope definition overrides all other documentation that mentions advanced features.**