-- AddColumn faceClusterId to FaceIndex
ALTER TABLE "FaceIndex" ADD COLUMN "faceClusterId" TEXT;

-- Index for cluster lookup
CREATE INDEX "FaceIndex_faceClusterId_idx" ON "FaceIndex"("faceClusterId");
