CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  voice text NOT NULL,
  style text NOT NULL,
  duration integer NOT NULL,
  author text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (companion_id, user_id)
);

CREATE INDEX IF NOT EXISTS companions_author_idx ON companions(author);
CREATE INDEX IF NOT EXISTS companions_subject_idx ON companions(subject);
CREATE INDEX IF NOT EXISTS companions_created_at_idx ON companions(created_at DESC);
CREATE INDEX IF NOT EXISTS companions_subject_trgm_idx ON companions USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companions_topic_trgm_idx ON companions USING gin (topic gin_trgm_ops);
CREATE INDEX IF NOT EXISTS companions_name_trgm_idx ON companions USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS session_history_user_created_idx ON session_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS session_history_created_idx ON session_history(created_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_user_created_idx ON bookmarks(user_id, created_at DESC);
