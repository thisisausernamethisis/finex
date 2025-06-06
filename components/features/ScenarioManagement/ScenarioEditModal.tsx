'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Clock, Target, TrendingUp, AlertTriangle } from 'lucide-react';
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
  impactFactors?: string[];
  confidence?: number;
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
    probability: scenario.probability || 0.5,
    type: scenario.type || 'TECHNOLOGY',
    timeline: scenario.timeline || '',
    isPublic: scenario.isPublic,
    confidence: scenario.confidence || 0.7
  });
  
  const [impactFactors, setImpactFactors] = useState<string[]>(scenario.impactFactors || []);
  const [newFactor, setNewFactor] = useState('');

  const addImpactFactor = () => {
    if (!newFactor.trim()) return;
    setImpactFactors([...impactFactors, newFactor.trim()]);
    setNewFactor('');
  };

  const removeImpactFactor = (index: number) => {
    setImpactFactors(impactFactors.filter((_, i) => i !== index));
  };

  const getProbabilityLabel = (prob: number) => {
    if (prob <= 0.2) return 'Very Low';
    if (prob <= 0.4) return 'Low';
    if (prob <= 0.6) return 'Medium';
    if (prob <= 0.8) return 'High';
    return 'Very High';
  };

  const getScenarioTypeColor = (type: string) => {
    switch (type) {
      case 'TECHNOLOGY': return 'bg-blue-100 text-blue-800';
      case 'ECONOMIC': return 'bg-green-100 text-green-800';
      case 'GEOPOLITICAL': return 'bg-red-100 text-red-800';
      case 'REGULATORY': return 'bg-purple-100 text-purple-800';
      case 'MARKET': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSave = async () => {
    if (!editedScenario.name.trim()) return;
    
    setSaving(true);
    try {
      const token = await getToken();
      
      // Build request body with only defined fields
      const requestBody: any = {
        name: editedScenario.name,
        probability: editedScenario.probability,
        type: editedScenario.type,
        isPublic: editedScenario.isPublic,
        confidence: editedScenario.confidence,
        impactFactors
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Edit Scenario
          </DialogTitle>
          <DialogDescription>
            Define scenario parameters for comprehensive impact analysis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Scenario Name *</Label>
                <Input
                  id="edit-name"
                  value={editedScenario.name}
                  onChange={(e) => setEditedScenario({ ...editedScenario, name: e.target.value })}
                  placeholder="e.g., AI Regulation Tightening"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editedScenario.description}
                  onChange={(e) => setEditedScenario({ ...editedScenario, description: e.target.value })}
                  placeholder="Describe the scenario, its triggers, and potential outcomes..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Scenario Type</Label>
                  <Select 
                    value={editedScenario.type} 
                    onValueChange={(value) => setEditedScenario({ ...editedScenario, type: value as keyof typeof ScenarioType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                      <SelectItem value="ECONOMIC">Economic</SelectItem>
                      <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
                      <SelectItem value="REGULATORY">Regulatory</SelectItem>
                      <SelectItem value="MARKET">Market</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={`text-xs mt-1 ${getScenarioTypeColor(editedScenario.type)}`}>
                    {editedScenario.type}
                  </Badge>
                </div>

                <div>
                  <Label htmlFor="edit-timeline">Timeline</Label>
                  <Input
                    id="edit-timeline"
                    value={editedScenario.timeline}
                    onChange={(e) => setEditedScenario({ ...editedScenario, timeline: e.target.value })}
                    placeholder="e.g., 2-3 years, Q2 2025"
                  />
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    When this scenario might occur
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Probability & Confidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Probability Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Probability of Occurrence</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{Math.round(editedScenario.probability * 100)}%</Badge>
                    <Badge variant="secondary">{getProbabilityLabel(editedScenario.probability)}</Badge>
                  </div>
                </div>
                <Slider
                  value={[editedScenario.probability]}
                  onValueChange={([value]) => setEditedScenario({ ...editedScenario, probability: value })}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0% (Never)</span>
                  <span>50% (Uncertain)</span>
                  <span>100% (Certain)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Assessment Confidence</Label>
                  <Badge variant="outline">{Math.round(editedScenario.confidence * 100)}% confident</Badge>
                </div>
                <Slider
                  value={[editedScenario.confidence]}
                  onValueChange={([value]) => setEditedScenario({ ...editedScenario, confidence: value })}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low confidence</span>
                  <span>High confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Impact Factors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add impact factor (e.g., supply chain disruption)"
                  value={newFactor}
                  onChange={(e) => setNewFactor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImpactFactor()}
                />
                <Button onClick={addImpactFactor} disabled={!newFactor.trim()}>
                  Add
                </Button>
              </div>
              
              {impactFactors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {impactFactors.map((factor, index) => (
                    <button
                      key={index}
                      onClick={() => removeImpactFactor(index)}
                      className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                    >
                      {factor} ×
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Add factors that this scenario would impact (click to remove)
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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