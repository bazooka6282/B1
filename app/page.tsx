import Link from 'next/link';
import { ArrowDown, ArrowUpRight, BusFront, MapPin } from 'lucide-react';
import { Brand, Header } from './brand';
import { getFleet, getContact } from '../lib/public-fleet';
import { numberPlate, photos } from '../lib/fleet';
import { Gallery } from './gallery';

export default async function Home() {
  const [fleet, contact] = await Promise.all([getFleet(), getContact()]);
  const lead = fleet.find(bus => bus.registration === 'KL05Z2113' && bus.photo) ?? fleet.find(bus => bus.photo);
  const shots = fleet.flatMap(bus => photos(bus).map(src => ({ src, name: bus.name, registration: bus.registration })));
  return <><Header/><main>
    <section className="hero">
      {lead?.photo && <img className="hero-photo" src={lead.photo} alt={lead.name + ' BAZOOKA bus in Kerala'} fetchPriority="high"/>}
      <div className="hero-scrim"/>
      <div className="wrap hero-inner">
        <div className="hero-copy"><p className="eyebrow"><MapPin size={15}/> KERALA, INDIA</p>
          <h1>BAZOOKA<span>BUS FLEET</span></h1>
          <p className="intro">Meet the blue buses of BAZOOKA, an independent private bus operator in Kerala.</p>
          <Link className="button primary" href="#fleet">Explore the fleet</Link>
        </div>
        <div className="hero-foot"><Link href="#about" className="jump" aria-label="Continue to About"><ArrowDown size={17}/></Link>{lead && <div className="vehicle-caption"><span>FEATURED VEHICLE</span><strong>{lead.name} <i/> {numberPlate(lead.registration)}</strong></div>}</div>
      </div>
    </section>
    <section id="about" className="wrap about"><p className="eyebrow dark"><span/> ABOUT BAZOOKA</p><div><h2>INDEPENDENT BUS OPERATIONS</h2><p>BAZOOKA operates a private fleet in Kerala. Our temporary-permit buses share a blue livery, with individual names and artwork across the fleet.</p><img className="about-photo" src="/fleet/road.webp" alt="A BAZOOKA bus on a tree-lined road in Kerala" loading="lazy"/></div></section>
    <section id="fleet" className="fleet-section"><div className="wrap"><div className="section-title"><div><p className="eyebrow dark"><span/> THE VEHICLES</p><h2>OUR FLEET</h2></div><span className="count">{fleet.length} {fleet.length === 1 ? 'vehicle' : 'vehicles'}</span></div>
      <div className="fleet-grid">{fleet.map(bus => <Link key={bus.registration} href={'/fleet/' + bus.registration} className="vehicle-card">
        <div className="vehicle-image">{bus.photo ? <img src={bus.photo} alt={bus.name + ' ' + numberPlate(bus.registration)} loading="lazy"/> : <div className="no-photo"><BusFront size={52}/><span>Photo pending</span></div>}</div>
        <div className="vehicle-info"><div><small>{bus.category === 'TP' ? 'TEMPORARY PERMIT' : 'REGULAR PERMIT'}</small><h3>{bus.name}</h3><span>{numberPlate(bus.registration)}</span></div><ArrowUpRight size={19}/></div>
      </Link>)}</div>{!fleet.length && <p>No vehicles are currently listed.</p>}
    </div></section>
    {shots.length > 0 && <section id="gallery" className="gallery-section"><div className="wrap"><p className="eyebrow"><span/> FLEET PHOTOGRAPHY</p><h2>GALLERY</h2><Gallery shots={shots}/></div></section>}
  </main><footer><div className="wrap footer"><Brand/><span>Private bus operations · Kerala, India</span>{contact && <a href={'mailto:' + contact}>Contact</a>}<Link href="/login">Admin Login</Link></div></footer></>;
}

