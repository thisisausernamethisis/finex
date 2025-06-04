// @ts-nocheck
import React from 'react';
import Link from 'next/link';
import { Eye, User, Calendar } from 'lucide-react';

export interface ThemeTemplateProps {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  currentUserId: string;
}

export function TemplateCard({
  id,
  name,
  description,
  isPublic,
  ownerId,
  createdAt,
  currentUserId,
}: ThemeTemplateProps) {
  const isOwner = ownerId === currentUserId;
  const formattedDate = new Date(createdAt).toLocaleDateString();
  
  return (
    <div className="h-full flex flex-col justify-between border border-border rounded-lg bg-card text-card-foreground shadow hover:border-primary/50 transition-colors">
      <div className="p-6 pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-medium line-clamp-2">{name}</h3>
          <div className="flex-shrink-0">
            {isPublic ? (
              <span className="inline-flex items-center px-2 py-1 text-xs border border-green-200 rounded bg-green-100 text-green-800">
                <Eye className="mr-1 h-3 w-3" /> Public
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 text-xs border border-blue-200 rounded bg-blue-100 text-blue-800">
                <User className="mr-1 h-3 w-3" /> Private
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-6 pt-0 flex-grow">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>
        )}
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formattedDate}</span>
        </div>
      </div>
      
      <div className="p-6 pt-4 flex justify-end gap-2">
        {isOwner && (
          <Link href={`/templates/${id}/edit`} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
            Edit
          </Link>
        )}
        <Link href={`/templates/${id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3">
          View
        </Link>
      </div>
    </div>
  );
}
