'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Layers, Save, X } from 'lucide-react';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

interface WorkflowTheme {
  id: string;
  name: string;
  description?: string;
  category: string;
  cards: any[];
}

interface ThemeManagerProps {
  themes: WorkflowTheme[];
  onAddTheme: (assetId: string, theme: { name: string; description: string; category: string }) => void;
  assetId: string;
  isAddingTheme: boolean;
  onStartAddTheme: () => void;
  onCancelAddTheme: () => void;
}

interface ThemeFormData {
  name: string;
  description: string;
  category: string;
}

export const ThemeManager = memo(function ThemeManager({
  themes,
  onAddTheme,
  assetId,
  isAddingTheme,
  onStartAddTheme,
  onCancelAddTheme
}: ThemeManagerProps) {
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState<ThemeFormData>({
    name: '',
    description: '',
    category: 'Market Analysis'
  });

  const validateAndSubmit = () => {
    // Validate name
    if (!formData.name.trim()) {
      handleError(new Error('Theme name is required'), {
        title: 'Validation Error',
        context: 'Theme Creation'
      });
      return;
    }
    
    if (formData.name.length > 100) {
      handleError(new Error('Theme name must not exceed 100 characters'), {
        title: 'Validation Error',
        context: 'Theme Creation'
      });
      return;
    }
    
    // Validate description
    if (formData.description && formData.description.length > 500) {
      handleError(new Error('Description must not exceed 500 characters'), {
        title: 'Validation Error',
        context: 'Theme Creation'
      });
      return;
    }

    onAddTheme(assetId, formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({ name: '', description: '', category: 'Market Analysis' });
    onCancelAddTheme();
  };

  const categoryOptions = [
    'Market Analysis',
    'Technology Assessment', 
    'Financial Data',
    'Risk Factors',
    'Competitive Intelligence',
    'Regulatory Environment',
    'Strategic Positioning'
  ];

  return (
    <div className="space-y-3">
      {/* Existing Themes */}
      {themes.length > 0 && (
        <div className="space-y-2">
          {themes.map((theme) => (
            <div key={theme.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="font-medium">{theme.name}</span>
                <Badge variant="outline" className="text-xs">
                  {theme.category}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {theme.cards?.length || 0} cards
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Theme Form */}
      {isAddingTheme ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label htmlFor="theme-name" className="block text-sm font-medium mb-1">
                Theme Name *
              </label>
              <Input
                id="theme-name"
                placeholder="Theme name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={100}
                aria-describedby="theme-name-counter"
              />
              <div 
                id="theme-name-counter" 
                className="text-xs text-muted-foreground mt-1"
              >
                {formData.name.length}/100 characters
              </div>
            </div>
            
            <div>
              <label htmlFor="theme-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="theme-description"
                placeholder="Theme description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                maxLength={500}
                aria-describedby="theme-description-counter"
              />
              <div 
                id="theme-description-counter" 
                className="text-xs text-muted-foreground mt-1"
              >
                {formData.description.length}/500 characters
              </div>
            </div>
            
            <div>
              <label htmlFor="theme-category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                id="theme-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={validateAndSubmit} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Add Theme
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          onClick={onStartAddTheme}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Theme
        </Button>
      )}
    </div>
  );
});