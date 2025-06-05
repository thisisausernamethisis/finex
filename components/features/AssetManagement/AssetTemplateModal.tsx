'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Asset {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

interface AssetTemplateModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function AssetTemplateModal({ asset, open, onOpenChange, onSave }: AssetTemplateModalProps) {
  const { getToken } = useAuth();
  const [creating, setCreating] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: `${asset.name} Template`,
    description: asset.description || '',
    templateDescription: '',
    tags: ''
  });

  const handleCreate = async () => {
    if (!templateData.name.trim()) return;
    
    setCreating(true);
    try {
      const token = await getToken();
      
      const requestBody = {
        name: templateData.name,
        description: templateData.description,
        templateDescription: templateData.templateDescription,
        tags: templateData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        sourceAssetId: asset.id,
        kind: 'TEMPLATE',
        category: asset.category,
        isPublic: true
      };
      
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        onOpenChange(false);
        onSave(); // Refresh the parent list
        setTemplateData({
          name: '',
          description: '',
          templateDescription: '',
          tags: ''
        });
      } else {
        console.error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Bookmark className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Turn this asset into a reusable template for others
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              value={templateData.name}
              onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              placeholder="e.g., AI Compute Investment Template"
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Asset Description</Label>
            <Textarea
              id="template-description"
              value={templateData.description}
              onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
              placeholder="Description of the underlying asset..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="template-usage">Template Usage Instructions</Label>
            <Textarea
              id="template-usage"
              value={templateData.templateDescription}
              onChange={(e) => setTemplateData({ ...templateData, templateDescription: e.target.value })}
              placeholder="How should others use this template? What scenarios is it best for?"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="template-tags">Tags (comma-separated)</Label>
            <Input
              id="template-tags"
              value={templateData.tags}
              onChange={(e) => setTemplateData({ ...templateData, tags: e.target.value })}
              placeholder="e.g., AI, growth, tech, template"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Templates are public by default and can be cloned by other users. 
              The original asset will remain private to you.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || !templateData.name.trim()}>
            {creating ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 