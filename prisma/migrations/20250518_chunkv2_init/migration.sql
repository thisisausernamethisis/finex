-- CreateTable for ChunkV2 with enhanced schema
-- This will be populated by rechunk process and eventually replace the Chunk table
CREATE TABLE "ChunkV2" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "domain" TEXT,
  "content" TEXT NOT NULL,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "ChunkV2_pkey" PRIMARY KEY ("id")
);

-- Create indexes for faster queries
-- Asset & scenario filter index
CREATE INDEX "ChunkV2_assetId_scenarioId_idx" ON "ChunkV2"("assetId", "scenarioId");

-- Domain filter index
CREATE INDEX "ChunkV2_domain_idx" ON "ChunkV2"("domain");

-- Comment explaining upgrade path
COMMENT ON TABLE "ChunkV2" IS 'New chunk format with optimal size (~256 tokens), overlapping text, and domain classification. Will replace Chunk table after migration.';
