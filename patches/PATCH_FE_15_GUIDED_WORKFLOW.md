# PATCH FE-15: Guided 4-Phase Workflow Implementation

**Priority**: CRITICAL  
**Effort**: 4 days  
**Dependencies**: Current navigation system  
**Target Alignment**: Frontend Ground Truth compliance for user workflow

---

## 🎯 Objective

Transform the current tab-based navigation into a guided sequential workflow that clearly indicates the 4-phase progression: Asset Research → Scenario Planning → Matrix Generation → Strategic Analysis.

---

## 📋 Current State Analysis

### **Current Navigation Implementation** 
`components/Navigation.tsx` provides basic tab navigation:
- Assets, Scenarios, Matrix tabs
- No phase indicators or progression guidance
- Users can jump between tabs randomly
- No workflow state management

### **Missing Ground Truth Requirements**
- "4-phase workflow clearly indicated in UI"  
- "Phase indicators in navigation (1/2/3/4)"
- "Progress tracking for each phase"
- "Clear next steps and recommendations"

---

## 🛠️ Implementation Specification

### **File Changes Required**

#### **1. Enhanced Navigation (`components/Navigation.tsx`)**

**Current Structure:**
```typescript
const navItems: NavItem[] = [
  { href: '/assets', label: 'Assets', icon: Users },
  { href: '/scenarios', label: 'Scenarios', icon: Map },
  { href: '/matrix', label: 'Matrix', icon: Grid3X3 }
];
```

**New Structure:**
```typescript
const workflowPhases: WorkflowPhase[] = [
  { 
    phase: 1,
    href: '/assets', 
    label: 'Asset Research', 
    icon: Users,
    description: 'Define assets and build profiles',
    requiredForNext: ['hasAssets', 'hasThemes']
  },
  { 
    phase: 2,
    href: '/scenarios', 
    label: 'Scenario Planning', 
    icon: Map,
    description: 'Create future scenarios to test',
    requiredForNext: ['hasScenarios', 'hasProbabilities']
  },
  { 
    phase: 3,
    href: '/matrix', 
    label: 'Matrix Generation', 
    icon: Grid3X3,
    description: 'AI-powered impact analysis',
    requiredForNext: ['matrixComplete']
  },
  { 
    phase: 4,
    href: '/dashboard', 
    label: 'Strategic Analysis', 
    icon: Target,
    description: 'Portfolio insights and recommendations',
    requiredForNext: []
  }
];
```

**Enhanced Navigation Features:**
- Phase numbers (1, 2, 3, 4) prominently displayed
- Progress indicators showing completion status
- Phase descriptions on hover/mobile
- Visual connection lines between phases
- Disable future phases until prerequisites met

#### **2. Workflow Context (`lib/hooks/workflow.ts`)**

```typescript
interface WorkflowState {
  currentPhase: number;
  completedPhases: number[];
  phaseProgress: {
    [key: number]: {
      completed: boolean;
      progress: number; // 0-100
      requirements: string[];
      completedRequirements: string[];
    }
  };
  canAccessPhase: (phase: number) => boolean;
  markPhaseComplete: (phase: number) => void;
  getNextRecommendation: () => string;
}

export function useWorkflow(): WorkflowState {
  // Implementation with localStorage persistence
  // Real-time calculation of phase progress
  // Integration with existing React Query hooks
}
```

**Workflow Logic:**
- Phase 1: Complete when user has ≥1 asset with ≥1 theme
- Phase 2: Complete when user has ≥1 scenario with probability set
- Phase 3: Complete when matrix has ≥1 calculated result
- Phase 4: Always accessible once Phase 3 complete

#### **3. Progress Indicator Component (`components/workflow/WorkflowProgress.tsx`)**

```typescript
interface WorkflowProgressProps {
  currentPhase: number;
  completedPhases: number[];
  onPhaseClick: (phase: number) => void;
  canAccessPhase: (phase: number) => boolean;
}

export function WorkflowProgress({ 
  currentPhase, 
  completedPhases, 
  onPhaseClick,
  canAccessPhase 
}: WorkflowProgressProps) {
  return (
    <div className="workflow-progress">
      {[1, 2, 3, 4].map(phase => (
        <WorkflowPhaseIndicator
          key={phase}
          phase={phase}
          isActive={currentPhase === phase}
          isCompleted={completedPhases.includes(phase)}
          canAccess={canAccessPhase(phase)}
          onClick={() => onPhaseClick(phase)}
        />
      ))}
    </div>
  );
}
```

**Visual Design:**
- Circular phase indicators with numbers
- Progress lines connecting phases
- Checkmarks for completed phases
- Grayed out/disabled for inaccessible phases
- Green for completed, blue for active, gray for pending

#### **4. Phase Completion Banner (`components/workflow/PhaseCompletionBanner.tsx`)**

```typescript
interface PhaseCompletionBannerProps {
  phase: number;
  nextPhaseLabel: string;
  onContinue: () => void;
}

export function PhaseCompletionBanner({
  phase,
  nextPhaseLabel,
  onContinue
}: PhaseCompletionBannerProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">
            Phase {phase} Complete!
          </h3>
          <p className="text-sm text-green-700">
            Ready to move to {nextPhaseLabel}
          </p>
        </div>
        <Button
          onClick={onContinue}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Continue to Phase {phase + 1}
        </Button>
      </div>
    </div>
  );
}
```

#### **5. Dashboard Integration (`app/dashboard/page.tsx`)**

