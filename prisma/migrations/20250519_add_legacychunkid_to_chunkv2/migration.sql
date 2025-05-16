-- Add legacyChunkId column to ChunkV2
ALTER TABLE "ChunkV2" ADD COLUMN "legacyChunkId" TEXT;

-- Create an index for faster lookups
CREATE INDEX "ChunkV2_legacyChunkId_idx" ON "ChunkV2"("legacyChunkId");

-- Update Prisma schema comment
COMMENT ON TABLE "ChunkV2" IS 'New chunk format with optimal size (~256 tokens), overlapping text, and domain classification. Will replace Chunk table after migration. legacyChunkId tracks original Chunk id.';
