// Toggle for verbose test output
// Set VITEST_VERBOSE=1 environment variable to enable verbose test output

if (process.env.VITEST_VERBOSE === '1') {
  // Use the Vitest config API instead of vi.configure
  process.env.VITEST_SILENT = 'false';
  console.log('[Verbose mode enabled] Test output will not be silent');
}
