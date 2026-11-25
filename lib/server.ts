import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { url, key } from './public-fleet';

export async function serverClient() {
  if (!url || !key) return null;
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: updates => {
        try { updates.forEach(({name, value, options}) => jar.set(name, value, options)); }
        catch { /* The proxy refreshes cookies for Server Components. */ }
      },
    },
  });
}
