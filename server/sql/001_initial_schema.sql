BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  chunk_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  source_page integer,
  embedding vector(1536),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT document_chunks_document_id_fkey
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  chunk_ids uuid[],
  response text,
  response_time_ms integer,
  token_count integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
  ON document_chunks(document_id);

CREATE INDEX IF NOT EXISTS documents_created_at_idx
  ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS query_logs_created_at_idx
  ON query_logs(created_at DESC);

COMMIT;