// @ts-nocheck
// TODO(T-173b): strict typing for Template components

import { headers } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { TemplateCard } from '@/components/TemplateCard';
import { TemplateSearchBar } from '@/components/TemplateSearchBar';
import { Suspense } from 'react';

interface SearchParams {
  q?: string;
  mine?: string;
  page?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt?: string;
}

interface TemplateWithOwnership extends Template {
  isCurrentUserOwner: boolean;
  highlightText?: string;
}

interface TemplatesResponse {
  items: Template[];
  total: number;
  hasMore: boolean;
  currentUserId: string;
}

// Get all templates from API with search/filter parameters
async function getTemplates(searchParams: SearchParams): Promise<TemplatesResponse> {
  const user = await currentUser();
  if (!user) {
    return { items: [], total: 0, hasMore: false, currentUserId: '' };
  }

  // Use server-side headers for auth
  const headersList = headers();
  const authHeader = headersList.get('Authorization');
  
  // Build query string from search params
  const params = new URLSearchParams();
  if (searchParams.q) params.set('q', searchParams.q);
  if (searchParams.mine) params.set('mine', searchParams.mine);
  if (searchParams.page) params.set('page', searchParams.page);

  const queryString = params.toString();
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/theme-templates${queryString ? `?${queryString}` : ''}`;
  
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch templates: ${res.status}`);
    }

    const data = await res.json();
    return { ...data, currentUserId: user.id };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return { items: [], total: 0, hasMore: false, currentUserId: user.id };
  }
}

// Loading state component
function TemplatesLoading() {
  return (
    <div className="py-12 text-center">
      <p className="text-gray-500">Loading templates...</p>
    </div>
  );
}

export default async function TemplatesPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  // Get the search query from URL params
  const searchQuery = searchParams.q || '';
  
  const templatesData = await getTemplates(searchParams);
  
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Template Library</h1>
        
        {/* Search and filter components */}
        <TemplateSearchBar 
          initialSearch={searchQuery}
          initialFilterMine={searchParams.mine === 'true'}
        />
        
        <Suspense fallback={<TemplatesLoading />}>
          {templatesData.items && templatesData.items.length > 0 ? (
            <div className="grid gap-4">
              {templatesData.items.map((template: Template) => (
                <TemplateCard 
                  key={template.id} 
                  template={{
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    isPublic: template.isPublic,
                    ownerId: template.ownerId,
                    isCurrentUserOwner: template.ownerId === templatesData.currentUserId,
                    highlightText: searchQuery, // Pass the search query for highlighting
                    createdAt: template.createdAt
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border rounded-lg">
              <p className="text-gray-500">
                {searchQuery 
                  ? `No templates found matching "${searchQuery}"` 
                  : "No templates available"}
              </p>
            </div>
          )}
          
          {/* Pagination info */}
          {templatesData.total > 0 && (
            <div className="mt-6 text-sm text-gray-500 text-center">
              Showing {templatesData.items.length} of {templatesData.total} templates
              {templatesData.hasMore && " • More available"}
            </div>
          )}
        </Suspense>
      </div>
    </main>
  );
}
