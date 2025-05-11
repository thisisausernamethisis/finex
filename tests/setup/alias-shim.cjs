// CommonJS module resolver for @/ alias paths in require() calls
// This shim patches Module._resolveFilename to handle @/ paths in legacy CJS requires

// Add idempotent guard to avoid duplicate patching if this file is required multiple times
if (!global.__cjsAliasPatched) {
  global.__cjsAliasPatched = true;

  const { resolve } = require('path');
  const Module = require('module');
  const path = require('path');
  const fs = require('fs');

  const projRoot = resolve(__dirname, '../..');
  const originalResolve = Module._resolveFilename;

  Module._resolveFilename = function (request, parent, isMain, options) {
    // Only apply these transformations to our project files, not node_modules
    const fromNodeModules = parent && parent.filename && parent.filename.includes('node_modules');
    
    if (!fromNodeModules) {
      if (request.startsWith('@/')) {
        // Transform @/lib/... to absolute path
        let p = resolve(projRoot, request.slice(2));
        
        // Add .ts suffix if the path doesn't already have a .ts, .tsx, .js, or .jsx extension
        if (!/\.[tj]sx?$/.test(p)) {
          p += '.ts';
        }
        
        if (process.env.DEBUG_ALIAS) console.log('[alias]', request, '→', p);
        request = p;
      }
      // Handle exact lib/repositories import
      else if (request === 'lib/repositories' || request === 'lib/repositories.ts') {
        request = resolve(projRoot, 'lib/repositories/index.ts');
        if (process.env.DEBUG_ALIAS) console.log('[alias]', request, '→', request);
      }
      // Handle exact lib/rateLimit import
      else if (request === 'lib/rateLimit' || request === 'lib/rateLimit.ts') {
        request = resolve(projRoot, 'lib/rateLimit.ts');
        if (process.env.DEBUG_ALIAS) console.log('[alias]', request, '→', request);
      }
      // Handle themeTemplateRepository import
      else if (request.startsWith('lib/repositories/themeTemplateRepository') || 
               request === 'lib/repositories/themeTemplateRepository.ts' ||
               request === './themeTemplateRepository' ||
               request === 'themeTemplateRepository') {
        request = resolve(projRoot, 'lib/repositories/themeTemplateRepository.ts');
        if (process.env.DEBUG_ALIAS) console.log('[alias]', `${request} (from ${parent?.filename || 'unknown'})`, '→', request);
      }
      // Handle bare lib import
      else if (request === 'lib') {
        request = resolve(projRoot, 'lib');
        if (process.env.DEBUG_ALIAS) console.log('[alias]', request, '→', request);
      }
      // Handle lib paths with relative prefix, but only for our project files
      else if (/^(?:\.\.?\/)?(?:lib|bare-lib)[\\/]/.test(request)) {
        // Match bare lib/ imports (including lib\path style on Windows)
        let p = path.join(projRoot, request.replace(/^(?:\.\.?\/)?(?:lib|bare-lib)[\\/]/, 'lib/'));
        
        if (!/\.[tj]sx?$/.test(p)) {
          p += '.ts';
        }
        
        // Optional hard-fail on missing file
        if (process.env.ALIAS_HARD_FAIL && !fs.existsSync(p)) {
          throw new Error('alias-shim: path not found ' + p);
        }
        
        if (process.env.DEBUG_ALIAS) console.log('[alias]', request, '→', p);
        request = p;
      }
    }
    
    return originalResolve.call(this, request, parent, isMain, options);
  };
}

// This module doesn't export anything - it simply patches the Module._resolveFilename function once
