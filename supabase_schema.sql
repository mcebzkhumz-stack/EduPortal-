-- Supabase / Postgres schema for eduportal_kv
-- Run in psql or Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.eduportal_kv (
  key text PRIMARY KEY,
  value text,
  chunked boolean DEFAULT false,
  chunk_count integer,
  updated_at bigint -- use epoch ms to match client Date.now(), or change to timestamptz
);

-- Index to help range scans by key (prefix queries)
CREATE INDEX IF NOT EXISTS idx_eduportal_kv_key ON public.eduportal_kv (key);

-- Optional: limit value size if you want an extra safeguard (not required)
-- ALTER TABLE public.eduportal_kv ADD CONSTRAINT value_max_length CHECK (char_length(value) < 8000000);
