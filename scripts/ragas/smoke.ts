/**
 * RAGAS smoke benchmark CI gate (T-308)
 * 
 * This script loads a gold standard 20-pair QA dataset and computes
 * the mean RAGAS score. If the score is below the threshold (0.82),
 * the script exits with code 1, causing CI to fail.
 * 
 * Usage:
 *   pnpm ts-node scripts/ragas/smoke.ts
 *   pnpm ts-node scripts/ragas/smoke.ts --debug
 *   RAG_SEED=123 pnpm ts-node scripts/ragas/smoke.ts
 */

import { logger } from '../../lib/logger';
import path from 'path';
import fs from 'fs';
import { program } from 'commander';
import { evaluate } from '../../lib/utils/ragas';

// Configure logger
const log = logger.child({ component: 'RAGAS_SMOKE' });

// Parse command line args
program
  .option('--debug', 'Show detailed scoring information')
  .parse(process.argv);

const options = program.opts();
const DEBUG = options.debug || false;

// Use deterministic seed if provided, otherwise use current timestamp
const seed = Number(process.env.RAG_SEED) || Date.now();
log.info(`Using seed: ${seed}`);

// Threshold for acceptable RAGAS score (CI gate)
const SCORE_THRESHOLD = 0.82;

// Gold standard dataset path
const GOLD_DATASET_PATH = path.join(__dirname, '../../tests/rag/gold/smoke_20.json');

/**
 * Main function to run the RAGAS smoke benchmark
 */
async function main() {
  try {
    log.info('Starting RAGAS smoke benchmark');
    
    // Load gold standard dataset
    const goldData = loadGoldDataset();
    log.info(`Loaded ${goldData.length} QA pairs from gold dataset`);
    
    // Compute RAGAS score
    const { scores, mean } = await computeRagasScores(goldData);
    
    // Output results
    if (DEBUG) {
      log.info('Individual scores:', { scores });
      console.table(scores.map((score, i) => ({
        question: goldData[i].question.substring(0, 30) + '...',
        answer: goldData[i].generated_answer.substring(0, 30) + '...',
        score: score.toFixed(3),
      })));
    }
    
    log.info(`Mean RAGAS score: ${mean.toFixed(3)} (threshold: ${SCORE_THRESHOLD})`);
    
    // Fail if below threshold
    if (mean < SCORE_THRESHOLD) {
      log.error(`❌ RAGAS score ${mean.toFixed(3)} is below threshold ${SCORE_THRESHOLD}`);
      process.exit(1);
    } else {
      log.info(`✅ RAGAS score ${mean.toFixed(3)} meets threshold ${SCORE_THRESHOLD}`);
    }
  } catch (error) {
    log.error('Error in RAGAS smoke benchmark', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

/**
 * Load the gold standard dataset
 */
function loadGoldDataset() {
  try {
    const data = fs.readFileSync(GOLD_DATASET_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    log.error(`Failed to load gold dataset from ${GOLD_DATASET_PATH}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Gold dataset loading failed');
  }
}

/**
 * Compute RAGAS scores for all QA pairs
 */
async function computeRagasScores(goldData: any[]) {
  try {
    // Map data to format expected by RAGAS evaluator
    const evaluationData = goldData.map(item => ({
      question: item.question,
      context: item.context,
      reference_answer: item.reference_answer,
      generated_answer: item.generated_answer,
    }));
    
    // Compute scores for each pair
    const scores: number[] = [];
    
    for (const item of evaluationData) {
      const score = await evaluate(item);
      scores.push(score);
    }
    
    // Compute mean score
    const mean = scores.reduce((acc, val) => acc + val, 0) / scores.length;
    
    return { scores, mean };
  } catch (error) {
    log.error('Failed to compute RAGAS scores', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('RAGAS evaluation failed');
  }
}

// Run the script
main().catch(err => {
  log.error('Fatal error in RAGAS smoke benchmark', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
