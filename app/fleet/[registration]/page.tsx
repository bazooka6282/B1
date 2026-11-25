import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '../../brand';
import { Gallery } from '../../gallery';
import { getFleet } from '../../../lib/public-fleet';
import { numberPlate, photos } from '../../../lib/fleet';

export default async function Profile({ params }: { params: Promise<{ registration: string }> }) {
  const { registration } = await params;
  const bus = (await getFleet()).find(item => item.registration === registration);
  if (!bus) notFound();
  const shots = photos(bus).map(src => ({ src, name: bus.name, registration }));
  return <><Header/><main className="wrap profile"><Link className="back-link" href="/#fleet">Back to fleet</Link><p className="eyebrow dark"><span/>{bus.category === 'TP' ? 'TEMPORARY PERMIT' : 'REGULAR PERMIT'}</p><h1>{bus.name}</h1><p className="plate">{numberPlate(registration)}</p>{shots.length > 0 ? <Gallery shots={shots}/> : <p>Vehicle photography is pending.</p>}</main></>;
}
