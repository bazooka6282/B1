# BAZOOKA

A Next.js website and fleet accounting dashboard for a private bus operator in Kerala.

## Local development

Copy .env.example to .env.local and set the Supabase URL and publishable key. Run npm ci and npm run dev.

## Supabase

Apply supabase/migrations/202611250001_initial.sql to a fresh project. The migration seeds the five vehicle registrations and creates the storage buckets, public showcase functions and restricted account tables. Create or invite an admin user in Supabase Auth, then insert that user's UUID into public.admins using the SQL editor. Configure the application URL and /auth/callback in Supabase Auth URL configuration. The administrator can set a public contact email in Website & reminders.

## Vercel

Import the repository as a Next.js project. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the deployment. Use a publishable key because browser requests are protected by row-level security.

## Accounting

TP agreed and additional revenue belongs in the session. Daily ticket collections and route costs belong in Daily accounts. Separate Revenue records are for additional independent income. Enter TP or general operating costs in Expenses. Fleet purchases and sales are tracked separately from operating profit. CSV exports open in Excel, and print reports can be saved as PDF.

Vehicle KL55G7430 is listed with a placeholder until its photograph can be confirmed.
