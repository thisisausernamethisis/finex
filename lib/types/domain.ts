/**
 * Domain types for content categorization
 * Used for filtering in search queries and chunk classification
 */
export type Domain = 'FINANCE' | 'ASSET' | 'SUPPLY_CHAIN' | 'GEOGRAPHY' | 'TECHNICAL' | 'REGULATORY' | 'OTHER';

// Helper function to validate if a string is a valid domain
export function isValidDomain(value: string): value is Domain {
  return [
    'FINANCE',
    'ASSET',
    'SUPPLY_CHAIN',
    'GEOGRAPHY', 
    'TECHNICAL',
    'REGULATORY',
    'OTHER'
  ].includes(value as Domain);
}
