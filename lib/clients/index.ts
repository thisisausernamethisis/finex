/**
 * Barrel file for client exports
 * 
 * This centralizes exports from client modules to avoid deep imports
 * and make future refactoring easier.
 */

export { 
  similaritySearch,
  generateDocEmbedding
} from './vectorClient';
