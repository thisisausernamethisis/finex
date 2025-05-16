-- Add embedding vector column to Chunk table
-- Requires pgvector extension

-- CreateExtension (if not exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN embedding vector(1536);

-- Down Migration
-- CreateExtension cannot be rolled back in DOWN migration as it might be used by other tables

-- Down migration script
ALTER TABLE "Chunk" DROP COLUMN embedding;
