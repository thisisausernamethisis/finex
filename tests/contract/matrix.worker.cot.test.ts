import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeAssetScenarioImpact, processMatrixJob } from '../../workers/matrixWorker';
import { ImpactExplainSchema } from '../../lib/validators/matrix';
import OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                function_call: {
                  arguments: JSON.stringify({
                    impact: 2,
                    summary: "The scenario has a moderate positive impact on the asset.",
                    confidence: 0.8,
                    evidenceIds: "doc1,doc2,doc3",
                    reasoning_steps: [
                      {
                        id: "step1",
                        premise: "The scenario introduces favorable market conditions.",
                        inference: "These conditions will likely boost asset performance.",
                        confidence: 0.85,
                        evidence: ["doc1", "doc2"]
                      },
                      {
                        id: "step2",
                        premise: "Similar assets have shown 10-15% growth in comparable scenarios.",
                        inference: "We can expect a positive but measured impact.",
                        confidence: 0.75,
                        evidence: ["doc3"]
                      }
                    ]
                  })
                }
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock other imports
vi.mock('../../lib/db', () => ({
  prisma: {
    matrixAnalysisResult: {
      update: vi.fn().mockResolvedValue({})
    }
  }
}));

vi.mock('../../lib/services/contextAssemblyService', () => ({
  assembleMatrixContext: vi.fn().mockResolvedValue("Mock context data")
}));

vi.mock('../../lib/events/eventEmitter', () => ({
  emitJobEvent: vi.fn()
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })
  }
}));

describe('Matrix Worker Chain of Thought Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('analyzeAssetScenarioImpact', () => {
    it('returns full reasoning steps in response when available', async () => {
      // Setup
      const context = "Test context";
      const assetId = "asset123";
      const scenarioId = "scenario456";
      
      // Exercise
      const result = await analyzeAssetScenarioImpact(context, assetId, scenarioId);
      
      // Verify
      expect(result).toBeDefined();
      expect(result.impact).toBe(2);
      expect(result.summary).toBe("The scenario has a moderate positive impact on the asset.");
      expect(result.confidence).toBe(0.8);
      expect(result.reasoning_steps).toBeDefined();
      expect(result.reasoning_steps?.length).toBe(2);
      
      // Verify first reasoning step
      const firstStep = result.reasoning_steps?.[0];
      expect(firstStep?.id).toBe("step1");
      expect(firstStep?.premise).toBe("The scenario introduces favorable market conditions.");
      expect(firstStep?.confidence).toBe(0.85);
      expect(firstStep?.evidence).toContain("doc1");
    });
    
    it('validates response against ImpactExplainSchema', async () => {
      // Setup - modify the mock to return invalid data
      const openaiInstance = new OpenAI();
      const mockCreate = openaiInstance.chat.completions.create as any;
      
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            function_call: {
              arguments: JSON.stringify({
                impact: 10, // Invalid value (out of range)
                summary: "Test",
                confidence: 0.8,
                evidenceIds: "doc1,doc2",
                reasoning_steps: []
              })
            }
          }
        }]
      });
      
      // Exercise & Verify
      await expect(analyzeAssetScenarioImpact("context", "asset", "scenario"))
        .rejects.toThrow(/validation/i); // Should throw a validation error
    });
  });
  
  describe('processMatrixJob integration', () => {
    it('saves result without reasoning steps to database', async () => {
      // Import the real module for this test
      const { prisma } = await import('../../lib/db');
      
      // Create a job mock
      const job = {
        id: 'job123',
        data: {
          assetId: 'asset123',
          scenarioId: 'scenario456'
        }
      };
      
      // Exercise
      await processMatrixJob(job as any);
      
      // Verify prisma update was called with the right parameters
      expect(prisma.matrixAnalysisResult.update).toHaveBeenCalledTimes(2);
      
      // Get the second call arguments (the one that saves the result)
      const updateCall = (prisma.matrixAnalysisResult.update as any).mock.calls[1][0];
      
      // Verify the saved data doesn't include reasoning steps
      const savedData = updateCall.data;
      expect(savedData).toHaveProperty('impact', 2);
      expect(savedData).toHaveProperty('summary');
      expect(savedData).toHaveProperty('confidence');
      expect(savedData).not.toHaveProperty('reasoning_steps');
    });
  });
});
