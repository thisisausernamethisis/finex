'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  hasMore,
  onPageChange,
  onLoadMore,
  loading = false
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between mt-8">
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <span className="px-3 py-1 text-sm">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasMore || loading}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        
        {hasMore && (
          <Button 
            onClick={onLoadMore}
            disabled={loading}
            size="sm"
            className="ml-4"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>
    </div>
  );
} 