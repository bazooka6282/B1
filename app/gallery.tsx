'use client';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { numberPlate } from '../lib/fleet';

type Shot = { src: string; name: string; registration: string };
export function Gallery({ shots, captions = false }: { shots: Shot[]; captions?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, select] = useState(0);
  const shot = shots[index];
  function step(direction: number) { select(current => (current + direction + shots.length) % shots.length); }
  return <><div className={captions ? 'kerala-photo-grid' : 'gallery-grid'}>{shots.map((item, i) => <button key={item.registration + ':' + item.src} type="button" onClick={() => { select(i); dialog.current?.showModal(); }} aria-label={'Open photo of ' + item.name + ' ' + numberPlate(item.registration)}>
    <img src={item.src} alt={item.name} loading="lazy"/>
    {captions && <span>{item.name} <small>{numberPlate(item.registration)}</small></span>}
  </button>)}</div>
    <dialog className="lightbox" aria-label="Fleet photo viewer" ref={dialog} onKeyDown={event => { if (event.key === 'ArrowLeft') step(-1); if (event.key === 'ArrowRight') step(1); }}>
      <div className="lightbox-bar"><button type="button" onClick={() => dialog.current?.close()} aria-label="Close gallery"><X/></button></div>
      {shot && <img src={shot.src} alt={shot.name}/>}
      <div className="lightbox-bar"><button onClick={() => step(-1)} aria-label="Previous photo"><ChevronLeft/></button><span>{shot?.name} · {numberPlate(shot?.registration ?? '')}</span><button onClick={() => step(1)} aria-label="Next photo"><ChevronRight/></button></div>
    </dialog></>;
}
