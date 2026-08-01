-- Example RLS policies for eduportal_kv
-- Adapt these to match your JWT claim names and desired access model.
-- NOTE: auth.jwt() returns a JSON object of the JWT claims in Supabase.

-- 1) Allow public read for a specific directory used for published site content
--    e.g., keys that start with 'public:'
CREATE POLICY public_read ON public.eduportal_kv
  FOR SELECT
  TO public
  USING (key LIKE 'public:%');

-- 2) Owner users: allow full access when JWT contains owner=true
CREATE POLICY owner_full_access_select ON public.eduportal_kv
  FOR SELECT
  TO authenticated
  USING (((auth.jwt() ->> 'owner')::boolean) = true);
CREATE POLICY owner_full_access_mod ON public.eduportal_kv
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (((auth.jwt() ->> 'owner')::boolean) = true)
  WITH CHECK (((auth.jwt() ->> 'owner')::boolean) = true);

-- 3) School-scoped users: allow them to read/write keys prefixed with their schoolId
--    Assumes JWT has a 'schoolId' claim (string). Adjust prefix logic to match your key format.
CREATE POLICY school_scoped_select ON public.eduportal_kv
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'schoolId') IS NOT NULL
    AND key LIKE (auth.jwt() ->> 'schoolId') || ':%'
  );
CREATE POLICY school_scoped_mod ON public.eduportal_kv
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'schoolId') IS NOT NULL
    AND key LIKE (auth.jwt() ->> 'schoolId') || ':%'
  )
  WITH CHECK (
    (auth.jwt() ->> 'schoolId') IS NOT NULL
    AND key LIKE (auth.jwt() ->> 'schoolId') || ':%'
  );

-- 4) Fallback: deny everything else by having no policy for it (Postgres default)

-- Remember: After creating policies, enable RLS on the table:
-- ALTER TABLE public.eduportal_kv ENABLE ROW LEVEL SECURITY;
