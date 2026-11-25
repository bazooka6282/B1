import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BusFront } from 'lucide-react';
import { Header, Wordmark } from './brand';
import { getFleet, getContact } from '../lib/public-fleet';
import { numberPlate, photos } from '../lib/fleet';
import { Gallery } from './gallery';
import { FleetHero } from './fleet-hero';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [fleet, contact] = await Promise.all([getFleet(), getContact()]);
  const slides = fleet.flatMap(bus => {
    const photo = photos(bus)[0];
    if (!photo) return [];
    const cinematic = photo === '/fleet/ayshu-editorial.webp';
    return [{ src: cinematic ? '/fleet/ayshu-dusk.webp' : photo, name: bus.name, registration: bus.registration, cinematic }];
  }).sort((a, b) => Number(b.cinematic) - Number(a.cinematic));
  const shots = fleet.flatMap(bus => photos(bus).slice(0, 2).map(src => ({ src, name: bus.name, registration: bus.registration })));

  return <div className="public-site">
    <Header overlay />
    <main>
      <FleetHero slides={slides} />

      <section id="fleet" className="fleet-section">
        <div className="wrap">
          <div className="section-title cinema-fleet-title"><h2>Our fleet</h2><Link href="#fleet-list">View all buses <ArrowRight size={20}/></Link></div>
          <div className="fleet-grid" id="fleet-list">{fleet.map(bus => {
            const photo = photos(bus)[0];
            return <Link key={bus.registration} href={'/fleet/' + bus.registration} className="vehicle-card">
              <div className="vehicle-image">{photo ? <img src={photo} alt={bus.name + ' ' + numberPlate(bus.registration)} loading="lazy" /> : <div className="no-photo"><BusFront size={42} /><span>Photo pending</span></div>}</div>
              <div className="vehicle-info"><div><small>{bus.category === 'TP' ? 'Temporary permit' : 'Regular permit'}</small><h3>{bus.name}</h3><span>{numberPlate(bus.registration)}</span></div><ArrowUpRight size={20} /></div>
            </Link>;
          })}</div>
          {!fleet.length && <p>No vehicles are currently listed.</p>}
        </div>
      </section>

      <section id="about" className="wrap fleet-story">
        <img src="/fleet/road.webp" alt="A BAZOOKA bus on a tree-lined Kerala road" loading="lazy" width={900} height={574} />
        <div><h2>About BAZOOKA</h2><p>BAZOOKA operates a private fleet in Kerala. The buses share a blue livery, and each carries its own windshield artwork and details.</p>{contact && <a className="front-action" href={'mailto:' + contact}>Contact BAZOOKA <ArrowUpRight size={17} /></a>}</div>
      </section>

      {shots.length > 0 && <section id="gallery" className="gallery-section"><div className="wrap"><h2>Fleet gallery</h2><Gallery shots={shots} /></div></section>}
    </main>
    <footer id="contact"><div className="wrap footer"><Wordmark /><span>Private bus operations · Kerala, India</span>{contact && <a href={'mailto:' + contact}>Contact</a>}<Link href="/login">Admin Login</Link></div></footer>
  </div>;
}
