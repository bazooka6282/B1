'use client';
import { useState } from 'react';
import { browserClient } from '../../../lib/browser';
export default function UpdatePassword() {
  const [message, setMessage] = useState('');
  return <main className="auth-form" style={{minHeight:'100vh'}}><form onSubmit={async event => {
    event.preventDefault();
    try {
      const client = browserClient();
      const {error} = await client.auth.updateUser({ password: String(new FormData(event.currentTarget).get('password')) });
      if (error) throw error;
      location.assign('/admin');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Password could not be updated.'); }
  }}><h1>Set a new password</h1><label className="field">New password<input minLength={12} type="password" name="password" required autoComplete="new-password"/></label>{message && <p role="alert">{message}</p>}<button className="button primary">Update password</button></form></main>;
}
