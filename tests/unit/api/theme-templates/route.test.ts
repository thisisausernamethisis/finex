import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../../../../app/api/theme-templates/route';

// Mock dependencies
vi.mock('lib/repositories');
vi.mock('lib/rateLimit');
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn().mockReturnValue({ userId: 'test_user_id' })
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
      return { status: 200, data } as any;
    });
    
    // Call the GET handler
    const response = await GET(req);
    
    // Expect proper response status
    expect(response.status).toBe(200);
    
    // Access the mocked repository
    const mockThemeTemplateRepository = vi.mocked(require('lib/repositories').ThemeTemplateRepository);
    const mockInstance = mockThemeTemplateRepository.mock.instances[0];
    
    // Check that listTemplates was called
    expect(mockInstance.listTemplates).toHaveBeenCalled();
    
    // Verify call had boolean mine parameter
    const call = mockInstance.listTemplates.mock.calls[0];
    expect(call[1]?.mine).toBe(true);
    expect(typeof call[1]?.mine).toBe('boolean');
  });
  
  it('handles search parameters correctly', async () => {
    // Create a request with various query parameters
    const req = new NextRequest('http://localhost/api/theme-templates?page=2&limit=30&q=test&mine=false');
    
    // Mock NextResponse.json
    const jsonSpy = vi.spyOn(NextResponse, 'json');
    jsonSpy.mockImplementation((data) => {
      return { status: 200, data } as any;
    });
    
    // Call the GET handler
    const response = await GET(req);
    
    // Expect proper response status
    expect(response.status).toBe(200);
    
    // Access the mocked repository
    const mockThemeTemplateRepository = vi.mocked(require('lib/repositories').ThemeTemplateRepository);
    const mockInstance = mockThemeTemplateRepository.mock.instances[0];
    
    // Verify listTemplates was called with correct parameters
    const call = mockInstance.listTemplates.mock.calls[0];
    expect(call[1]?.page).toBe(2);
    expect(call[1]?.limit).toBe(30);
    expect(call[1]?.q).toBe('test');
    expect(call[1]?.mine).toBe(false);
  });
});
