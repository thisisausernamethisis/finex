import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../../../../app/api/theme-templates/route';

// Mock dependencies
vi.mock('@/lib/repositories', () => ({
  ThemeTemplateRepository: vi.fn().mockImplementation(() => ({
    listTemplates: vi.fn().mockResolvedValue({
      items: [],
      total: 0
    })
  }))
}));

vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn().mockReturnValue({ userId: 'test_user_id' })
}));

vi.mock('@/lib/rateLimit', () => ({
  createRateLimiter: vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue(false), // Don't limit by default
    check: vi.fn().mockReturnValue(true)
  }),
  __resetRateLimit: vi.fn()
}));

describe('Theme Templates API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('mine flag parsed as boolean', async () => {
    // Create a request with mine=true query parameter
    const req = new NextRequest('http://localhost/api/theme-templates?mine=true');
    
    // Mock NextResponse.json to capture the response
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    jsonSpy.mockImplementation((data) => {
      return { data } as any;
    });
    
    // Call the GET handler
    await GET(req);
    
    // Verify that the repository was called with mine=true as a boolean
    const mockThemeTemplateRepository = require('@/lib/repositories').ThemeTemplateRepository;
    const mockInstance = mockThemeTemplateRepository.mock.instances[0];
    const listTemplatesCall = mockInstance.listTemplates.mock.calls[0][0];
    
    // Check that mine was parsed as a boolean true value
    expect(listTemplatesCall.mine).toBe(true);
    expect(typeof listTemplatesCall.mine).toBe('boolean');
  });
  
  it('handles search parameters correctly', async () => {
    // Create a request with various query parameters
    const req = new NextRequest('http://localhost/api/theme-templates?page=2&limit=30&q=test&mine=false');
    
    // Mock NextResponse.json
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    jsonSpy.mockImplementation((data) => {
      return { data } as any;
    });
    
    // Call the GET handler
    await GET(req);
    
    // Verify that the repository was called with correctly parsed parameters
    const mockThemeTemplateRepository = require('@/lib/repositories').ThemeTemplateRepository;
    const mockInstance = mockThemeTemplateRepository.mock.instances[0];
    const listTemplatesCall = mockInstance.listTemplates.mock.calls[0][0];
    
    expect(listTemplatesCall.page).toBe(2);
    expect(listTemplatesCall.limit).toBe(30);
    expect(listTemplatesCall.q).toBe('test');
    expect(listTemplatesCall.mine).toBe(false);
  });
});
