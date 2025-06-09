'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Save, X, Star } from 'lucide-react';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

interface WorkflowCard {
  id: string;
  title: string;
  content: string;
  importance: number;
  source?: string;
}

interface CardManagerProps {
  cards: WorkflowCard[];
  onAddCard: (assetId: string, themeId: string, card: CardFormData) => void;
  assetId: string;
  themeId: string;
  isAddingCard: boolean;
  onStartAddCard: () => void;
  onCancelAddCard: () => void;
}

interface CardFormData {
  title: string;
  content: string;
  importance: number;
  source: string;
}

export const CardManager = memo(function CardManager({
  cards,
  onAddCard,
  assetId,
  themeId,
  isAddingCard,
  onStartAddCard,
  onCancelAddCard
}: CardManagerProps) {
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState<CardFormData>({
    title: '',
    content: '',
    importance: 3,
    source: ''
  });

  const validateAndSubmit = () => {
    // Validate title
    if (!formData.title.trim()) {
      handleError(new Error('Card title is required'), {
        title: 'Validation Error',
        context: 'Card Creation'
      });
      return;
    }
    
    if (formData.title.length > 200) {
      handleError(new Error('Card title must not exceed 200 characters'), {
        title: 'Validation Error',
        context: 'Card Creation'
      });
      return;
    }
    
    // Validate content
    if (!formData.content.trim()) {
      handleError(new Error('Card content is required'), {
        title: 'Validation Error',
        context: 'Card Creation'
      });
      return;
    }
    
    if (formData.content.length > 10000) {
      handleError(new Error('Card content must not exceed 10,000 characters'), {
        title: 'Validation Error',
        context: 'Card Creation'
      });
      return;
    }
    
    // Validate source
    if (formData.source && formData.source.length > 500) {
      handleError(new Error('Source must not exceed 500 characters'), {
        title: 'Validation Error',
        context: 'Card Creation'
      });
      return;
    }

    onAddCard(assetId, themeId, formData);
    handleReset();
  };

  const handleReset = () => {
    setFormData({ title: '', content: '', importance: 3, source: '' });
    onCancelAddCard();
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 4) return 'text-red-600';
    if (importance >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getImportanceLabel = (importance: number) => {
    if (importance >= 4) return 'High';
    if (importance >= 3) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-3">
      {/* Existing Cards */}
      {cards.length > 0 && (
        <div className="space-y-2">
          {cards.map((card) => (
            <div key={card.id} className="p-3 bg-muted/50 rounded-md border">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm">{card.title}</h5>
                <div className="flex items-center gap-1">
                  <Star className={`w-3 h-3 ${getImportanceColor(card.importance)}`} />
                  <span className={`text-xs ${getImportanceColor(card.importance)}`}>
                    {getImportanceLabel(card.importance)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {card.content}
              </p>
              {card.source && (
                <Badge variant="outline" className="text-xs">
                  {card.source}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Card Form */}
      {isAddingCard ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label htmlFor="card-title" className="block text-sm font-medium mb-1">
                Title *
              </label>
              <Input
                id="card-title"
                placeholder="Card title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={200}
                aria-describedby="card-title-counter"
              />
              <div 
                id="card-title-counter" 
                className="text-xs text-muted-foreground mt-1"
              >
                {formData.title.length}/200 characters
              </div>
            </div>
            
            <div>
              <label htmlFor="card-content" className="block text-sm font-medium mb-1">
                Content *
              </label>
              <Textarea
                id="card-content"
                placeholder="Card content, research notes, or data points"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                maxLength={10000}
                rows={4}
                aria-describedby="card-content-counter"
              />
              <div 
                id="card-content-counter" 
                className="text-xs text-muted-foreground mt-1"
              >
                {formData.content.length}/10,000 characters
              </div>
            </div>
            
            <div>
              <label htmlFor="card-importance" className="block text-sm font-medium mb-1">
                Importance (1-5)
              </label>
              <select
                id="card-importance"
                value={formData.importance}
                onChange={(e) => setFormData(prev => ({ ...prev, importance: parseInt(e.target.value) }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Below Average</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Critical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="card-source" className="block text-sm font-medium mb-1">
                Source
              </label>
              <Input
                id="card-source"
                placeholder="Source URL, document, or reference (optional)"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                maxLength={500}
                aria-describedby="card-source-counter"
              />
              <div 
                id="card-source-counter" 
                className="text-xs text-muted-foreground mt-1"
              >
                {formData.source.length}/500 characters
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={validateAndSubmit} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Add Card
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
          onClick={onStartAddCard}
          className="w-full border-dashed"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      )}
    </div>
  );
});