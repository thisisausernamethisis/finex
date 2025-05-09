/**
 * Repository barrel file
 * 
 * This file re-exports all repository classes from a single point.
 * All application code should import repositories from this barrel file
 * rather than directly from their individual files. This allows for
 * easier mocking and dependency injection in tests.
 */

// Export repositories
export { ThemeTemplateRepository, DEFAULT_PAGE_SIZE } from './themeTemplateRepository';
export { AssetRepository } from './assetRepository';
export { ScenarioRepository } from './scenarioRepository';
export { ThemeRepository } from './themeRepository';
export { CardRepository } from './cardRepository';
export { MatrixRepository } from './matrixRepository';
