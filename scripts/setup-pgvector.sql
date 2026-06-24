-- Setup pgvector para reconhecimento facial (InsightFace ArcFace 512-D).
-- Correr uma vez na base de dados:
--   psql -U postgres -h localhost -d sports_photos_dev -f scripts/setup-pgvector.sql
--
-- Requer a extensão pgvector instalada no servidor Postgres.
-- macOS (Homebrew, postgresql@16): compilar da fonte contra o pg_config do @16,
-- ou `brew install pgvector` se a versão do Postgres bater certo.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "FaceIndex"
  ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Índice HNSW para busca KNN rápida por distância de cosseno
CREATE INDEX IF NOT EXISTS faceindex_embedding_hnsw
  ON "FaceIndex" USING hnsw (embedding vector_cosine_ops);
