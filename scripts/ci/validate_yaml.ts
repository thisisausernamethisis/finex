#!/usr/bin/env ts-node

/**
 * YAML Dependency Graph Validation Script
 * 
 * This script validates the YAML task files in the tasks/ directory:
 * - Ensures that every referenced ticket in depends_on exists
 * - Checks for circular dependencies in the dependency graph
 * 
 * Usage:
 *   npx ts-node scripts/ci/validate_yaml.ts
 * 
 * Exit codes:
 *   0: All validation checks passed
 *   1: Missing referenced tickets
 *   2: Circular dependency detected
 *   3: Other errors (file access, parsing, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface TaskYaml {
  ticket: string;
  title: string;
  depends_on?: string[];
  // Other fields may exist but aren't relevant for dependency validation
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

// Path to tasks directory
const TASKS_DIR = path.join(process.cwd(), 'tasks');

/**
 * Read and parse all task YAML files in the tasks directory
 */
function readTaskFiles(): Map<string, TaskYaml> {
  const taskMap = new Map<string, TaskYaml>();
  
  try {
    const files = fs.readdirSync(TASKS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.yml')) continue;
      
      const filePath = path.join(TASKS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const taskData = yaml.load(content) as TaskYaml;
        if (taskData && taskData.ticket) {
          taskMap.set(taskData.ticket, taskData);
        }
      } catch (err) {
        console.error(`${colors.red}Error parsing ${file}:${colors.reset}`, err);
      }
    }
    
    return taskMap;
  } catch (err) {
    console.error(`${colors.red}Error reading task files:${colors.reset}`, err);
    process.exit(3);
  }
}

/**
 * Validate that all referenced tickets in depends_on arrays exist
 */
function validateReferences(taskMap: Map<string, TaskYaml>): boolean {
  let valid = true;
  const missingRefs = new Map<string, string[]>();
  
  for (const [ticket, task] of Array.from(taskMap.entries())) {
    if (!task.depends_on || !task.depends_on.length) continue;
    
    const missing = task.depends_on.filter((dep: string) => !taskMap.has(dep));
    if (missing.length > 0) {
      valid = false;
      missingRefs.set(ticket, missing);
    }
  }
  
  if (missingRefs.size > 0) {
    console.error(`${colors.red}Missing referenced tickets:${colors.reset}`);
    
    for (const [ticket, missing] of Array.from(missingRefs.entries())) {
      console.error(`  ${colors.cyan}${ticket}${colors.reset} references non-existent tickets: ${colors.yellow}${missing.join(', ')}${colors.reset}`);
    }
  }
  
  return valid;
}

/**
 * Detect circular dependencies in the task graph
 * Uses depth-first search with path tracking
 */
function detectCycles(taskMap: Map<string, TaskYaml>): boolean {
  const visited = new Set<string>();
  const pathStack = new Set<string>();
  let cycleDetected = false;
  let cycle: string[] = [];
  
  function dfs(ticket: string, path: string[]): void {
    // Skip if we've already detected a cycle or visited this node in another path
    if (cycleDetected || (visited.has(ticket) && !pathStack.has(ticket))) return;
    
    // If this node is already in our current path, we found a cycle
    if (pathStack.has(ticket)) {
      cycleDetected = true;
      
      // Reconstruct the cycle for reporting
      const cycleStart = path.findIndex(t => t === ticket);
      cycle = [...path.slice(cycleStart), ticket];
      return;
    }
    
    // Add to the current path
    visited.add(ticket);
    pathStack.add(ticket);
    path.push(ticket);
    
    // Visit all dependencies
    const task = taskMap.get(ticket);
    if (task && task.depends_on) {
      for (const dep of task.depends_on) {
        if (taskMap.has(dep)) {
          dfs(dep, path);
          if (cycleDetected) return;
        }
      }
    }
    
    // Remove from current path when done
    pathStack.delete(ticket);
    path.pop();
  }
  
  // Run DFS from each node to detect cycles
  for (const ticket of Array.from(taskMap.keys())) {
    dfs(ticket, []);
    if (cycleDetected) break;
  }
  
  if (cycleDetected) {
    console.error(`${colors.red}Circular dependency detected:${colors.reset}`);
    console.error(`  ${colors.yellow}${cycle.join(' → ')}${colors.reset}`);
    return false;
  }
  
  return true;
}

/**
 * Main validation function
 */
function validateTaskDependencies(): boolean {
  console.log(`${colors.cyan}Reading task files...${colors.reset}`);
  const taskMap = readTaskFiles();
  console.log(`${colors.green}Found ${taskMap.size} task files${colors.reset}\n`);
  
  console.log(`${colors.cyan}Validating ticket references...${colors.reset}`);
  const refsValid = validateReferences(taskMap);
  if (refsValid) {
    console.log(`${colors.green}All ticket references are valid${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Invalid ticket references found${colors.reset}\n`);
  }
  
  console.log(`${colors.cyan}Checking for circular dependencies...${colors.reset}`);
  const noCycles = detectCycles(taskMap);
  if (noCycles) {
    console.log(`${colors.green}No circular dependencies detected${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Circular dependencies detected${colors.reset}\n`);
  }
  
  return refsValid && noCycles;
}

/**
 * Main CLI function - exported for use by npm scripts
 * Returns exit code for script execution
 */
export function cli(): number {
  // Execute validation
  const isValid = validateTaskDependencies();
  const refsValid = validateReferences(readTaskFiles());

  if (isValid) {
    console.log(`${colors.green}✓ All dependency checks passed${colors.reset}`);
    return 0;
  } else {
    console.log(`${colors.red}✗ Dependency validation failed${colors.reset}`);
    return refsValid ? 2 : 1;
  }
}

// Run the CLI function if this script is executed directly
if (require.main === module) {
  process.exit(cli());
}
