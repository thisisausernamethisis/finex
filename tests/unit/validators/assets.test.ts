import { describe, expect, it } from 'vitest';
import { AssetUpsert } from '../../../lib/validators/assets';
import { AssetKind } from '@prisma/client';

describe('AssetUpsert validator', () => {
  it('should accept valid asset data', () => {
    const validData = {
      name: 'Test Asset',
      kind: 'STANDARD' as AssetKind,
      description: 'This is a test asset',
      isPublic: true
    };
    
    const result = AssetUpsert.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });
  
  it('should accept minimal valid asset data', () => {
    const minimalData = {
      name: 'Test',
      kind: 'STANDARD' as AssetKind
    };
    
    const result = AssetUpsert.safeParse(minimalData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(minimalData);
    }
  });
  
  it('should reject asset data with name too short', () => {
    const invalidData = {
      name: 'Ab', // Less than 3 characters
      kind: 'STANDARD' as AssetKind
    };
    
    const result = AssetUpsert.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });
  
  it('should reject asset data with name too long', () => {
    const invalidData = {
      name: 'A'.repeat(101), // More than 100 characters
      kind: 'STANDARD' as AssetKind
    };
    
    const result = AssetUpsert.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });
  
  it('should reject asset data with invalid kind', () => {
    const invalidData = {
      name: 'Test Asset',
      kind: 'INVALID_KIND' as AssetKind // Not a valid enum value
    };
    
    const result = AssetUpsert.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('kind');
    }
  });
  
  it('should reject asset data with description too long', () => {
    const invalidData = {
      name: 'Test Asset',
      kind: 'STANDARD' as AssetKind,
      description: 'A'.repeat(501) // More than 500 characters
    };
    
    const result = AssetUpsert.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('description');
    }
  });
});
