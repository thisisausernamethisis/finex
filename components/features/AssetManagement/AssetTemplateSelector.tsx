'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Eye, User, Calendar, ArrowRight, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Template {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  tags: string[];
  usageCount: number;
}

interface AssetTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onCreateFromScratch: () => void;
}

export function AssetTemplateSelector({ 
  isOpen, 
  onClose, 
  onSelectTemplate,
  onCreateFromScratch
}: AssetTemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { getToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const url = new URL('/api/theme-templates', window.location.origin);
      if (search) url.searchParams.set('q', search);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      
      const data = await response.json();
      setTemplates(data.items || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTemplates();
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      onSelectTemplate(selectedTemplate);
      onClose();
      toast({
        title: 'Template Selected',
        description: `Creating asset from template: ${selectedTemplate.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to use template',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFromScratch = () => {
    onCreateFromScratch();
    onClose();
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description?.toLowerCase().includes(search.toLowerCase()) ||
    template.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create New Asset
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a template to get started quickly, or create from scratch
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Template List */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Actions */}
            <div className="mb-4">
              <Button 
                onClick={handleCreateFromScratch}
                variant="outline" 
                className="w-full justify-start border-dashed border-2 hover:border-primary/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create from scratch
              </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                Search
              </Button>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTemplates.length > 0 ? (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedTemplate?.id === template.id 
                          ? 'border-primary bg-primary/5' 
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base font-medium">
                            {template.name}
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            {template.isPublic ? (
                              <Badge variant="outline" className="text-xs bg-green-100 border-green-200 text-green-800">
                                <Eye className="mr-1 h-3 w-3" /> Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-blue-100 border-blue-200 text-blue-800">
                                <User className="mr-1 h-3 w-3" /> Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {template.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {template.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{template.usageCount} uses</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {template.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {search ? `No templates found matching "${search}"` : 'No templates available'}
                  </p>
                  <Button 
                    onClick={handleCreateFromScratch}
                    variant="outline" 
                    className="mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first asset
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="w-80 border-l pl-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTemplate.name}</h3>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Created {new Date(selectedTemplate.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Usage:</span>
                    <span>{selectedTemplate.usageCount} times</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Visibility:</span>
                    <span>{selectedTemplate.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                </div>

                {selectedTemplate.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    onClick={handleUseTemplate}
                    className="w-full"
                  >
                    Use This Template
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    This will create a new asset based on this template
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleCreateFromScratch}>
            <Plus className="w-4 h-4 mr-2" />
            Create from Scratch
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUseTemplate}
              disabled={!selectedTemplate}
            >
              Use Selected Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}