'use client';

import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AssetCreationFormProps {
  onSubmit: (asset: { name: string; description: string; growthValue: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface AssetFormData {
  name: string;
  description: string;
  growthValue: string;
}

export const AssetCreationForm = memo(function AssetCreationForm({
  onSubmit,
  onCancel,
  isLoading = false
}: AssetCreationFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    description: '',
    growthValue: ''
  });

  const validateAndSubmit = () => {
    // Validate name
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Asset name is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.name.length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Asset name must not exceed 100 characters',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate description
    if (formData.description && formData.description.length > 1000) {
      toast({
        title: 'Validation Error',
        description: 'Description must not exceed 1,000 characters',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate growth value
    if (formData.growthValue) {
      const growthNum = parseFloat(formData.growthValue);
      if (isNaN(growthNum) || growthNum < 0 || growthNum > 1000000) {
        toast({
          title: 'Validation Error',
          description: 'Growth value must be a number between 0 and 1,000,000',
          variant: 'destructive',
        });
        return;
      }
    }

    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({ name: '', description: '', growthValue: '' });
    onCancel();
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Create New Asset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="asset-name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <Input
            id="asset-name"
            placeholder="Asset name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            maxLength={100}
            disabled={isLoading}
            aria-describedby="name-counter"
          />
          <div 
            id="name-counter" 
            className="text-xs text-muted-foreground mt-1"
          >
            {formData.name.length}/100 characters
          </div>
        </div>
        
        <div>
          <label htmlFor="asset-description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            id="asset-description"
            placeholder="Asset description (optional)"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            maxLength={1000}
            disabled={isLoading}
            aria-describedby="description-counter"
          />
          <div 
            id="description-counter" 
            className="text-xs text-muted-foreground mt-1"
          >
            {formData.description.length}/1,000 characters
          </div>
        </div>
        
        <div>
          <label htmlFor="asset-growth" className="block text-sm font-medium mb-1">
            Growth Value
          </label>
          <Input
            id="asset-growth"
            placeholder="Growth value (optional)"
            type="number"
            value={formData.growthValue}
            onChange={(e) => setFormData(prev => ({ ...prev, growthValue: e.target.value }))}
            min="0"
            max="1000000"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={validateAndSubmit} 
            className="flex-1"
            disabled={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Creating...' : 'Create Asset'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});