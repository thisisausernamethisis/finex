/**
 * Shared mock helper functions for consistent pagination and filtering
 * across different test runners (jest/vitest)
 */

/**
 * Generic pagination function for mock repositories
 */
export function paginate<T>(data: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items: data.slice(start, start + limit),
    total: data.length,
    page: page,
    limit: limit,
    totalPages: Math.ceil(data.length / limit),
    hasMore: start + limit < data.length,
  };
}

/**
 * Filter templates by search query and visibility
 */
export function filterTemplates<T extends { name: string; description?: string | null; isPublic: boolean; ownerId: string }>(
  templates: T[],
  opts: {
    q?: string | null;
    mine?: boolean;
    userId: string;
  }
) {
  let filtered = [...templates];
  
  // Apply visibility filter
  if (opts.mine) {
    filtered = filtered.filter(t => t.ownerId === opts.userId);
  } else {
    filtered = filtered.filter(t => t.isPublic || t.ownerId === opts.userId);
  }
  
  // Apply search query filter
  if (opts.q) {
    const q = opts.q.toLowerCase();
    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    );
  }
  
  return filtered;
}

/**
 * Filter assets by search query and visibility
 */
export function filterAssets<T extends { name: string; isPublic: boolean; ownerId: string }>(
  assets: T[],
  opts: {
    q?: string;
    mine?: boolean;
    userId: string;
  }
) {
  let filtered = [...assets];
  
  // Apply visibility filter
  if (opts.mine) {
    filtered = filtered.filter(a => a.ownerId === opts.userId);
  } else {
    filtered = filtered.filter(a => a.isPublic || a.ownerId === opts.userId);
  }
  
  // Apply search query filter
  if (opts.q) {
    const ql = opts.q.toLowerCase();
    filtered = filtered.filter(a => a.name.toLowerCase().includes(ql));
  }
  
  return filtered;
}
