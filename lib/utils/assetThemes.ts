import { Asset } from '@/lib/hooks/assets';
import { Brain, Bot, Atom, Building, HelpCircle, Cpu, DollarSign, Globe } from 'lucide-react';
import { ComponentType } from 'react';

export interface AssetTheme {
  id: string;
  name: string;
  assets: Asset[];
  confidence: number;
  color: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export interface ThemeConfig {
  name: string;
  color: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  keywords: string[];
}

const THEME_CONFIG: Record<string, ThemeConfig> = {
  ai: {
    name: 'Artificial Intelligence',
    color: 'blue',
    icon: Brain,
    description: 'AI and machine learning technologies',
    keywords: ['ai', 'artificial', 'intelligence', 'machine learning', 'neural', 'deep learning', 'nlp', 'llm', 'openai', 'nvidia', 'anthropic']
  },
  robotics: {
    name: 'Robotics & Automation',
    color: 'green',
    icon: Bot,
    description: 'Physical AI and automation systems',
    keywords: ['robot', 'automation', 'tesla', 'manufacturing', 'autonomous', 'drone', 'industrial', 'mechanics']
  },
  quantum: {
    name: 'Quantum Computing',
    color: 'purple',
    icon: Atom,
    description: 'Quantum computing and cryptography',
    keywords: ['quantum', 'computing', 'cryptography', 'ionq', 'qubits', 'superposition', 'entanglement']
  },
  software: {
    name: 'Software & Cloud',
    color: 'indigo',
    icon: Cpu,
    description: 'Software companies and cloud services',
    keywords: ['software', 'cloud', 'saas', 'microsoft', 'google', 'amazon', 'platform', 'enterprise']
  },
  fintech: {
    name: 'Financial Technology',
    color: 'emerald',
    icon: DollarSign,
    description: 'Financial services and fintech',
    keywords: ['fintech', 'financial', 'payment', 'banking', 'crypto', 'blockchain', 'defi', 'trading']
  },
  traditional: {
    name: 'Traditional Technology',
    color: 'gray',
    icon: Building,
    description: 'Established technology companies',
    keywords: ['traditional', 'legacy', 'enterprise', 'infrastructure', 'hardware', 'telecommunications']
  },
  uncategorized: {
    name: 'Uncategorized',
    color: 'orange',
    icon: HelpCircle,
    description: 'Assets pending categorization',
    keywords: []
  }
};

export function getThemeMetadata(themeId: string): ThemeConfig {
  return THEME_CONFIG[themeId] || THEME_CONFIG.uncategorized;
}

export function categorizeAsset(asset: Asset): string {
  // Categorize based on name and description
  const searchText = `${asset.name} ${asset.description || ''}`.toLowerCase();
  
  // Check each theme's keywords
  for (const [themeId, config] of Object.entries(THEME_CONFIG)) {
    if (themeId === 'uncategorized') continue;
    
    const hasKeyword = config.keywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      return themeId;
    }
  }
  
  return 'uncategorized';
}

export function organizeAssetsByTheme(assets: Asset[]): AssetTheme[] {
  // Group assets by theme
  const themeGroups: Record<string, Asset[]> = {};
  
  assets.forEach(asset => {
    const themeId = categorizeAsset(asset);
    if (!themeGroups[themeId]) {
      themeGroups[themeId] = [];
    }
    themeGroups[themeId].push(asset);
  });
  
  // Convert to AssetTheme objects and calculate confidence
  const themes: AssetTheme[] = [];
  
  Object.entries(themeGroups).forEach(([themeId, themeAssets]) => {
    const config = getThemeMetadata(themeId);
    
    // Set default confidence for theme
    const avgConfidence = 0.8; // Default confidence since we removed categorization
    
    themes.push({
      id: themeId,
      name: config.name,
      assets: themeAssets.sort((a, b) => a.name.localeCompare(b.name)),
      confidence: avgConfidence,
      color: config.color,
      icon: config.icon,
      description: config.description
    });
  });
  
  // Sort themes: most assets first, then by name
  return themes.sort((a, b) => {
    if (a.assets.length !== b.assets.length) {
      return b.assets.length - a.assets.length;
    }
    return a.name.localeCompare(b.name);
  });
}

export function getThemeColorClasses(color: string) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    blue: { 
      bg: 'bg-blue-100 dark:bg-blue-900/20', 
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500'
    },
    green: { 
      bg: 'bg-green-100 dark:bg-green-900/20', 
      text: 'text-green-600 dark:text-green-400',
      ring: 'ring-green-500'
    },
    purple: { 
      bg: 'bg-purple-100 dark:bg-purple-900/20', 
      text: 'text-purple-600 dark:text-purple-400',
      ring: 'ring-purple-500'
    },
    indigo: { 
      bg: 'bg-indigo-100 dark:bg-indigo-900/20', 
      text: 'text-indigo-600 dark:text-indigo-400',
      ring: 'ring-indigo-500'
    },
    emerald: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/20', 
      text: 'text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500'
    },
    gray: { 
      bg: 'bg-gray-100 dark:bg-gray-900/20', 
      text: 'text-gray-600 dark:text-gray-400',
      ring: 'ring-gray-500'
    },
    orange: { 
      bg: 'bg-orange-100 dark:bg-orange-900/20', 
      text: 'text-orange-600 dark:text-orange-400',
      ring: 'ring-orange-500'
    }
  };
  
  return colorMap[color] || colorMap.gray;
} 