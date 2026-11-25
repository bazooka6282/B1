import { Wordmark } from '../brand';
import { SignIn } from './sign-in';
export default function Login() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <main className="auth"><div className="auth-art"><Wordmark/></div><div className="auth-form"><SignIn configured={configured}/></div></main>;
}
