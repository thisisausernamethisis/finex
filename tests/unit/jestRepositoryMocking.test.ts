// ⬇️  save as tests/unit/jestRepositoryMocking.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import {
  ThemeTemplateRepository,
  AssetRepository,
  ScenarioRepository,
  ThemeRepository,
  CardRepository,
  MatrixRepository,
} from '@/lib/repositories';

describe('Repository manual-mock wiring', () => {
  /** Util to assert that every public method on a repo instance is a Jest mock */
  const assertRepoMethodsAreMocked = (repo: Record<string, any>) => {
    Object.values(repo).forEach(v => {
      if (typeof v === 'function') {
        // keep the test narrow: only functions defined on the instance
        expect(jest.isMockFunction(v)).toBe(true);
      }
    });
  };

  it('ThemeTemplateRepository is fully mocked', () => {
    assertRepoMethodsAreMocked(new ThemeTemplateRepository());
  });

  it('AssetRepository is fully mocked', () => {
    assertRepoMethodsAreMocked(new AssetRepository());
  });

  it('Scenario / Theme / Card / Matrix repositories are fully mocked', () => {
    [
      new ScenarioRepository(),
      new ThemeRepository(),
      new CardRepository(),
      new MatrixRepository(),
    ].forEach(assertRepoMethodsAreMocked);
  });
});
