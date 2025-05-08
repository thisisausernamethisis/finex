'use client';

import { useState, useEffect } from 'react';

// Simple toast hook implementation
export function useToast() {
  const [toasts, setToasts] = useState<{
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }[]>([]);

  // Function to add a toast
  const toast = ({ 
    title, 
    description, 
    variant = 'default' 
  }: { 
    title: string; 
    description?: string; 
    variant?: 'default' | 'destructive' 
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    
    // Automatically remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
    
    return id;
  };

  // Simple toast UI rendered at the bottom right of the screen
  useEffect(() => {
    if (toasts.length > 0) {
      const toastContainer = document.createElement('div');
      toastContainer.style.position = 'fixed';
      toastContainer.style.bottom = '1rem';
      toastContainer.style.right = '1rem';
      toastContainer.style.zIndex = '1000';
      toastContainer.style.display = 'flex';
      toastContainer.style.flexDirection = 'column';
      toastContainer.style.gap = '0.5rem';
      document.body.appendChild(toastContainer);
      
      toasts.forEach((toast) => {
        const toastEl = document.createElement('div');
        toastEl.style.padding = '1rem';
        toastEl.style.borderRadius = '0.5rem';
        toastEl.style.background = toast.variant === 'destructive' ? '#ef4444' : '#3b82f6';
        toastEl.style.color = 'white';
        toastEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        toastEl.style.minWidth = '200px';
        
        const titleEl = document.createElement('div');
        titleEl.textContent = toast.title;
        titleEl.style.fontWeight = 'bold';
        toastEl.appendChild(titleEl);
        
        if (toast.description) {
          const descEl = document.createElement('div');
          descEl.textContent = toast.description;
          descEl.style.fontSize = '0.875rem';
          descEl.style.marginTop = '0.25rem';
          toastEl.appendChild(descEl);
        }
        
        toastContainer.appendChild(toastEl);
      });
      
      return () => {
        document.body.removeChild(toastContainer);
      };
    }
  }, [toasts]);

  return { toast };
}
