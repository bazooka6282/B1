import { NextResponse } from 'next/server';
import { serverClient } from '../../../lib/server';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const client = await serverClient();
  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/login/update', url));
  }
  if (client && url.searchParams.get('type') === 'recovery') {
    const token_hash = url.searchParams.get('token_hash');
    if (token_hash) {
      const { error } = await client.auth.verifyOtp({ token_hash, type: 'recovery' });
      if (!error) return NextResponse.redirect(new URL('/login/update', url));
    }
  }
  return NextResponse.redirect(new URL('/login', url));
}
