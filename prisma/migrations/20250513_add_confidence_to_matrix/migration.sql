-- AlterTable
ALTER TABLE "MatrixAnalysisResult" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "MatrixAnalysisResult" ADD COLUMN IF NOT EXISTS "confidence" FLOAT;

-- Add index for faster querying
CREATE INDEX "idx_matrix_analysis_confidence" ON "MatrixAnalysisResult"("confidence");

-- Add comment for documentation
COMMENT ON COLUMN "MatrixAnalysisResult"."confidence" IS 'LLM confidence score (0-1) indicating reliability of analysis';
COMMENT ON COLUMN "MatrixAnalysisResult"."summary" IS 'Text summary of matrix analysis impact';
