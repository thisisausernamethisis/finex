-- Create Domain type as enum
CREATE TYPE "Domain" AS ENUM (
  'FINANCE',
  'ASSET',
  'SUPPLY_CHAIN',
  'GEOGRAPHY',
  'TECHNICAL',
  'REGULATORY',
  'OTHER'
);

-- Update existing Chunk table to use the enum
ALTER TABLE "Chunk" 
ALTER COLUMN "domain" TYPE "Domain" 
USING domain::"Domain";

-- Add domain column to the ChunkV2 table
ALTER TABLE "ChunkV2"
ADD COLUMN "domain" "Domain" NOT NULL DEFAULT 'OTHER';

-- Domain statistics view for reporting
CREATE OR REPLACE VIEW "DomainStats" AS
SELECT 
  domain,
  COUNT(*) as chunk_count,
  AVG(LENGTH(content)) as avg_content_length,
  MIN(LENGTH(content)) as min_content_length,
  MAX(LENGTH(content)) as max_content_length
FROM "Chunk"
GROUP BY domain
ORDER BY chunk_count DESC;

-- Add index for domain-filtered queries
CREATE INDEX idx_chunk_domain ON "Chunk"(domain);
CREATE INDEX idx_chunkv2_domain ON "ChunkV2"(domain);

-- Add comment about migration purpose
COMMENT ON TYPE "Domain" IS 'Categorizes content by domain for focused retrieval and filtering';
