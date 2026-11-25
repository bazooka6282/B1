'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { browserClient } from '../../lib/browser';

export function SignIn({ configured }: { configured: boolean }) {
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const fields = new FormData(event.currentTarget);
      const client = browserClient();
      const email = String(fields.get('email')).trim();
      const { error } = reset
        ? await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/auth/callback' })
        : await client.auth.signInWithPassword({ email, password: String(fields.get('password')) });
      if (error) throw error;
      if (reset) setMessage('If an account exists, you’ll receive a password reset link.');
      else location.assign('/admin');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}>
    <div className="login-heading">
      <h1>{reset ? 'Reset password' : 'Admin sign in'}</h1>
      <p>{reset ? 'Enter the email address for your account.' : 'Manage your fleet, trips, and accounts.'}</p>
    </div>
    <label className="field">Email address<input required type="email" autoComplete="email" name="email"/></label>
    {!reset && <label className="field">Password<input required type="password" autoComplete="current-password" name="password"/></label>}
    {(!configured || message) && <div role="status" className="message">{!configured ? 'Supabase configuration is pending.' : message}</div>}
    <button className="button primary login-submit" disabled={!configured || busy}>{busy ? 'Please wait…' : reset ? 'Send reset link' : 'Sign in'}<ArrowRight size={19} aria-hidden="true" /></button>
    <button type="button" className="text-link" onClick={() => { setReset(!reset); setMessage(''); }}>{reset ? 'Return to sign in' : 'Forgot password?'}</button>
  </form>;
}
