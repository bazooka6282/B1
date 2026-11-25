import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import './style.css';

export const metadata: Metadata = {
  title: { default: 'BAZOOKA | Kerala Bus Fleet', template: '%s | BAZOOKA' },
  description: 'Explore the BAZOOKA fleet and enquire about private bus services under temporary permits in Kerala.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
