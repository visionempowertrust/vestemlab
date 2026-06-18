# Supabase setup

The portal uses the same Supabase project and `registered_students` table as VICT Assessment.

1. Open the Supabase SQL Editor for project `yhaloppwmvdyzssknkpc`.
2. Run the complete contents of `supabase-schema.sql` once.
3. Reload the STEM Lab portal.

On the first successful load, the portal inserts all bundled ARC resources and NCERT activities into `stemlab_resources` and `stemlab_manuals`. New lab sessions are stored in `stemlab_sessions`. School and facilitator registrations use `stemlab_schools` and `stemlab_facilitators`.

The publishable browser key cannot create tables, so the SQL step requires a project administrator. Browser storage remains available as a fallback until setup is complete.