**Add Workflow Overview Section:**
```typescript
// Add to existing dashboard
<div className="workflow-overview mb-8">
  <h2 className="text-2xl font-bold mb-4">Workflow Progress</h2>
  <WorkflowProgress 
    currentPhase={workflow.currentPhase}
    completedPhases={workflow.completedPhases}
    onPhaseClick={navigateToPhase}
    canAccessPhase={workflow.canAccessPhase}
  />
  
  {workflow.getNextRecommendation() && (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <p className="text-blue-800">{workflow.getNextRecommendation()}</p>
    </div>
  )}
</div>
```

---

## 🎨 Visual Design Specifications

### **Navigation Enhancement**
- Phase numbers in colored circles (indigo gradient)
- Progress bar connecting phases
- Phase labels with subtle descriptions
- Hover states showing requirements
- Mobile-optimized vertical layout

### **Color Scheme**
- **Active Phase**: Indigo/Blue (#4F46E5)
- **Completed Phase**: Green (#059669)  
- **Pending Phase**: Gray (#6B7280)
- **Locked Phase**: Light Gray (#D1D5DB)

### **Typography**
- Phase numbers: Bold, 16px
- Phase labels: Medium, 14px
- Descriptions: Regular, 12px, muted
- Progress text: Regular, 13px

---

## 📱 Responsive Design

### **Desktop (≥1024px)**
- Horizontal navigation with phase indicators
- Full phase descriptions visible
- Connected progress line
- Hover tooltips for additional context

### **Tablet (768px - 1023px)**
- Horizontal navigation with abbreviated labels
- Phase numbers prominently displayed
- Collapsible descriptions
- Touch-friendly interaction areas

### **Mobile (≤767px)**
- Vertical stepper-style navigation
- Swipe gesture support
- Current phase prominently highlighted
- Compact progress indicators

---

## 🔄 Workflow State Management

### **Phase Completion Triggers**

**Phase 1 (Asset Research):**
- Has at least 1 asset: `assets.length >= 1`
- Has at least 1 theme: `themes.length >= 1`
- Progress: `(assetCount + themeCount) / 4 * 100`

**Phase 2 (Scenario Planning):**
- Has at least 1 scenario: `scenarios.length >= 1`
- Has probability set: `scenarios.some(s => s.probability > 0)`
- Progress: `(scenarioCount + probabilityCount) / 4 * 100`

**Phase 3 (Matrix Generation):**
- Matrix calculation started: `matrixJobs.length > 0`
- Has completed calculations: `completedCalculations.length > 0`
- Progress: `completedCalculations.length / totalPossibleCalculations * 100`

**Phase 4 (Strategic Analysis):**
- Unlocked when Phase 3 complete
- Progress based on analysis views accessed
- Always accessible once prerequisites met

### **Persistence Strategy**
- Store workflow state in localStorage
- Sync with server for user preferences
- Real-time updates when data changes
- Fallback to calculation if state corrupted

---

## 🧪 Testing Requirements

### **Unit Tests**
- Workflow state calculation logic
- Phase completion detection
- Navigation permission logic
- Progress calculation accuracy

### **Integration Tests**
- Navigation flow between phases
- State persistence across sessions
- Real-time progress updates
- Mobile responsive behavior

### **E2E Tests**
- Complete 4-phase workflow walkthrough
- Phase completion triggers
- Navigation restrictions
- Progress indicator accuracy

---

## 📈 Success Metrics

### **User Experience**
- **Time to first matrix**: Reduce by 40% through guided flow
- **Phase completion rate**: >80% reach Phase 3
- **User confusion metrics**: <10% support requests about workflow
- **Mobile usage**: Maintain current mobile engagement

### **Technical Performance**
- **State calculation**: <50ms for workflow state update
- **Navigation rendering**: <100ms for phase indicator updates
- **Memory usage**: <5MB for workflow state management
- **Bundle size**: <20KB added for workflow components

---

## 🔧 Implementation Steps

### **Day 1: Foundation**
1. Create workflow context and hooks
2. Implement basic phase completion logic
3. Add phase indicators to navigation
4. Test workflow state calculation

### **Day 2: Visual Enhancement**
1. Design and implement progress indicators
2. Add phase completion banners
3. Style navigation with workflow guidance
4. Test responsive design

### **Day 3: Integration**
1. Integrate workflow with dashboard
2. Add real-time progress updates
3. Implement phase-specific recommendations
4. Test cross-page state management

### **Day 4: Polish & Testing**
1. Complete E2E testing
2. Optimize performance
3. Add error handling and fallbacks
4. Final UI/UX refinements

---

## 🎯 Post-Implementation Validation

### **Functionality Checklist**
- [ ] Phase indicators visible in navigation
- [ ] Progress tracking works across pages
- [ ] Phase completion triggers correctly
- [ ] Navigation restrictions enforced
- [ ] Mobile responsive design maintained
- [ ] State persists across sessions
- [ ] Real-time updates when data changes
- [ ] Recommendations guide user actions

### **Ground Truth Compliance**
- [ ] "4-phase workflow clearly indicated in UI" ✓
- [ ] "Phase indicators in navigation (1/2/3/4)" ✓
- [ ] "Progress tracking for each phase" ✓
- [ ] "Clear next steps and recommendations" ✓
- [ ] "Workflow navigation prevents skipping phases" ✓

**Expected Impact**: Frontend alignment improvement from 6.5/10 to 8.5/10 (+2.0 points) 