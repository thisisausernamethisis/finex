/**
 * CI script to check for OpenAPI specification drift
 * 
 * This script generates an OpenAPI spec from the current Zod validators,
 * compares it to the reference spec, and fails if breaking changes are detected.
 * 
 * Part of T-243: chore(ci): OpenAPI diff gate
 */

// @ts-expect-error Missing type definitions
import { diff } from 'openapi-diff';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
// @ts-expect-error Missing type definitions
import { generateOpenApi } from 'zod-to-openapi';
import * as yaml from 'yaml';
import * as validators from '../lib/validators';

// Path to the reference OpenAPI spec
const REFERENCE_SPEC_PATH = './openapi/finex.yaml';
// Temporary file for the generated spec
const TEMP_SPEC_PATH = './tmp-runtime-spec.yaml';
// Path to write diff results if breaking changes are found
const DIFF_RESULT_PATH = './api-diff.json';

/**
 * Main function to check for API spec drift
 */
(async () => {
  console.log('Generating OpenAPI specification from current validators...');
  
  try {
    // Verify reference spec exists
    if (!existsSync(REFERENCE_SPEC_PATH)) {
      console.error(`❌ Reference specification not found at ${REFERENCE_SPEC_PATH}`);
      process.exit(1);
    }
    
    // Generate OpenAPI spec from current validators
    const runtime = generateOpenApi({ 
      components: { 
        schemas: validators 
      } 
    });
    
    // Convert to YAML and write to temp file
    const runtimeYaml = yaml.stringify(runtime);
    writeFileSync(TEMP_SPEC_PATH, runtimeYaml);
    
    console.log('Comparing generated spec with reference...');
    
    // Compare specs
    const diffResult = await diff({ 
      sourceSpec: REFERENCE_SPEC_PATH, 
      destinationSpec: TEMP_SPEC_PATH 
    });
    
    // Check for breaking differences
    if (diffResult.breakingDifferencesFound) {
      // Write detailed diff report to file
      writeFileSync(
        DIFF_RESULT_PATH, 
        JSON.stringify(diffResult.breakingDifferences, null, 2)
      );
      
      console.error('\n❌ API spec drift detected – breaking changes found!');
      console.error(`Detailed diff report written to ${DIFF_RESULT_PATH}`);
      console.error('\nBreaking changes summary:');
      
      // Display a summary of the breaking changes
      diffResult.breakingDifferences.forEach((diff: any, i: number) => {
        console.error(`${i + 1}. ${diff.type}: ${diff.message}`);
      });
      
      console.error('\nPlease update the reference OpenAPI spec to match the current implementation,');
      console.error('or fix the implementation to maintain backward compatibility.');
      
      process.exit(1);
    } else {
      console.log('✅ OpenAPI spec in sync - no breaking changes detected');
    }
  } catch (error) {
    console.error('❌ Error during API spec comparison:', error);
    process.exit(1);
  } finally {
    // Clean up temp file
    if (existsSync(TEMP_SPEC_PATH)) {
      unlinkSync(TEMP_SPEC_PATH);
    }
  }
})();
