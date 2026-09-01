# SRT Driver Control

Initial Next.js application configured for Supabase. The home screen performs a
read-only connection test against the existing `public.drivers` table.

## Step 1 — Requirements

- Node.js 20.9 or newer
- pnpm (recommended) or npm
- Your existing Supabase project

## Step 2 — Install packages

From this project folder:

```bash
pnpm install
```

The required Supabase packages are already listed in `package.json`:

- `@supabase/supabase-js`
- `@supabase/ssr`

## Step 3 — Add environment variables

Copy `.env.example` to `.env.local`, then replace both placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
APP_ALLOWED_EMAIL=your-private-login-email@example.com
```

Find the URL and publishable key in the Supabase Dashboard under **Project Settings → API**.
The publishable key is intentionally used with the signed-in user session and Row Level
Security. `APP_ALLOWED_EMAIL` is read only by the Next.js server and limits the application to
the private account created by the owner. `.env.local` is ignored by Git.

The cloud-ready version uses Supabase email/password authentication and only accepts the email
configured in `APP_ALLOWED_EMAIL`. Create that user manually in **Supabase → Authentication →
Users**, disable public sign-ups, then run migrations `004_cloud_security.sql` and
`005_authenticated_access.sql` in order before making the cloud URL public. Migration 005
authorizes the account automatically when the project has exactly one Auth user.

## Step 4 — Start the application

```bash
pnpm dev
```

Open <http://localhost:3000>. A green result confirms that Next.js can query the
`drivers` table and shows its row count.

### One-click Windows launcher

Double-click `Start SRT Driver Control.cmd` in the project folder. It starts the
local server, waits until it is ready, and opens the application automatically.
Keep the launcher window open while using the application. Press `Ctrl+C` in
that window to stop it.

## Data backup

Open **Backup** from the Dashboard to download a complete application-data snapshot or
individual CSV files. The download never contains environment variables or Supabase keys.
Follow [BACKUP-AND-RECOVERY.md](BACKUP-AND-RECOVERY.md) for the recommended schedule,
complete Supabase backups, and the recovery procedure.

Double-click `Create Safe Project Backup.cmd` after application changes to create a compact ZIP
of the project without temporary files or `.env.local`.

For a final code and production-build check, stop the running application and double-click
`Check SRT Application.cmd`. This check is read-only with respect to Supabase data.

## Step 5 — Understand test errors

- **Missing variables**: create `.env.local`, save it, and restart the server.
- **Invalid API key / Failed to fetch**: re-copy the URL and publishable key.
- **Could not find the table `public.drivers`**: confirm the earlier database SQL
  was run in this same Supabase project.
- **Permission denied / row-level security**: confirm migrations 004 and 005 were run and the
  signed-in Auth user appears in `public.app_authorized_users`.

## Included structure

```text
src/
  app/
    layout.tsx
    page.tsx              # Read-only connection test
  lib/supabase/
    client.ts             # Browser components
    server.ts             # Server components and route handlers
```

Authentication, session-refresh proxy logic, and operational pages are
intentionally deferred until this connection test passes.
