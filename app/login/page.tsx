import { Wordmark } from '../brand';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SignIn } from './sign-in';
export default function Login() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <main className="auth admin-login">
    <header className="login-header">
      <Wordmark />
      <Link href="/" className="login-back"><ArrowLeft size={16} aria-hidden="true" /> Back to website</Link>
    </header>
    <div className="auth-art" aria-hidden="true" />
    <div className="auth-form"><SignIn configured={configured} /></div>
  </main>;
}
