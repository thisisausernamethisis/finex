function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

export function MatrixSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        {/* Toolbar skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        
        {/* Matrix grid skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: '200px repeat(5, 120px)' }}>
            {/* Corner cell */}
            <Skeleton className="h-16 border-r border-b" />
            
            {/* Column headers */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`header-${i}`} className="h-16 border-r border-b p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3 mx-auto" />
              </div>
            ))}
            
            {/* Matrix rows */}
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div key={`row-${rowIndex}`} className="contents">
                {/* Row header */}
                <div className="h-20 border-r border-b p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                
                {/* Row cells */}
                {Array.from({ length: 5 }).map((_, colIndex) => (
                  <div key={`cell-${rowIndex}-${colIndex}`} className="h-20 border-r border-b p-2 space-y-1">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-6 w-8" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 