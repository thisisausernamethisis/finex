/**
 * Validator transform helpers for use with Zod
 * 
 * These functions help with common type conversions needed
 * when validating query parameters and form data.
 */

import { z } from 'zod';

/**
 * Transforms a string "true"/"false" into boolean
 * @param val The string value to convert
 * @returns boolean value
 */
export const booleanFromString = z.preprocess(
  (v) => (v === 'true' || v === '1' ? true : v === 'false' || v === '0' ? false : v),
  z.boolean()
);

/**
 * Transforms a string numeric value into a number
 * @param val The string value to convert
 * @returns number value or NaN if invalid
 */
export function numberFromString(val: string): number {
  return Number(val);
}

/**
 * Transforms a comma-separated string into an array of strings
 * @param val The comma-separated string
 * @returns Array of trimmed strings
 */
export function arrayFromString(val: string): string[] {
  if (!val || val.trim() === '') return [];
  return val.split(',').map(s => s.trim());
}
