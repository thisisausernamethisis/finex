import { vi } from 'vitest';

// Ensure Vitest replaces the alias module with our manual mock BEFORE it's imported.
vi.mock('@/lib/repositories');
