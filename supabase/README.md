# Supabase staged migration

The initial migration creates the Frensic Luxury tables, authentication profiles, indexes, update triggers, and row-level security policies. The live application remains on Base44 until the schema and migrated data have been verified.

## GitHub deployment

1. Add `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` as GitHub repository secrets.
2. Copy `supabase/github-workflow.yml` to `.github/workflows/supabase-migrations.yml` in GitHub.
3. Run **Deploy Supabase Migrations** from the repository Actions tab.

The workflow is manual by design so database changes cannot deploy accidentally during the staged migration.