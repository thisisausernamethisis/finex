'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Scenario {
  id: string;
  name: string;
}

interface ScenarioDeleteModalProps {
  scenario: Scenario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export default function ScenarioDeleteModal({ scenario, open, onOpenChange, onDelete }: ScenarioDeleteModalProps) {
  const { getToken } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await getToken();
      
      const response = await fetch(`/api/scenarios/${scenario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onOpenChange(false);
        onDelete(); // Refresh the parent list
      } else {
        console.error('Failed to delete scenario');
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Delete Scenario</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{scenario.name}</strong>? 
            This will permanently remove the scenario and all associated data.
          </p>
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? 'Deleting...' : 'Delete Scenario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 