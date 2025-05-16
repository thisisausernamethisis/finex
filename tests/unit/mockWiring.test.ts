/**
 * Wiring sanity-check for Vitest automatic module mocks.
 *
 * Each repository import should resolve to the implementation in
 * tests/__mocks__/lib/repositories.ts – never the real DB layer.
 */
import { describe, it, expect, vi } from 'vitest';
import {
  ThemeTemplateRepository,
  AssetRepository,
  ScenarioRepository,
  ThemeRepository,
  CardRepository,
  MatrixRepository,
} from '@/lib/repositories';

function assertRepository(instance: unknown) {
  for (const key of Object.keys(instance as any)) {
    const prop = (instance as any)[key];
    if (typeof prop === 'function') {
      expect(vi.isMockFunction(prop)).toBe(true);
    }
  }
}

describe('Repository mock wiring (Vitest)', () => {
  it('ThemeTemplateRepository is mocked', () =>
    assertRepository(new ThemeTemplateRepository()));

  it('AssetRepository is mocked', () =>
    assertRepository(new AssetRepository()));

  it('All other repositories are mocked', () => {
    assertRepository(new ScenarioRepository());
    assertRepository(new ThemeRepository());
    assertRepository(new CardRepository());
    assertRepository(new MatrixRepository());
  });
});
