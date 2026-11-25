import Link from 'next/link';
import { ArrowDown, ArrowUpRight, BusFront, MapPin } from 'lucide-react';
import { Brand, Header } from './brand';
import { getFleet, getContact } from '../lib/public-fleet';
import { numberPlate, photos } from '../lib/fleet';
import { Gallery } from './gallery';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [fleet, contact] = await Promise.all([getFleet(), getContact()]);
  const lead = fleet.find(bus => bus.registration === 'KL05Z2113' && bus.photo) ?? fleet.find(bus => bus.photo);
  const leadPhoto = lead && photos(lead)[0];
  const shots = fleet.flatMap(bus => photos(bus).slice(0, 2).map(src => ({ src, name: bus.name, registration: bus.registration })));

  return <div className="public-site">
    <Header />
    <main>
      <section className="wrap front">
        <div className="front-copy">
          <p className="location"><MapPin size={16} /> Kerala, India</p>
          <h1>BAZOOKA<br/><em>BUS FLEET</em></h1>
          <p>Meet the private bus fleet behind BAZOOKA’s blue livery.</p>
          <Link className="front-action" href="#fleet">Explore our fleet <ArrowDown size={17} /></Link>
        </div>
        {lead && leadPhoto && <figure className="front-feature">
          <img src={leadPhoto} alt={lead.name + ', a blue BAZOOKA bus, viewed from the front and side'} fetchPriority="high" width={1536} height={1024} />
          <figcaption><Link href={'/fleet/' + lead.registration}><strong>{lead.name}</strong><span>{numberPlate(lead.registration)}</span><ArrowUpRight size={18} /></Link></figcaption>
        </figure>}
      </section>

      <section id="fleet" className="fleet-section">
        <div className="wrap">
          <div className="section-title"><h2>Our fleet</h2><span className="count">{fleet.length} {fleet.length === 1 ? 'vehicle' : 'vehicles'}</span></div>
          <div className="fleet-grid">{fleet.map(bus => {
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
    <footer><div className="wrap footer"><Brand /><span>Private bus operations · Kerala, India</span>{contact && <a href={'mailto:' + contact}>Contact</a>}<Link href="/login">Admin Login</Link></div></footer>
  </div>;
}
