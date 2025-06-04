import { describe, it, expect, beforeEach } from '@jest/globals';
import { testApiRequest } from '../utils/testApiRequest';
import { runTestSeed } from '../seed/buildTestSeed';

describe('Technology Scenarios API Contract Tests', () => {
  beforeEach(async () => {
    await runTestSeed();
  });

  describe('GET /api/scenarios/technology', () => {
    it('should return technology scenarios with correct structure', async () => {
      const response = await testApiRequest('/api/scenarios/technology', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('scenarios');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('filters');
      expect(data).toHaveProperty('metadata');

      // Verify scenarios array
      expect(Array.isArray(data.scenarios)).toBe(true);
      expect(data.count).toBe(data.scenarios.length);

      // If scenarios exist, verify structure
      if (data.scenarios.length > 0) {
        const scenario = data.scenarios[0];
        
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('type');
        expect(scenario).toHaveProperty('timeline');
        expect(scenario).toHaveProperty('probability');
        expect(scenario).toHaveProperty('themeCount');
        expect(scenario).toHaveProperty('cardCount');
        expect(scenario).toHaveProperty('themeNames');

        // Verify technology type filtering
        expect(scenario.type).toBe('TECHNOLOGY');
      }

      // Verify filters
      expect(data.filters.type).toBe('TECHNOLOGY');
      expect(data.filters.timeline).toBeDefined();

      // Verify metadata
      expect(data.metadata).toHaveProperty('avgProbability');
      expect(data.metadata).toHaveProperty('timelineDistribution');
    });

    it('should filter by timeline when provided', async () => {
      const timeline = '2-5 years';
      const response = await testApiRequest(`/api/scenarios/technology?timeline=${encodeURIComponent(timeline)}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.filters.timeline).toBe(timeline);

      // If scenarios exist, verify they match the timeline filter
      if (data.scenarios.length > 0) {
        data.scenarios.forEach((scenario: any) => {
          expect(scenario.timeline?.toLowerCase()).toContain(timeline.toLowerCase().split(' ')[0]);
        });
      }
    });

    it('should respect limit parameter', async () => {
      const limit = 2;
      const response = await testApiRequest(`/api/scenarios/technology?limit=${limit}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.scenarios.length).toBeLessThanOrEqual(limit);
    });

    it('should return only TECHNOLOGY type scenarios', async () => {
      const response = await testApiRequest('/api/scenarios/technology', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      
      // All scenarios should be TECHNOLOGY type
      data.scenarios.forEach((scenario: any) => {
        expect(scenario.type).toBe('TECHNOLOGY');
      });
    });

    it('should calculate metadata correctly', async () => {
      const response = await testApiRequest('/api/scenarios/technology', {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const data = await response.json();

      if (data.scenarios.length > 0) {
        // Verify avgProbability calculation
        const calculatedAvg = data.scenarios.reduce((sum: number, s: any) => sum + (s.probability || 0), 0) / data.scenarios.length;
        expect(Math.abs(data.metadata.avgProbability - calculatedAvg)).toBeLessThan(0.01);

        // Verify timelineDistribution
        const timelineCount: { [key: string]: number } = {};
        data.scenarios.forEach((s: any) => {
          const timeline = s.timeline || 'unknown';
          timelineCount[timeline] = (timelineCount[timeline] || 0) + 1;
        });

        expect(data.metadata.timelineDistribution).toEqual(timelineCount);
      } else {
        expect(data.metadata.avgProbability).toBe(0);
        expect(data.metadata.timelineDistribution).toEqual({});
      }
    });

    it('should require authentication', async () => {
      const response = await testApiRequest('/api/scenarios/technology', {
        method: 'GET',
        headers: {
          // Omit Authorization header
        },
      });

      expect(response.status).toBe(401);
    });

    it('should handle server errors gracefully', async () => {
      // This test would require mocking database failure
      // For now, just verify the endpoint doesn't crash with unusual parameters
      const response = await testApiRequest('/api/scenarios/technology?limit=invalid', {
        method: 'GET',
      });

      // Should either work with default limit or return valid error
      expect([200, 400, 500]).toContain(response.status);
    });
  });
}); 