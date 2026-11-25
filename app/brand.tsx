import Link from 'next/link';
import { ArrowRight, UserRound } from 'lucide-react';

export function Brand({ href='/' }: { href?: string }) {
  return <Wordmark href={href} />;
}
export function Wordmark({ href = '/' }: { href?: string }) {
  return <Link href={href} className="public-wordmark"><img src="/bazooka-wordmark.png" width="228" height="44" alt="BAZOOKA" /></Link>;
}

export function Header({ overlay = false }: { overlay?: boolean }) {
  return <header className={'site-head' + (overlay ? ' site-head-overlay' : '')}>
    <div className="wrap top">
      <Wordmark />
      <nav aria-label="Main navigation">
        <Link href="/" aria-current={overlay ? 'page' : undefined}>Home</Link>
        <Link href="/#about">About</Link>
        <Link href="/#fleet">Our Fleet</Link>
        <Link href="/#gallery">Gallery</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
      <Link className="login-link" href="/login"><UserRound size={17}/> Admin Login <ArrowRight size={18}/></Link>
    </div>
  </header>;
}
