import Link from 'next/link';
import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { BusFront } from 'lucide-react';
import { Header } from '../../brand';
import { Gallery } from '../../gallery';
import { getFleet } from '../../../lib/public-fleet';
import { numberPlate, photos } from '../../../lib/fleet';
import '../../showcase.css';
import { siteImage } from '../../../lib/site';

type ProfileProps = { params: Promise<{ registration: string }> };
const findBus = cache(async (registration: string) => (await getFleet()).find(item => item.registration === registration));

export async function generateMetadata({ params }: ProfileProps): Promise<Metadata> {
  const { registration } = await params;
  const bus = await findBus(registration);
  if (!bus) notFound();
  const title = bus.name + ' · ' + numberPlate(registration);
  const description = 'See photos and details of ' + title + ', a ' + (bus.category === 'TP' ? 'temporary permit' : 'regular permit') + ' bus in the BAZOOKA fleet in Kerala.';
  const path = '/fleet/' + registration;
  const image = photos(bus)[0] ?? siteImage;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: 'BAZOOKA', type: 'website', locale: 'en_IN', images: [{ url: image, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function Profile({ params }: ProfileProps) {
  const { registration } = await params;
  const bus = await findBus(registration);
  if (!bus) notFound();

  const shots = photos(bus).map(src => ({ src, name: bus.name, registration }));
  return <div className="public-site showcase-profile">
    <Header />
    <main className="wrap vehicle-profile">
      <Link className="back-link" href="/#fleet">Back to fleet</Link>
      <header><div><p className="location">{bus.category === 'TP' ? 'Temporary permit' : 'Regular permit'}</p><h1>{bus.name}</h1></div><p className="registration">{numberPlate(registration)}</p></header>
      {shots[0] ? <img className="profile-feature" src={shots[0].src} alt={bus.name + ' ' + numberPlate(registration)} fetchPriority="high" /> : <div className="profile-placeholder no-photo"><BusFront size={46} /> Vehicle photography is pending.</div>}
      {bus.category === 'TP' && <Link className="front-action profile-enquiry" href="/#tp-services">Enquire about TP service</Link>}
      {shots.length > 1 && <section className="profile-gallery"><h2>Vehicle photos</h2><Gallery shots={shots.slice(1)} /></section>}
    </main>
  </div>;
}
