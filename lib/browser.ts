'use client';
import { createBrowserClient } from '@supabase/ssr';
type RecordValues = Record<string, string | number | boolean | null>;
type Database = { public: { Tables: Record<string, { Row: RecordValues; Insert: RecordValues; Update: RecordValues; Relationships: [] }>; Views: Record<never, never>; Functions: Record<never, never> } };
export function browserClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
