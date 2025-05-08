/**
 * Common types for test data and mocks
 */

/**
 * Generic paginated response type
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Theme Template DTO (Data Transfer Object)
 */
export interface ThemeTemplateDTO {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  // TODO: Remove userId after test migration - legacy compatibility field
  userId?: string;
}

/**
 * Theme DTO
 */
export interface ThemeDTO {
  id: string;
  name: string;
  description?: string | null;
  themeType: string;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Card DTO 
 */
export interface CardDTO {
  id: string;
  themeId: string;
  title: string;
  content: string;
  importance: number;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
