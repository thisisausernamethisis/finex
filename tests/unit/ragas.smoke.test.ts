/**
 * Unit tests for RAGAS smoke benchmark CI gate (T-308)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

// Mock the ragas evaluator
vi.mock('../../lib/utils/ragas', () => ({
  evaluate: vi.fn().mockResolvedValue(0.9), // Mock a good score above threshold
}));

// Mock the file system
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe('RAGAS Smoke Benchmark', () => {
  const mockQAPairs = [
    {
      question: "What is the impact of rising interest rates?",
      context: ["Context about interest rates"],
      reference_answer: "Reference answer about interest rates",
      generated_answer: "Generated answer about interest rates"
    },
    {
      question: "How do supply chain disruptions affect manufacturing?",
      context: ["Context about supply chains"],
      reference_answer: "Reference answer about supply chains",
      generated_answer: "Generated answer about supply chain impacts"
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the gold dataset
    (fs.readFileSync as any).mockReturnValue(JSON.stringify(mockQAPairs));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should pass when RAGAS score meets threshold', () => {
    // Run the script directly
    const scriptPath = path.resolve(__dirname, '../../scripts/ragas/smoke.ts');
    
    // Use spawnSync to simulate running the script
    const result = spawnSync('ts-node', [scriptPath], { 
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Should exit with code 0 (success) since our mocked score is 0.9 > 0.82 threshold
    expect(result.status).toBe(0);
  });

  it('should work with debug flag enabled', () => {
    // Run with debug flag
    const scriptPath = path.resolve(__dirname, '../../scripts/ragas/smoke.ts');
    
    const result = spawnSync('ts-node', [scriptPath, '--debug'], { 
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Should still exit with code 0
    expect(result.status).toBe(0);
  });

  it('should fail when RAGAS score is below threshold', () => {
    // Override the mock to return a score below threshold
    const { evaluate } = require('../../lib/utils/ragas');
    evaluate.mockResolvedValueOnce(0.75);
    
    const scriptPath = path.resolve(__dirname, '../../scripts/ragas/smoke.ts');
    
    const result = spawnSync('ts-node', [scriptPath], { 
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    // Should exit with code 1 (failure)
    expect(result.status).toBe(1);
  });
});
