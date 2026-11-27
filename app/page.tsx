import Link from 'next/link';
import { ArrowUpRight, BusFront, Mail, MessageCircle, Phone } from 'lucide-react';
import { Header, Wordmark } from './brand';
import { getFleet, getContact } from '../lib/public-fleet';
import { numberPlate, photos } from '../lib/fleet';
import { Gallery } from './gallery';
import { FleetHero } from './fleet-hero';
import './showcase.css';

export const dynamic = 'force-dynamic';

const phone = '+916282490768';
const displayPhone = '+91 6282490768';
const whatsapp = 'https://wa.me/' + phone.slice(1);
const tpMessage = 'Hello BAZOOKA, I would like to enquire about TP bus service.\nTrip dates:\nPickup location:\nDestination:\nPassenger count:';
const whatsappEnquiry = whatsapp + '?text=' + encodeURIComponent(tpMessage);

function InstagramIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>;
}

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
    { label: 'WhatsApp', detail: displayPhone, href: whatsappEnquiry, Icon: MessageCircle },
    { label: 'Email', detail: email, href: 'mailto:' + email, Icon: Mail },
    { label: 'Instagram', detail: '@__team_bazooka_', href: 'https://www.instagram.com/__team_bazooka_?utm_source=ig_web_button_share_sheet&knvt=ZDNlZDc0MzIxNw==', Icon: InstagramIcon },
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
  const serviceBus = fleet.find(bus => bus.category === 'TP' && photos(bus)[1])
    ?? fleet.find(bus => bus.category === 'TP' && photos(bus)[0]);
  const servicePhoto = serviceBus && (photos(serviceBus)[1] ?? photos(serviceBus)[0]);
  const shots = fleet.flatMap(bus => photos(bus).slice(0, 2).map(src => ({ src, name: bus.name, registration: bus.registration })));

  return <div className="public-site">
    <Header overlay />
    <main>
      <FleetHero slides={slides} />

      <section id="fleet" className="kerala-fleet kerala-section" aria-labelledby="fleet-heading">
        <div className="wrap">
          <header className="kerala-section-head">
            <h2 id="fleet-heading">Our fleet</h2>
            <p lang="ml">നമ്മുടെ വണ്ടികൾ</p>
          </header>
          <div className="kerala-fleet-grid" id="fleet-list" data-featured={fleet.length >= 3 || undefined}>{fleet.map(bus => {
            const photo = photos(bus)[0];
            return <Link key={bus.registration} href={'/fleet/' + bus.registration} className="kerala-bus">
              <div className="kerala-bus-photo">{photo ? <img src={photo} alt={bus.name + ' ' + numberPlate(bus.registration)} loading="lazy" /> : <div className="no-photo"><BusFront size={36} /><span>Photo pending</span></div>}</div>
              <div className="kerala-bus-caption">
                <div><h3>{bus.name}</h3><span>{numberPlate(bus.registration)}</span></div>
                <small>{bus.category === 'TP' ? 'Temporary permit' : 'Regular permit'}</small>
                <ArrowUpRight size={18} aria-hidden="true" />
              </div>
            </Link>;
          })}</div>
          {!fleet.length && <p>No vehicles are currently listed.</p>}
        </div>
      </section>

      <section id="tp-services" className="kerala-services kerala-section" aria-labelledby="tp-heading">
        <div className="wrap kerala-services-layout">
          {serviceBus && servicePhoto && <figure>
            <img src={servicePhoto} alt={serviceBus.name + ', a BAZOOKA temporary permit bus'} loading="lazy" />
            <figcaption><Link href={'/fleet/' + serviceBus.registration}>{serviceBus.name} · {numberPlate(serviceBus.registration)} <ArrowUpRight size={16} aria-hidden="true" /></Link></figcaption>
          </figure>}
          <div className="kerala-service-copy">
            <p className="kerala-location">Private bus service in Kerala</p>
            <h2 id="tp-heading">Temporary permit bus services</h2>
            <p>Share your trip dates, pickup point, destination, and passenger count. We’ll check which buses are available for your trip.</p>
            <div className="tp-actions">
              <a className="kerala-booking-link" href={whatsappEnquiry}><MessageCircle size={18} aria-hidden="true" /> Enquire on WhatsApp</a>
              <a className="tp-call" href={'tel:' + phone}><Phone size={18} aria-hidden="true" /> Call {displayPhone}</a>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="kerala-about kerala-section" aria-labelledby="about-heading">
        <div className="wrap">
          <div className="kerala-about-head">
            <div><p className="kerala-location" lang="ml">തൃശ്ശൂർ, കേരളം</p><h2 id="about-heading">About BAZOOKA</h2></div>
            <div><p>BAZOOKA operates a private fleet in Kerala. The buses share a blue livery, and each carries its own windshield artwork and details.</p><Link className="kerala-text-link" href="#contact">Contact BAZOOKA <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          </div>
          <figure>
            <img src="/fleet/road-cleared.webp" alt="A BAZOOKA bus on a tree-lined Kerala road" loading="lazy" width={1440} height={960} />
            <figcaption><q lang="ml">ഓരോ വണ്ടിക്കും ഓരോ മുഖം.</q><span>Each bus has a face of its own.</span></figcaption>
          </figure>
        </div>
      </section>

      {shots.length > 0 && <section id="gallery" className="kerala-gallery kerala-section" aria-labelledby="gallery-heading">
        <div className="wrap">
          <header className="kerala-section-head"><h2 id="gallery-heading">Fleet gallery</h2><p>Open any photo for a closer look.</p></header>
          <Gallery shots={shots} captions />
        </div>
      </section>}
      <section id="contact" className="kerala-contact kerala-section" aria-labelledby="contact-heading">
        <div className="wrap kerala-contact-layout">
          <div><h2 id="contact-heading">Contact BAZOOKA</h2><p lang="ml">ബന്ധപ്പെടാം</p></div>
          <div className="kerala-contact-list">
            {contactLinks.map(({ label, detail, href, Icon }) => <a className="kerala-contact-link" key={label} href={href}>
              <Icon size={20} aria-hidden="true" />
              <strong>{label}</strong><span>{detail}</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>)}
          </div>
        </div>
      </section>
    </main>
    <footer><div className="wrap footer"><Wordmark /><span>Private bus operations · Kerala, India</span><a href="https://webappzz.com/">Powered by Webappzz Technologies</a></div></footer>
    <a className="floating-whatsapp" href={whatsappEnquiry} aria-label="Chat with BAZOOKA on WhatsApp">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.63 15.06L2 22l5.09-1.33A10 10 0 1 0 12 2zm0 18.3a8.3 8.3 0 0 1-4.64-1.42l-2.95.77.79-2.86A8.3 8.3 0 1 1 12 20.3z" />
        <path d="M8.6 7.35c-.24 0-.56.08-.85.4-.29.32-1.02 1-1.02 2.41 0 1.42 1.05 2.8 1.19 2.99.15.2 2.06 3.12 4.99 4.25 2.44.94 2.94.75 3.47.7.53-.05 1.73-.7 1.97-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34l-1.98-.94c-.26-.1-.45-.15-.64.14-.19.29-.74.94-.9 1.13-.17.2-.34.22-.63.08-.28-.14-1.2-.44-2.28-1.4-.84-.75-1.4-1.67-1.56-1.96-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.09-.19.04-.36-.03-.51l-.88-2.13c-.22-.55-.45-.51-.63-.52h-.69z" />
      </svg>
    </a>
  </div>;
}
