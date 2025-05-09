import { describe, it, expect } from 'vitest';
import { ListParamsSchema } from '../../../lib/validators/zod_list_params';

describe('ListParamsSchema', () => {
  it('should correctly parse valid params', () => {
    const result = ListParamsSchema.parse({ 
      page: '2', 
      limit: '30', 
      q: 'search', 
      mine: 'true' 
    });
    
    expect(result.page).toBe(2);
    expect(result.limit).toBe(30);
    expect(result.q).toBe('search');
    expect(result.mine).toBe(true);
  });
  
  it('should provide defaults for missing values', () => {
    const result = ListParamsSchema.parse({});
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.q).toBeUndefined();
    expect(result.mine).toBeUndefined();
  });
  
  it('rejects limit > 100', () => {
    expect(() => ListParamsSchema.parse({ limit: 101, page: 1 })).toThrow();
  });
  
  it('rejects negative or zero page values', () => {
    expect(() => ListParamsSchema.parse({ page: 0, limit: 10 })).toThrow();
    expect(() => ListParamsSchema.parse({ page: -1, limit: 10 })).toThrow();
  });
  
  it('trims search string', () => {
    const result = ListParamsSchema.parse({ q: '  search term  ' });
    expect(result.q).toBe('search term');
  });
});
