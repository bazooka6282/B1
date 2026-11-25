import { createClient } from '@supabase/supabase-js';
import { seed, type Bus } from './fleet';

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export async function getFleet(): Promise<Bus[]> {
  if (!url || !key) return seed;
  const client = createClient(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } });
  const { data, error } = await client.rpc('showcase_fleet');
  if (error) {
    console.error('Unable to load public fleet', error.message);
    return [];
  }
  return data ?? [];
}

export async function getContact(): Promise<string | null> {
  if (!url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  const { data } = await client.rpc('showcase_contact');
  return typeof data === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data) ? data : null;
}
