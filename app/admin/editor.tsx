'use client';
import { useState,type FormEvent } from 'react';
import { X } from 'lucide-react';
import { browserClient } from '../../lib/browser';
import { inr,numberPlate } from '../../lib/fleet';
import { modules,sessionDays,today,type Data,type Row } from './modules';

const defaultDailyRates=[1800,2000];
const rateMetadataKey='tp_daily_revenue_rates';
const maxRevenue=999999999999.99;

function validDailyRate(value: unknown): value is number {
 return typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=maxRevenue&&Number(value.toFixed(2))===value;
}

function dailyRateOptions(stored: unknown) {
 const custom=Array.isArray(stored)?stored.filter(validDailyRate):[];
 return [...new Set([...defaultDailyRates,...custom])].sort((a,b)=>a-b);
}

export function Editor({client,data,table,row,close,onSaved,onDelete,ratePresets,onRatePresets}:{client:ReturnType<typeof browserClient>;data:Data;table:string;row?:Row;close:()=>void;onSaved:(message:string)=>void;onDelete:(row:Row)=>Promise<void>;ratePresets:unknown;onRatePresets:(rates:number[])=>void}){
 const config=modules[table];
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [values,setValues]=useState<Row>(row??{});
 const tpSession=table==='sessions';
 const existingDocument=table==='expenses'?row?.receipt:table==='fleet_transactions'?row?.document:null;
 const dailyRates=dailyRateOptions(ratePresets);
 const [savingRate,setSavingRate]=useState(false);
 const [dailyRate,setDailyRate]=useState('');
 const [newRate,setNewRate]=useState('');
 const [showNewRate,setShowNewRate]=useState(false);
 const [rateError,setRateError]=useState('');
 const startDate=String(values.start_date??today());
 const endDate=String(values.end_date??today());
 const days=sessionDays(startDate,endDate);
 const calculatedRevenue=days&&dailyRate ? Math.round(Number(dailyRate)*100)*days/100 : 0;
 async function addDailyRate() {
  if(savingRate)return;
  const amount=Number(newRate);
  if(!validDailyRate(amount)){
   setRateError('Enter a positive amount with up to two decimal places.');
   return;
  }
  setSavingRate(true);
  setRateError('');
  try {
   const user=await client.auth.getUser();
   if(user.error)throw user.error;
   const latest=dailyRateOptions(user.data.user?.user_metadata[rateMetadataKey]);
   const next=[...new Set([...latest,...dailyRates,amount])].sort((a,b)=>a-b).filter(rate=>!defaultDailyRates.includes(rate));
   const result=await client.auth.updateUser({data:{[rateMetadataKey]:next}});
   if(result.error)throw result.error;
   onRatePresets(next);
  }catch(error){
   setRateError('Could not save the preset. '+(error as Error).message);
   return;
  }finally{
   setSavingRate(false);
  }
  setDailyRate(String(amount));
  setNewRate('');
  setRateError('');
  setShowNewRate(false);
 }
 const locked=(key:string)=>Boolean(row&&(key===config.key||table==='fleet_transactions'&&['bus','kind'].includes(key)));
 function options(type:string,key:string):string[][]|null{
  if(type.includes('|'))return type.split('|').map(item=>[item,item]);
  if(type==='bus')return data.buses.filter(item=>item.registration===values[key]||(table==='sessions'?item.category==='TP':table==='routes'||table==='daily_accounts'?item.category==='Regular':true)).map(item=>[String(item.registration),numberPlate(String(item.registration))]);
  if(type==='category')return data.expense_categories.filter(item=>item.active||item.name===values[key]).map(item=>[String(item.name),String(item.name)]);
  if(type==='session')return data.sessions.filter(item=>item.bus===values.bus).map(item=>[String(item.id),String(item.reference)]);
  if(type==='route')return data.routes.filter(item=>item.bus===values.bus).map(item=>[String(item.id),String(item.name)]);
  if(type==='revenue')return data.revenue.map(item=>[String(item.id),'#'+item.id+' · '+item.description]);
  return null;
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy)return;
  if(tpSession&&(!days||(dailyRate&&calculatedRevenue>maxRevenue))){
   setError(days?'The calculated revenue exceeds the allowed amount.':'The end date must be on or after the start date.');
   return;
  }
  if((row||table==='fleet_transactions')&&!confirm('Save these changes?'))return;
  const form=new FormData(event.currentTarget);
  setBusy(true);setError('');
  try{
   const draft:Row={};
   for(const [key,,raw='text'] of config.fields){
    if(locked(key))continue;
    const type=raw.replace(/^optional-?/,'')||'text';
    const value=form.get(key);
    if(key==='tp_vehicle_number'&&!String(value??'').trim()&&!row?.tp_vehicle_number)continue;
    if(type==='photo'){
     if(!(value instanceof File)||!value.size)continue;
     const bucket=client.storage.from('fleet-photos');
     const path=crypto.randomUUID()+'/'+value.name.replace(/[^a-zA-Z0-9._-]/g,'_');
     const {error}=await bucket.upload(path,value);
     if(error)throw error;
     draft[key]=bucket.getPublicUrl(path).data.publicUrl;
    }else if(type==='checkbox')draft[key]=value==='on';
    else if(!String(value??'').trim())draft[key]=null;
    else if(['money','number','session','route','revenue'].includes(type))draft[key]=Number(value);
    else draft[key]=key==='registration'?String(value).toUpperCase().replace(/\s+/g,''):key==='tp_vehicle_number'?String(value).trim().toUpperCase():String(value).trim();
   }
   if(table==='website_settings'&&!row)draft.id=1;
   const source=client.from(table);
   const result=row?await source.update(draft).eq(config.key,row[config.key]!).select(config.key):await source.insert(draft);
   if(tpSession&&result.error?.code==='PGRST204'&&result.error.message.includes('tp_vehicle_number')){
    throw new Error('Saving the TP vehicle number requires the Supabase database update.');
   }
   if(result.error)throw result.error;
   if(row&&!result.data?.length)throw new Error('This record could not be updated. Refresh the dashboard and try again.');
   onSaved('Record saved.');
  }catch(error){setError((error as Error).message);}
  finally{setBusy(false);}
 }
 async function remove(){
  if(!row||busy)return;
  setBusy(true);setError('');
  try{await onDelete(row);}
  catch(error){setError((error as Error).message);}
  finally{setBusy(false);}
 }
 return <div className="modal-backdrop" onKeyDown={event=>{if(event.key==='Escape'&&!busy)close();}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-heading">
 <div className="panel-title"><h2 id="edit-heading">{row?'Edit record':'Add record'} <small>{config.title}</small></h2><button autoFocus className="icon-button" disabled={busy} onClick={close} aria-label="Close form"><X/></button></div>
 <form onSubmit={submit}><div className="form-grid">{config.fields.map(([key,label,raw='text'])=>{
  const type=raw.replace(/^optional-?/,'')||'text';
  const required=!raw.startsWith('optional')&&!['checkbox','photo'].includes(type);
  const value=String(values[key]??(type==='money'&&required?'0':type==='date'&&required?today():''));
  const list=options(type,key);
  const props={name:key,required,disabled:locked(key)};
  if(tpSession&&key==='amount')return <div className="tp-rate-fields" key={key}>
   <div className="tp-rate-main">
    <label className="field">Daily revenue rate (₹)<select value={dailyRate} onChange={event=>setDailyRate(event.target.value)}>
     <option value="">Enter agreed total manually</option>
     {dailyRates.map(rate=><option key={rate} value={rate}>{inr(rate)} per day</option>)}
    </select></label>
    <button type="button" className="button secondary" aria-expanded={showNewRate} onClick={()=>{setRateError('');setShowNewRate(!showNewRate);}}>{showNewRate?'Cancel new rate':'Add daily rate'}</button>
   </div>
   {showNewRate&&<div className="tp-rate-main">
    <label className="field">New daily rate (₹)<input type="number" step="0.01" min="0.01" inputMode="decimal" value={newRate} onChange={event=>setNewRate(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addDailyRate();}}}/></label>
    <button type="button" className="button secondary" disabled={savingRate} onClick={addDailyRate}>{savingRate?'Saving rate…':'Save rate'}</button>
   </div>}
   {rateError&&<p role="alert" className="message error">{rateError}</p>}
   <label className="field">{label}<input {...props} type="number" step="0.01" min="0" max={maxRevenue} readOnly={Boolean(dailyRate)} value={dailyRate?String(calculatedRevenue):value} onChange={event=>setValues(current=>({...current,amount:event.target.value}))}/></label>
   {dailyRate&&<p className="tp-rate-note" aria-live="polite">{days?`${inr(Number(dailyRate))} × ${days} ${days===1?'day':'days'} (start and end dates included) = ${inr(calculatedRevenue)}`:'Choose an end date on or after the start date.'}</p>}
  </div>;
  if(type==='checkbox')return <label className="check" key={key}><input type="checkbox" name={key} defaultChecked={Boolean(row?.[key]??(key==='active'))}/>{label}</label>;
  return <label className="field" key={key}>{label}{list?
   <select {...props} value={value} onChange={event=>setValues({...values,[key]:event.target.value,...(key==='bus'?{session:null,...(table==='daily_accounts'?{route:null}:{})}:{})})}><option value="">{required?'Select':'None'}</option>{list.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select>:
   tpSession&&(key==='start_date'||key==='end_date')?<input {...props} type="date" value={key==='start_date'?startDate:endDate} min={key==='end_date'?startDate||undefined:undefined} onChange={event=>setValues(current=>({...current,[key]:event.target.value}))}/>:
   key==='notes'?<textarea {...props} defaultValue={value}/>:
   type==='photo'?<input {...props} type="file" accept="image/jpeg,image/png,image/webp"/>:
   <input {...props} type={type==='money'?'number':type} defaultValue={value} min={type==='money'||type==='number'?0:undefined} step={type==='money'||key==='quantity'?'0.01':undefined}/>}</label>;
 })}</div>
 {existingDocument&&<button className="text-link existing-document" type="button" onClick={async()=>{
  const {data,error}=await client.storage.from('fleet-documents').createSignedUrl(String(existingDocument),60);
  if(error)setError(error.message);
  else location.assign(data.signedUrl);
 }}>Open existing attachment</button>}
 {error&&<div className="message error" role="alert">{error}</div>}<div className="modal-actions">{row&&<button className="danger" type="button" onClick={remove} disabled={busy}>Delete record</button>}<button className="button secondary" type="button" onClick={close} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':'Save record'}</button></div></form></section></div>;
}
