-- zero-downtime additive migration for T-301a
SET statement_timeout = '300s';

CREATE TYPE "Domain" AS ENUM ('ASSET','SUPPLY_CHAIN','GEOGRAPHY','OTHER');

ALTER TABLE "Chunk"
  ADD COLUMN "domain" "Domain" NOT NULL DEFAULT 'OTHER';

CREATE INDEX "chunk_vec_domain_idx"
  ON "Chunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100)
  WHERE domain <> 'OTHER';
