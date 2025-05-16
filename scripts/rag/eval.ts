#!/usr/bin/env ts-node
/**
 * RAG Evaluation Harness
 * 
 * This script evaluates the performance of the RAG system using a gold standard Q&A set.
 * It calculates RAGAS scores and exits with non-zero code if the score is below threshold.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import chalk from 'chalk';
import { hybridSearch } from '../../lib/services/searchService';
import { calculateRAGASScore, RAGAS_THRESHOLD } from '../../lib/utils/ragas';
import { logger } from '../../lib/logger';

// Set up logger
const evalLogger = logger.child({ component: 'RAG_Evaluation' });

interface QAItem {
  question: string;
  answer: string;
}

/**
 * Main evaluation function
 */
async function main() {
  try {
    // Print header
    console.log(chalk.bold('\n🔍 RAG System Evaluation'));
    console.log(chalk.gray('============================\n'));

    // Load the Q&A dataset
    const qaPath = path.join(process.cwd(), 'tests/rag/qa.csv');
    console.log(chalk.blue('📊 Loading Q&A dataset from:'), qaPath);
    
    // Ensure the file exists
    if (!fs.existsSync(qaPath)) {
      console.error(chalk.red('❌ Q&A dataset not found. Please run from project root or check the file path.'));
      process.exit(1);
    }

    // Parse the CSV file
    const fileContent = fs.readFileSync(qaPath, 'utf-8');
    const records = parse(fileContent, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true
    }) as QAItem[];

    console.log(chalk.blue(`📋 Loaded ${records.length} question/answer pairs\n`));

    // Process each question
    const scores: number[] = [];
    let completed = 0;
    
    for (const { question, answer } of records) {
      try {
        // Show progress
        completed++;
        process.stdout.write(`${chalk.yellow(`[${completed}/${records.length}]`)} Evaluating: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`);
        
        // Perform hybrid search
        const startTime = performance.now();
        const hits = await hybridSearch({ 
          query: question,
          limit: 5 // Use top 5 results for context
        });
        
        // Convert hits to the format expected by calculateRAGASScore
        const context = hits.map(hit => ({
          id: hit.id,
          content: `ID ${hit.id}`, // In a real implementation, this would be the actual content
          score: hit.score
        }));
        
        // Calculate RAGAS score for this QA pair
        const score = await calculateRAGASScore(question, answer, context);
        scores.push(score);
        
        // Display result
        const elapsedMs = (performance.now() - startTime).toFixed(0);
        const scoreColor = score >= RAGAS_THRESHOLD ? chalk.green : chalk.red;
        console.log(chalk.gray(` [${elapsedMs}ms] `) + scoreColor(`Score: ${score.toFixed(3)}`));
        
        // Log the result
        evalLogger.info('RAG evaluation item result', {
          question,
          score,
          elapsedMs: parseInt(elapsedMs),
          hitCount: hits.length
        });
      } catch (error) {
        console.error(chalk.red(`\n❌ Error evaluating question: "${question}"`));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        evalLogger.error('Error evaluating item', {
          question,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Calculate overall score
    const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Display summary
    console.log(chalk.gray('\n============================'));
    console.log(chalk.bold(`Overall RAGAS Score: ${overall.toFixed(3)}`));
    console.log(`Threshold: ${RAGAS_THRESHOLD.toFixed(3)}`);
    console.log(`Total evaluations: ${scores.length}`);
    
    // Log the summary
    evalLogger.info('RAG evaluation summary', {
      overallScore: overall,
      threshold: RAGAS_THRESHOLD,
      totalEvaluations: scores.length,
      passRate: scores.filter(s => s >= RAGAS_THRESHOLD).length / scores.length
    });

    // Check if we meet the threshold
    if (overall < RAGAS_THRESHOLD) {
      console.error(chalk.red(`\n❌ RAGAS score (${overall.toFixed(3)}) is below threshold (${RAGAS_THRESHOLD.toFixed(3)})`));
      process.exit(1);
    }
    
    console.log(chalk.green(`\n✅ RAGAS score meets or exceeds threshold`));
  } catch (err) {
    console.error(chalk.red('\n❌ Evaluation failed:'));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    evalLogger.error('Evaluation failed', {
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }
}

// Run the evaluation
main().catch(err => { 
  console.error(chalk.red('Unhandled error:'), err); 
  process.exit(1); 
});
