# SRT Driver Control — Backup and Recovery

## Recommended routine

1. Open **Backup** from the application Dashboard.
2. Click **Download full backup** once each week and after any large data update.
3. Keep the original JSON file unchanged.
4. Store two copies: one on the PC and one on an external drive or private cloud folder.
5. Once a month, download a complete Supabase database backup as described below.

The application backup contains drivers, regions, vehicles, trips, and application settings.
It does not contain passwords, API keys, database functions, triggers, or the database schema.
CSV downloads are convenient spreadsheet copies, but the full JSON file is the better
application-data backup.

## Complete Supabase backup

Supabase paid plans provide downloadable database backups in the Supabase Dashboard under
**Database → Backups**. Availability and retention depend on the current plan. Supabase advises
Free-plan users to export their data regularly. See the official
[Database Backups guide](https://supabase.com/docs/guides/platform/backups).

For an independent backup, use the official Supabase CLI and Docker. Obtain the Session Pooler
connection string and database password from the Supabase Dashboard, then create three files:

```powershell
supabase db dump --db-url "YOUR_CONNECTION_STRING" -f roles.sql --role-only
supabase db dump --db-url "YOUR_CONNECTION_STRING" -f schema.sql
supabase db dump --db-url "YOUR_CONNECTION_STRING" -f data.sql --use-copy --data-only
```

Follow Supabase's official [backup and restore instructions](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
for the current commands. Store the files privately because they can contain confidential
business information. Never put them in a public repository.

## Recovery procedure

If only the local application stops working:

1. Confirm the internet connection and Supabase project status.
2. Keep the current project folder; do not delete it.
3. Reinstall packages with `pnpm.cmd install` and restart with the one-click launcher.
4. Restore `.env.local` from a private record of the Supabase URL and keys if it is missing.

If business data is damaged or deleted:

1. Stop entering new records so the damage does not spread.
2. Copy all current backup files to a separate safety folder.
3. Identify the most recent backup from before the problem.
4. Restore the complete Supabase roles, schema, and data backup to a safe test project first.
5. Check driver, region, vehicle, trip, lock, calculation, and report behavior.
6. Only after verification, restore the production project or reconnect the application to the
   recovered project.

Restoring a database can overwrite current information. Do not run a restore directly against
the live project without first testing it or obtaining experienced help. The application JSON
file is intended as a safe data snapshot; automatic overwrite/import is intentionally not
included.

## Back up the application files

Double-click **Create Safe Project Backup.cmd** whenever the application is changed. It creates
a dated ZIP inside the nearby `SRT Project Backups` folder and opens that folder when finished.
The ZIP automatically excludes `node_modules`, `.next`, and `.env.local`, so it is compact and
does not contain the private Supabase keys.

Copy the resulting ZIP to an external drive or private cloud folder. Keep a separate, private
record of the values from `.env.local`; the application cannot reconnect to Supabase without
them.

The essential project items are `src`, `public`, `supabase`, the package files, configuration
files, the launcher, and this guide.

## Final application check

Close the running SRT application, then double-click **Check SRT Application.cmd**. It checks
code quality and creates the production version that can later be deployed to a cloud server.
The check reads project files and does not add, edit, or delete Supabase records.
