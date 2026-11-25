'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { numberPlate } from '../lib/fleet';

type Slide = { src: string; name: string; registration: string; mobileSrc?: string };

export function FleetHero({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  function step(direction: number) {
    setIndex(current => (current + direction + slides.length) % slides.length);
  }

  return <section id="home" className="cinema-hero" aria-label="Featured fleet">
    {slide && <picture key={slide.src} className={slide.mobileSrc ? 'cinema-image cinematic' : 'cinema-image'}>
      {slide.mobileSrc && <source media="(max-width: 700px)" srcSet={slide.mobileSrc} />}
      <img src={slide.src} alt={slide.name + ' · ' + numberPlate(slide.registration)} fetchPriority={index === 0 ? 'high' : 'auto'} />
    </picture>}
    <div className="cinema-shade" aria-hidden="true"/>
    <div className="wrap cinema-layout">
      <div className="cinema-copy">
        <div className="cinema-heading">
          <p className="cinema-kicker">Private bus squad</p>
          <h1>BAZOOKA</h1>
          <p className="cinema-tagline">Different machines. One identity.</p>
          <p className="cinema-intro">BAZOOKA provides private bus services under temporary permits in Kerala.</p>
        </div>
        <div className="hero-actions">
          <Link className="cinema-cta" href="#fleet"><span>Explore our fleet</span><ArrowRight size={23}/></Link>
          <Link className="hero-service-link" href="#tp-services">Enquire about TP service</Link>
        </div>
      </div>
      {slide && <div className="cinema-controls">
        <div className="cinema-progress">
          <p aria-live="polite"><strong>{String(index + 1).padStart(2, '0')}</strong> / {String(slides.length).padStart(2, '0')} <Link href={'/fleet/' + slide.registration}>{slide.name}</Link></p>
          {slides.length > 1 && <div className="cinema-dots">{slides.map((item, i) =>
            <button key={item.registration} type="button" aria-label={'Show ' + item.name + ' ' + numberPlate(item.registration)} aria-current={index === i ? 'true' : undefined} onClick={() => setIndex(i)} />
          )}</div>}
        </div>
        {slides.length > 1 && <div className="cinema-arrows">
          <button type="button" aria-label="Previous bus" onClick={() => step(-1)}><ArrowLeft size={21}/></button>
          <button type="button" aria-label="Next bus" onClick={() => step(1)}><ArrowRight size={21}/></button>
        </div>}
      </div>}
    </div>
  </section>;
}
