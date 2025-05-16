/**
 * Domain types for content categorization
 * Used for filtering in search queries and chunk classification
 */
export enum Domain {
  FINANCE = 'FINANCE',
  ASSET = 'ASSET',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  GEOGRAPHY = 'GEOGRAPHY',
  TECHNICAL = 'TECHNICAL',
  REGULATORY = 'REGULATORY',
  OTHER = 'OTHER'
}

// Helper function to validate if a string is a valid domain
export function isValidDomain(value: string): value is Domain {
  return Object.values(Domain).includes(value as Domain);
}
