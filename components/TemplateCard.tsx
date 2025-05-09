// @ts-nocheck
// TODO(T-173b): strict typing for Template components

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, User, Calendar } from 'lucide-react';

export interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description?: string;
    isPublic: boolean;
    ownerId: string;
    isCurrentUserOwner: boolean;
    highlightText?: string;
    createdAt?: string;
  };
}

export function TemplateCard({ template }: TemplateCardProps) {
  const { 
    id, 
    name, 
    description, 
    isPublic, 
    isCurrentUserOwner,
    createdAt 
  } = template;
  
  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : null;
  
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-medium line-clamp-2">{name}</CardTitle>
          <div className="flex-shrink-0">
            {isPublic ? (
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
      
      <CardContent className="pt-0 flex-grow">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>
        )}
        {formattedDate && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-4 flex justify-end gap-2">
        {isCurrentUserOwner && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/templates/${id}/edit`}>Edit</Link>
          </Button>
        )}
        <Button size="sm" asChild>
          <Link href={`/templates/${id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
