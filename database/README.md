# SciTrace AI — Database Layer (Supabase PostgreSQL)

This directory contains the schema definitions, migrations, and Row Level Security (RLS) policies for SciTrace AI.

---

## 🗄️ Tables Architecture

1. **`analyses`**:
   - Stores analysis metadata, title, user ownership (`user_id`), status (`processing`, `completed`, `failed`), and progress percentage (0-100).
   - Foreign key: `user_id REFERENCES auth.users(id) ON DELETE CASCADE`.
2. **`papers`**:
   - Stores uploaded research document metadata (`analysis_id`, `filename`, `storage_path`, `file_size`, `page_count`, `authors`, `year`, `is_scanned`).
   - Foreign key: `analysis_id REFERENCES analyses(id) ON DELETE CASCADE`.
3. **`claims`**:
   - Stores extracted empirical and rhetorical scientific claims with verbatim text, normalized text, page numbers, and qualifiers.
   - Foreign key: `paper_id REFERENCES papers(id) ON DELETE CASCADE`.
4. **`relationships`**:
   - Stores cross-paper NLI classifications (`contradiction`, `supporting`, `neutral`), confidence score, cosine similarity score, probability distributions, and provenance.
   - Foreign keys: `source_claim_id REFERENCES claims(id) ON DELETE CASCADE`, `target_claim_id REFERENCES claims(id) ON DELETE CASCADE`.

---

## 🔒 Row Level Security (RLS)

All 4 tables have RLS enabled:
- Authenticated users can only read, insert, update, and delete rows belonging to their own user account (`auth.uid() = user_id`).
- Backend writes with `service_role` token bypass RLS safely via defined service role policies.
- File storage uses private tenant buckets: `{user_id}/{analysis_id}/{filename}`.

---

## 🚀 How to Apply Schema

1. Open the **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy and run the contents of `database/schema.sql`.
4. Verify RLS policies by running `database/verify_rls.sql`.
