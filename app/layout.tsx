import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './style.css';
import { siteDescription, siteImage, siteOrigin, siteTitle } from '../lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: siteTitle, template: '%s | BAZOOKA' },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: 'BAZOOKA',
    locale: 'en_IN',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: siteImage, width: 1807, height: 870, alt: 'Blue BAZOOKA bus on a Kerala road at dusk' }],
  },
  twitter: { card: 'summary_large_image', title: siteTitle, description: siteDescription, images: [siteImage] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
