/**
 * Matrix Data Validators
 * 
 * Zod validation schemas for matrix-related data structures,
 * particularly for matrix analysis results.
 */

import { z } from 'zod';

/**
 * Schema for the reasoning steps in an impact explanation
 */
export const ReasoningStepSchema = z.object({
  id: z.string().describe('Unique identifier for this reasoning step'),
  premise: z.string().describe('The factual premise or observation'),
  inference: z.string().describe('The logical inference or conclusion drawn'),
  confidence: z.number().min(0).max(1).describe('Confidence in this specific step (0-1)'),
  evidence: z.array(z.string()).describe('Evidence IDs supporting this step')
});

/**
 * Validator for matrix analysis result data
 */
export const matrixAnalysisResultSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  scenarioId: z.string(),
  impact: z.number().int().min(-5).max(5),
  summary: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  evidenceIds: z.string(),
  status: z.string(),
  error: z.string().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type MatrixAnalysisResultType = z.infer<typeof matrixAnalysisResultSchema>;

/**
 * Validator for matrix analysis result creation
 */
export const createMatrixAnalysisResultSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  scenarioId: z.string().min(1, "Scenario ID is required"),
  impact: z.number().int().min(-5).max(5),
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceIds: z.string().optional().default("[]"),
  status: z.string().optional().default("pending")
});

export type CreateMatrixAnalysisResultType = z.infer<typeof createMatrixAnalysisResultSchema>;

/**
 * Validator for matrix analysis result updates
 */
export const updateMatrixAnalysisResultSchema = z.object({
  impact: z.number().int().min(-5).max(5).optional(),
  summary: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceIds: z.string().optional(),
  status: z.string().optional(),
  error: z.string().optional(),
  completedAt: z.date().optional()
});

export type UpdateMatrixAnalysisResultType = z.infer<typeof updateMatrixAnalysisResultSchema>;

/**
 * Alias for compatibility with existing code
 */
export const MatrixResultUpdateSchema = updateMatrixAnalysisResultSchema;

/**
 * Matrix worker processing payload
 */
export const matrixWorkerPayloadSchema = z.object({
  matrixResultId: z.string().min(1, "Matrix result ID is required"),
  assetId: z.string().min(1, "Asset ID is required"),
  scenarioId: z.string().min(1, "Scenario ID is required")
});

export type MatrixWorkerPayloadType = z.infer<typeof matrixWorkerPayloadSchema>;

/**
 * Schema for the impact explanation with chain-of-thought reasoning
 * 
 * This validates the structure of impact analysis results from the Matrix Worker
 * including the reasoning steps that support the final conclusion
 */
export const ImpactExplainSchema = z.object({
  impact: z.number()
    .int()
    .min(-5)
    .max(5)
    .describe('Impact score from -5 (severe negative) to +5 (strong positive)'),
  
  summary: z.string()
    .min(10)
    .max(500)
    .describe('A concise 2-3 sentence summary explaining the conclusion'),
  
  confidence: z.number()
    .min(0)
    .max(1)
    .describe('Confidence score between 0 and 1'),
  
  evidenceIds: z.string()
    .describe('Comma-separated list of the most relevant evidence IDs'),
  
  reasoning_steps: z.array(ReasoningStepSchema)
    .min(1)
    .max(10)
    .describe('Chain-of-thought reasoning steps leading to the conclusion')
});

/**
 * Public-facing schema that excludes the internal reasoning steps 
 * This is used for client-facing API responses
 */
export const PublicImpactSchema = ImpactExplainSchema.omit({ 
  reasoning_steps: true 
});

/**
 * Type definition for the full impact explanation including reasoning steps
 */
export type ImpactExplanation = z.infer<typeof ImpactExplainSchema>;

/**
 * Type definition for the public-facing impact data
 */
export type PublicImpact = z.infer<typeof PublicImpactSchema>;

/**
 * Matrix worker processing result, including confidence score
 */
export const matrixWorkerResultSchema = z.object({
  impact: z.number().int().min(-5).max(5),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  evidenceIds: z.array(z.string())
});

export type MatrixWorkerResultType = z.infer<typeof matrixWorkerResultSchema>;

/**
 * Matrix result preview schema for lightweight API responses
 */
export const MatrixResultPreviewSchema = z.object({
  id: z.string(),
  matrix_id: z.string(),
  status: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
  summary: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable()
});

export type MatrixResultPreviewType = z.infer<typeof MatrixResultPreviewSchema>;
