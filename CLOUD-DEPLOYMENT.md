# SRT Driver Control — Cloud Deployment

This application is prepared for deployment to Vercel while continuing to use the existing
Supabase database.

## Security completed before deployment

- Supabase email/password login is required.
- Only the email in `APP_ALLOWED_EMAIL` can pass the application security check.
- Public account creation is disabled in Supabase.
- Row Level Security blocks anonymous visitors.
- `app_authorized_users` limits database access to the approved Auth user.
- The Supabase secret key is not required in the cloud deployment.

## Required Vercel environment variables

Add these three variables to Production, Preview, and Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
APP_ALLOWED_EMAIL
```

Copy their values from the private local `.env.local` file. Never upload or commit
`.env.local`, database backups, or private credentials.

## Deployment flow

1. Run the final application checker locally.
2. Create a private GitHub repository and upload the project without `.env.local`, `.next`,
   `node_modules`, or backup files.
3. Import the repository into Vercel as a Next.js project.
4. Add the three environment variables before the first production deployment.
5. Deploy and open the generated HTTPS address.
6. Confirm the login, Dashboard, one edit, reports, printing, and backup download.
7. Add the Vercel address to the Supabase Auth URL configuration if redirect-based Auth features
   are enabled in the future.

Vercel encrypts environment variables at rest, but anyone with suitable project access can use
them. Keep the Vercel and GitHub accounts protected with strong passwords and two-factor
authentication.
