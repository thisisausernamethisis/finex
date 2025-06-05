'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@clerk/nextjs';

// Scenario Type Enum (matches Prisma schema)
const ScenarioType = {
  TECHNOLOGY: 'TECHNOLOGY',
  ECONOMIC: 'ECONOMIC',
  GEOPOLITICAL: 'GEOPOLITICAL',
  REGULATORY: 'REGULATORY',
  MARKET: 'MARKET'
} as const;

interface Scenario {
  id: string;
  name: string;
  description?: string;
  probability?: number;
  type?: keyof typeof ScenarioType;
  timeline?: string;
  isPublic: boolean;
}

interface ScenarioEditModalProps {
  scenario: Scenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function ScenarioEditModal({ scenario, open, onOpenChange, onSave }: ScenarioEditModalProps) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [editedScenario, setEditedScenario] = useState({
    name: scenario.name,
    description: scenario.description || '',
    probability: scenario.probability?.toString() || '0.5',
    type: scenario.type || 'TECHNOLOGY',
    timeline: scenario.timeline || '',
    isPublic: scenario.isPublic
  });

  const handleSave = async () => {
    if (!editedScenario.name.trim()) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      
      // Build request body with only defined fields
      const requestBody: any = {
        name: editedScenario.name,
        probability: parseFloat(editedScenario.probability),
        type: editedScenario.type,
        isPublic: editedScenario.isPublic,
      };
      
      if (editedScenario.description) requestBody.description = editedScenario.description;
      if (editedScenario.timeline) requestBody.timeline = editedScenario.timeline;
      
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
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
        console.error('Failed to update scenario');
      }
    } catch (error) {
      console.error('Error updating scenario:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Scenario</DialogTitle>
          <DialogDescription>
            Make changes to your scenario information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-name">Scenario Name *</Label>
            <Input
              id="edit-name"
              value={editedScenario.name}
              onChange={(e) => setEditedScenario({ ...editedScenario, name: e.target.value })}
              placeholder="e.g., AI Regulation Impact"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={editedScenario.description}
              onChange={(e) => setEditedScenario({ ...editedScenario, description: e.target.value })}
              placeholder="Describe the scenario..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-probability">Probability (0.0 - 1.0)</Label>
            <Input
              id="edit-probability"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={editedScenario.probability}
              onChange={(e) => setEditedScenario({ ...editedScenario, probability: e.target.value })}
              placeholder="e.g., 0.7"
            />
          </div>

          <div>
            <Label htmlFor="edit-type">Scenario Type</Label>
            <select
              id="edit-type"
              value={editedScenario.type}
              onChange={(e) => setEditedScenario({ ...editedScenario, type: e.target.value as keyof typeof ScenarioType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TECHNOLOGY">Technology</option>
              <option value="ECONOMIC">Economic</option>
              <option value="GEOPOLITICAL">Geopolitical</option>
              <option value="REGULATORY">Regulatory</option>
              <option value="MARKET">Market</option>
            </select>
          </div>

          <div>
            <Label htmlFor="edit-timeline">Timeline</Label>
            <Input
              id="edit-timeline"
              value={editedScenario.timeline}
              onChange={(e) => setEditedScenario({ ...editedScenario, timeline: e.target.value })}
              placeholder="e.g., 2-3 years, Q2 2025"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit-isPublic"
              checked={editedScenario.isPublic}
              onChange={(e) => setEditedScenario({ ...editedScenario, isPublic: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="edit-isPublic">Make scenario public</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !editedScenario.name.trim()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 