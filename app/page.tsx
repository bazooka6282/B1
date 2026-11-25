import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BusFront, Mail, MessageCircle, Phone } from 'lucide-react';
import { Header, Wordmark } from './brand';
import { getFleet, getContact } from '../lib/public-fleet';
import { numberPlate, photos } from '../lib/fleet';
import { Gallery } from './gallery';
import { FleetHero } from './fleet-hero';

export const dynamic = 'force-dynamic';

const phone = '+916282490768';
const displayPhone = '+91 6282490768';
const whatsapp = 'https://wa.me/' + phone.slice(1);
const tpMessage = 'Hello BAZOOKA, I would like to enquire about TP bus service.\nTrip dates:\nPickup location:\nDestination:\nPassenger count:';

const rainScenes: Record<string, string> = {
  '/fleet/ayshu-editorial.webp': 'ayshu',
  '/fleet/feemol-editorial.webp': 'feemol',
  '/fleet/zaeem-editorial.webp': 'zaeem',
  '/fleet/route-editorial.webp': 'route',
  '/fleet/kl55g7430-bazooka.webp': 'kl55g7430',
};

function showcaseOrder(registration: string) {
  if (registration === 'KL05Z2113') return 0;
  if (registration === 'KL55G7430') return 2;
  return 1;
}

export default async function Home() {
  const [vehicles, emailSetting] = await Promise.all([getFleet(), getContact()]);
  const email = emailSetting ?? 'bazooka6282@gmail.com';
  const contactLinks = [
    { label: 'Call', detail: displayPhone, href: 'tel:' + phone, Icon: Phone },
    { label: 'WhatsApp', detail: displayPhone, href: whatsapp, Icon: MessageCircle },
    { label: 'Email', detail: email, href: 'mailto:' + email, Icon: Mail },
  ];
  const fleet = vehicles.slice().sort((a, b) => showcaseOrder(a.registration) - showcaseOrder(b.registration));
  const slides = fleet.flatMap(bus => {
    const photo = photos(bus)[0];
    if (!photo) return [];
    const scene = rainScenes[photo];
    return [{
      src: scene ? '/fleet/' + scene + '-monsoon.webp' : photo,
      mobileSrc: scene ? '/fleet/' + scene + '-monsoon-mobile.webp' : undefined,
      name: bus.name,
      registration: bus.registration,
    }];
  });
  const serviceBus = fleet.find(bus => bus.category === 'TP' && photos(bus)[0]);
  const servicePhoto = serviceBus && photos(serviceBus)[0];
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

      <section id="tp-services" className="tp-services" aria-labelledby="tp-heading">
        <div className="wrap tp-services-layout">
          <div>
            <p className="location"><BusFront size={16} aria-hidden="true" /> Private bus service in Kerala</p>
            <h2 id="tp-heading">Temporary permit (TP) bus services</h2>
            <p className="tp-description">BAZOOKA provides private bus services under temporary permits. Share your trip dates, pickup location, destination, and passenger count so we can confirm what’s available for your trip.</p>
            <div className="tp-actions">
              <a className="front-action" href={whatsapp + '?text=' + encodeURIComponent(tpMessage)}><MessageCircle size={18} aria-hidden="true" /> Enquire on WhatsApp</a>
              <a className="tp-call" href={'tel:' + phone}><Phone size={18} aria-hidden="true" /> Call {displayPhone}</a>
            </div>
          </div>
          {serviceBus && servicePhoto && <figure>
            <img src={servicePhoto} alt={serviceBus.name + ', a BAZOOKA temporary permit bus'} loading="lazy" />
            <figcaption><Link href={'/fleet/' + serviceBus.registration}>{serviceBus.name} · {numberPlate(serviceBus.registration)} <ArrowUpRight size={16} aria-hidden="true" /></Link></figcaption>
          </figure>}
        </div>
      </section>

      <section id="about" className="wrap fleet-story">
        <img src="/fleet/road-cleared.webp" alt="A BAZOOKA bus on a tree-lined Kerala road" loading="lazy" width={1440} height={960} />
        <div><h2>About BAZOOKA</h2><p>BAZOOKA operates a private fleet in Kerala. The buses share a blue livery, and each carries its own windshield artwork and details.</p><Link className="front-action" href="#contact">Contact BAZOOKA <ArrowUpRight size={17} /></Link></div>
      </section>

      {shots.length > 0 && <section id="gallery" className="gallery-section"><div className="wrap"><h2>Fleet gallery</h2><Gallery shots={shots} /></div></section>}
      <section id="contact" className="fleet-contact" aria-labelledby="contact-heading">
        <div className="wrap">
          <h2 id="contact-heading">Contact BAZOOKA</h2>
          <div className="contact-grid">
            {contactLinks.map(({ label, detail, href, Icon }) => <a className="contact-card" key={label} href={href}>
              <Icon size={20} aria-hidden="true" />
              <span><strong>{label}</strong><span className="contact-detail">{detail}</span></span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>)}
          </div>
        </div>
      </section>
    </main>
    <footer><div className="wrap footer"><Wordmark /><span>Private bus operations · Kerala, India</span><a href="https://webappzz.com/">Powered by Webappzz Technologies</a></div></footer>
    <a className="floating-whatsapp" href={whatsapp} aria-label="Chat with BAZOOKA on WhatsApp">
      <MessageCircle size={20} aria-hidden="true" /> WhatsApp
    </a>
  </div>;
}
