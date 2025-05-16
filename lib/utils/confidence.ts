/**
 * Combines three signals → composite confidence 0-1
 *  1. LLM self-report (0-1)
 *  2. Retrieval variance (higher var  ⇒ stronger evidence) 
 *  3. Vector/BM25 agreement (rank-corr)
 */

/**
 * Computes a composite confidence score from multiple signals
 * Uses weighted geometric mean for balanced integration
 * 
 * @param opts.llm Self-reported confidence from the LLM (0-1)
 * @param opts.retrievalVariance Normalized variance from top-k results (0-1)
 * @param opts.rankCorrelation Spearman rank correlation between vector and BM25 results (0-1)
 * @returns Composite confidence score bounded between 0-1
 */
export function computeConfidence(opts: {
  llm: number;              // self-reported
  retrievalVariance: number; // normalised 0-1
  rankCorrelation: number;   // Spearman 0-1
}): number {
  const { llm, retrievalVariance, rankCorrelation } = opts;
  
  // Ensure all inputs are bounded between 0-1
  const boundedLLM = Math.min(1, Math.max(0, llm));
  const boundedVariance = Math.min(1, Math.max(0, retrievalVariance));
  const boundedRankCorr = Math.min(1, Math.max(0, rankCorrelation));
  
  // Weighted geometric mean with exponents representing weights
  // LLM confidence is weighted higher (0.4) than the other metrics (0.3 each)
  const conf = Math.pow(boundedLLM, 0.4) *
               Math.pow(boundedVariance, 0.3) *
               Math.pow(boundedRankCorr, 0.3);
  
  // Ensure output is bounded between 0-1
  return Math.min(1, Math.max(0, conf));
}
