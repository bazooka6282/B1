import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';

export function Brand({ href='/' }: { href?: string }) {
  return <Link className="brand" href={href}><img src="/logo.svg" width="39" height="39" alt="" /><span>BAZOOKA<small>FLEET OPERATIONS</small></span></Link>;
}
export function Header() {
  return <header className="site-head"><div className="wrap top"><Brand/><nav aria-label="Main navigation"><Link href="/#about">About</Link><Link href="/#fleet">Our Fleet</Link><Link href="/#gallery">Gallery</Link></nav><Link className="login-link" href="/login"><LockKeyhole size={15}/> Admin Login</Link></div></header>;
}
