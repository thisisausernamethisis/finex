-- Create Domain enum type
CREATE TYPE "Domain" AS ENUM ('ASSET', 'SUPPLY_CHAIN', 'GEOGRAPHY', 'OTHER');

-- Add domain column to Chunk table with NOT NULL and default
ALTER TABLE "Chunk" ADD COLUMN "domain" "Domain" NOT NULL DEFAULT 'OTHER';

-- Create composite ivfflat index for efficient vector search with domain filtering
-- Using partial index on domain <> 'OTHER' to keep the index lean
CREATE INDEX "chunk_vec_domain_idx" ON "Chunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) WHERE domain <> 'OTHER';

-- PostDeployment: This will automatically trigger the backfill script
