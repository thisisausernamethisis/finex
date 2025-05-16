import { describe, it, expect } from 'vitest';
import { TEST_JWT } from '../contract/setup';

describe('DI Container Smoke Test', () => {
  it('should successfully fetch assets endpoint with real repository', async () => {
    // Create header with auth token
    const headers = {
      'Authorization': `Bearer ${TEST_JWT}`,
      'Content-Type': 'application/json'
    };

    // Make actual fetch to endpoint
    const response = await fetch('http://localhost:3000/api/assets', {
      method: 'GET',
      headers
    });

    // Verify endpoint returns success status
    expect(response.status).toBe(200);
    
    // Verify we can parse the response as JSON
    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
  });
});
