'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@clerk/nextjs';

// Technology Category Enum (matches Prisma schema)
const TechnologyCategory = {
  AI_COMPUTE: 'AI_COMPUTE',
  ROBOTICS_PHYSICAL_AI: 'ROBOTICS_PHYSICAL_AI', 
  QUANTUM_COMPUTING: 'QUANTUM_COMPUTING',
  TRADITIONAL_TECH: 'TRADITIONAL_TECH',
  BIOTECH_HEALTH: 'BIOTECH_HEALTH',
  FINTECH_CRYPTO: 'FINTECH_CRYPTO',
  ENERGY_CLEANTECH: 'ENERGY_CLEANTECH',
  SPACE_DEFENSE: 'SPACE_DEFENSE',
  OTHER: 'OTHER'
} as const;

interface Asset {
  id: string;
  name: string;
  description?: string;
  category?: keyof typeof TechnologyCategory;
  categoryConfidence?: number;
  categoryInsights?: any;
  isPublic: boolean;
}

interface AssetEditModalProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function AssetEditModal({ asset, open, onOpenChange, onSave }: AssetEditModalProps) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editedAsset, setEditedAsset] = useState({
    name: asset.name,
    description: asset.description || '',
    category: asset.category || '',
    categoryConfidence: asset.categoryConfidence?.toString() || '',
    isPublic: asset.isPublic
  });

  const handleSave = async () => {
    if (!editedAsset.name.trim()) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      
      // Build request body with only defined fields
      const requestBody: any = {
        name: editedAsset.name,
        isPublic: editedAsset.isPublic,
      };
      
      if (editedAsset.description) requestBody.description = editedAsset.description;
      if (editedAsset.category) requestBody.category = editedAsset.category;
      if (editedAsset.categoryConfidence) requestBody.categoryConfidence = parseFloat(editedAsset.categoryConfidence);
      
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        onOpenChange(false);
        onSave(); // Refresh the parent list
      } else {
        console.error('Failed to update asset');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Make changes to your asset information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-name">Asset Name *</Label>
            <Input
              id="edit-name"
              value={editedAsset.name}
              onChange={(e) => setEditedAsset({ ...editedAsset, name: e.target.value })}
              placeholder="e.g., NVIDIA Corporation"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={editedAsset.description}
              onChange={(e) => setEditedAsset({ ...editedAsset, description: e.target.value })}
              placeholder="Brief description of the asset..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="edit-category">Technology Category</Label>
            <select
              id="edit-category"
              value={editedAsset.category}
              onChange={(e) => setEditedAsset({ ...editedAsset, category: e.target.value as keyof typeof TechnologyCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="AI_COMPUTE">AI Compute</option>
              <option value="ROBOTICS_PHYSICAL_AI">Robotics & Physical AI</option>
              <option value="QUANTUM_COMPUTING">Quantum Computing</option>
              <option value="BIOTECH_HEALTH">Biotech & Health</option>
              <option value="FINTECH_CRYPTO">Fintech & Crypto</option>
              <option value="ENERGY_CLEANTECH">Energy & CleanTech</option>
              <option value="SPACE_DEFENSE">Space & Defense</option>
              <option value="TRADITIONAL_TECH">Traditional Tech</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {editedAsset.category && (
            <div>
              <Label htmlFor="edit-categoryConfidence">
                Category Confidence (0.0 - 1.0)
              </Label>
              <Input
                id="edit-categoryConfidence"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={editedAsset.categoryConfidence}
                onChange={(e) => setEditedAsset({ ...editedAsset, categoryConfidence: e.target.value })}
                placeholder="e.g., 0.8"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-isPublic"
              checked={editedAsset.isPublic}
              onChange={(e) => setEditedAsset({ ...editedAsset, isPublic: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="edit-isPublic">Make asset public</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !editedAsset.name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 