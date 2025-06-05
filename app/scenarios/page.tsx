'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Search, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Scenario {
  id: string;
  name: string;
  description?: string;
  probability?: number;
  type?: 'TECHNOLOGY' | 'ECONOMIC' | 'GEOPOLITICAL';
  timeline?: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedScenarios {
  items: Scenario[];
  total: number;
  hasMore: boolean;
}

export default function ScenariosPage() {
  const { getToken } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    probability: 0.5,
    type: 'TECHNOLOGY' as const,
    timeline: ''
  });

  const loadScenarios = async () => {
    try {
      const token = await getToken();
      const url = new URL('/api/scenarios', window.location.origin);
      
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: PaginatedScenarios = await response.json();
        setScenarios(data.items);
      } else {
        console.error('Failed to load scenarios');
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!newScenario.name.trim()) return;
    
    setCreating(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newScenario.name,
          description: newScenario.description || undefined,
          probability: newScenario.probability,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewScenario({ name: '', description: '', probability: 0.5, type: 'TECHNOLOGY', timeline: '' });
        loadScenarios(); // Reload scenarios
      } else {
        console.error('Failed to create scenario');
      }
    } catch (error) {
      console.error('Error creating scenario:', error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [searchTerm]);

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'TECHNOLOGY': return 'bg-blue-100 text-blue-800';
      case 'ECONOMIC': return 'bg-green-100 text-green-800';
      case 'GEOPOLITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'text-gray-500';
    if (probability < 0.3) return 'text-red-500';
    if (probability < 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Scenarios</h1>
            <p className="text-muted-foreground">
              Manage future scenarios and their impact on your portfolio
            </p>
          </div>
          
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Scenario
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Scenario</CardTitle>
              <CardDescription>
                Define a future scenario to analyze its impact on your assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Scenario Name</Label>
                  <Input
                    id="name"
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    placeholder="e.g., AI Regulation Wave"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newScenario.description}
                    onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                    placeholder="Describe the scenario in detail..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="probability">Probability ({Math.round(newScenario.probability * 100)}%)</Label>
                  <input
                    type="range"
                    id="probability"
                    min="0"
                    max="1"
                    step="0.05"
                    value={newScenario.probability}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewScenario({ ...newScenario, probability: parseFloat(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={createScenario} disabled={creating || !newScenario.name.trim()}>
                    {creating ? 'Creating...' : 'Create Scenario'}
                  </Button>
                  <Button onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Scenarios Grid */}
        {scenarios.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scenarios yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first scenario to start analyzing future impacts
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Scenario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    {scenario.type && (
                      <Badge className={getTypeColor(scenario.type)}>
                        {scenario.type}
                      </Badge>
                    )}
                  </div>
                  {scenario.description && (
                    <CardDescription className="line-clamp-2">
                      {scenario.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {scenario.probability !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Probability:</span>
                        <span className={`font-medium ${getProbabilityColor(scenario.probability)}`}>
                          {Math.round(scenario.probability * 100)}%
                        </span>
                      </div>
                    )}
                    
                    {scenario.timeline && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Timeline:</span>
                        <span className="text-sm flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {scenario.timeline}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                      <span>Created</span>
                      <span>{new Date(scenario.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 