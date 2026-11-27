'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { browserClient } from '../../lib/browser';
import { inr } from '../../lib/fleet';
import { n, sessionDays, shiftTpDate, type Row } from './modules';

export function ExtendTp({client,session,close,saved}:{
 client:ReturnType<typeof browserClient>;
 session:Row;
 close:()=>void;
 saved:(record:Row)=>void;
}) {
 const start=String(session.start_date);
 const currentEnd=String(session.end_date);
 const earliest=shiftTpDate(currentEnd,1);
 const [end,setEnd]=useState(earliest);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const agreed=n(session,'amount');
 const extendedTotal=Math.round(agreed/sessionDays(start,currentEnd)*sessionDays(start,end)*100)/100;

 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(busy||end<earliest)return;
  if(!Number.isFinite(extendedTotal)||extendedTotal>999999999999.99){
   setError('The revised agreed total exceeds the allowed amount.');
   return;
  }
  setBusy(true);
  setError('');
  try{
   const {data,error}=await client.from('sessions').update({end_date:end,amount:extendedTotal})
    .eq('id',session.id).eq('end_date',currentEnd).eq('start_date',start)
    .eq('amount',agreed).eq('status',session.status).select('*').maybeSingle();
   if(error)throw error;
   if(!data)throw new Error('This session changed. Refresh the dashboard before extending it.');
   saved(data);
  }catch(error){setError((error as Error).message);}
  finally{setBusy(false);}
 }

 return <div className="modal-backdrop" onKeyDown={event=>{if(event.key==='Escape'&&!busy)close();}}>
  <section className="modal" role="dialog" aria-modal="true" aria-labelledby="extend-tp-heading">
   <div className="panel-title">
    <h2 id="extend-tp-heading">Extend TP <small>{session.reference}</small></h2>
    <button type="button" className="icon-button" onClick={close} aria-label="Close extension" disabled={busy}><X /></button>
   </div>
   <form className="extend-tp-form" onSubmit={submit}>
    <p>Current end date is {currentEnd.split('-').reverse().join('/')}.</p>
    <label className="field">New end date<input autoFocus required type="date" min={earliest} value={end} disabled={busy} onChange={event=>setEnd(event.target.value)} /></label>
    {end>=earliest&&<p>Revised agreed total at the same daily rate is {inr(extendedTotal)}. Extra days count as revenue only after payment approval.</p>}
    {error&&<p className="message error" role="alert">{error}</p>}
    <div className="modal-actions">
     <button type="button" className="button secondary" disabled={busy} onClick={close}>Cancel</button>
     <button className="button primary" disabled={busy}>{busy?'Extending…':'Save extension'}</button>
    </div>
   </form>
  </section>
 </div>;
}
