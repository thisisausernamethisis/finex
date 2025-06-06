# Patch 2: Route Protection Infrastructure

## Overview
Implements comprehensive route protection using Next.js (auth) route groups and enhances navigation with authentication awareness.

## Dependencies
- Patch 1 (React Query Setup)

## Estimated Effort
3-4 hours

## Risk Level
Medium (affects navigation and routing)

---

## Changes Required

### 1. Create Protected Route Group Layout

**File**: `app/(auth)/layout.tsx` (new file)
```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

### 2. Move Protected Pages to Auth Route Group

**File**: `app/(auth)/assets/page.tsx` (moved from `app/assets/page.tsx`)
```tsx
// Move entire content of app/assets/page.tsx to this location
// No code changes needed - just file move
```

**File**: `app/(auth)/scenarios/page.tsx` (moved from `app/scenarios/page.tsx`)
```tsx
// Move entire content of app/scenarios/page.tsx to this location
// No code changes needed - just file move
```

**File**: `app/(auth)/matrix/page.tsx` (moved from `app/matrix/page.tsx`)
```tsx
// Move entire content of app/matrix/page.tsx to this location
// No code changes needed - just file move
```

**File**: `app/(auth)/dashboard/page.tsx` (moved from `app/dashboard/page.tsx`)
```tsx
// Move entire content of app/dashboard/page.tsx to this location
// No code changes needed - just file move
```

### 3. Update Main Landing Page

**File**: `app/page.tsx`
```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link'
import { ArrowRight, Zap, Brain, Atom, BarChart3, Target, Lightbulb } from 'lucide-react'

export default async function Home() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect('/dashboard');
  }

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
                href="/sign-up"
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                href="/sign-in"
                className="flex items-center space-x-2 px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors font-medium"
              >
                <span>Sign In</span>
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
      
      {/* Rest of the existing landing page content... */}
      {/* (Include all existing sections but update CTAs to point to /sign-up) */}
    </div>
  )
}
```

### 4. Update Navigation Component

**File**: `components/Navigation.tsx`
```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { 
  Target, 
  Grid3X3, 
  Zap,
  Atom,
  User,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard
  },
  { 
    href: '/assets', 
    label: 'Assets', 
    icon: Target
  },
  { 
    href: '/scenarios', 
    label: 'Scenarios', 
    icon: Zap
  },
  { 
    href: '/matrix', 
    label: 'Matrix', 
    icon: Grid3X3
  }
];

export function Navigation() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Atom className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-foreground">MetaMap</span>
                <span className="text-xs text-muted-foreground -mt-1">Asset Management</span>
              </div>
            </Link>
          </div>

          {/* Main Navigation - Only show when signed in */}
          {isSignedIn && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link relative group ${isActive ? 'active' : ''}`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Menu or Auth Links */}
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.firstName || 'User'}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <SignOutButton>
                      <div className="flex items-center space-x-2 w-full">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </div>
                    </SignOutButton>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Only show when signed in */}
      {isSignedIn && (
        <div className="md:hidden border-t border-border/50">
          <div className="flex overflow-x-auto py-2 px-4 space-x-1 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center space-y-1 px-3 py-2 rounded-lg
                    text-xs font-medium whitespace-nowrap transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
```

---

## File Operations

### Files to Move
1. `app/assets/page.tsx` → `app/(auth)/assets/page.tsx`
2. `app/scenarios/page.tsx` → `app/(auth)/scenarios/page.tsx`
3. `app/matrix/page.tsx` → `app/(auth)/matrix/page.tsx`
4. `app/dashboard/page.tsx` → `app/(auth)/dashboard/page.tsx`

### Files to Delete
- Original files after confirming moves are successful

---

## Testing

### Manual Testing
1. **Unauthenticated Access**:
   - Visit `/assets`, `/scenarios`, `/matrix`, `/dashboard` 
   - Should redirect to `/sign-in`
   - Landing page at `/` should show sign-up/sign-in CTAs

2. **Authenticated Access**:
   - Sign in via Clerk
   - Should be able to access all protected routes
   - Navigation should show user menu with sign-out option
   - Landing page should redirect to `/dashboard`

3. **Navigation Flow**:
   - Test all navigation links
   - Verify active states work correctly
   - Test sign-out functionality

### Verification Checklist
- [ ] Unauthenticated users cannot access protected routes
- [ ] Authenticated users can access all protected routes
- [ ] Navigation updates based on auth state
- [ ] Sign-out functionality works
- [ ] Mobile navigation displays correctly
- [ ] All existing functionality remains intact

---

## Risk Mitigation

### Rollback Plan
1. Move files back to original locations
2. Revert `app/page.tsx` changes
3. Revert `components/Navigation.tsx` changes
4. Remove `app/(auth)/layout.tsx`

### Testing Strategy
- Test in incognito/private browsing mode to verify unauthenticated flow
- Test with multiple user accounts to verify auth isolation
- Verify all existing deep links still work after route restructuring

---

## Notes
- Next.js (auth) route groups don't affect URL structure - `/assets` still works as before
- Clerk's `auth()` function provides server-side authentication checking
- User menu uses Clerk's `SignOutButton` for proper session cleanup
- Mobile navigation is hidden for unauthenticated users to simplify the experience 