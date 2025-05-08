#!/usr/bin/env node

/**
 * Cross-platform OpenAPI type generation script
 * 
 * This script detects the OS and runs the appropriate script (bash or PowerShell)
 * to generate TypeScript types from the OpenAPI schema.
 * 
 * Requirements:
 * - Docker must be installed and running
 * - The OpenAPI schema must be located at openapi/finex.yaml
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Log with emoji for better visibility
const log = {
  info: (msg) => console.log(`ℹ️ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️ ${msg}`)
};

// Ensure the types/api directory exists
const typesDir = path.join(__dirname, '..', 'types', 'api');
if (!fs.existsSync(typesDir)) {
  log.info('Creating types/api directory...');
  fs.mkdirSync(typesDir, { recursive: true });
}

// Check if Docker is available
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Run the appropriate script based on platform
function runPlatformScript() {
  const platform = os.platform();
  const dockerAvailable = isDockerAvailable();
  
  if (!dockerAvailable) {
    log.error('Docker is not available.');
    log.error('API types out-of-date – run npm run api:generate or check Docker install.');
    process.exit(1);
  }
  
  try {
    log.info(`Detected platform: ${platform}`);
    
    if (platform === 'win32') {
      log.info('Executing PowerShell script...');
      execSync('powershell -ExecutionPolicy Bypass -File ./scripts/generate-api-types.ps1', { 
        stdio: 'inherit'
      });
    } else {
      log.info('Executing Bash script...');
      execSync('bash ./scripts/generate-api-types.sh', { 
        stdio: 'inherit' 
      });
    }
    
    log.success('API types successfully generated!');
  } catch (error) {
    log.error('Failed to generate API types.');
    log.error('API types out-of-date – run npm run api:generate or check Docker install.');
    process.exit(1);
  }
}

// Execute
runPlatformScript();
