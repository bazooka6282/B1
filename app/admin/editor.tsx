'use client';
import { useState,type FormEvent } from 'react';
import { X } from 'lucide-react';
import { browserClient } from '../../lib/browser';
import { numberPlate } from '../../lib/fleet';
import { modules,today,type Data,type Row } from './modules';

export function Editor({client,data,table,row,close,onSaved}:{client:ReturnType<typeof browserClient>;data:Data;table:string;row?:Row;close:()=>void;onSaved:(message:string)=>void}){
 const config=modules[table];
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [values,setValues]=useState<Row>(row??{});
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
  if(busy||((row||table==='fleet_transactions')&&!confirm('Save these changes?')))return;
  const form=new FormData(event.currentTarget);
  setBusy(true);setError('');
  try{
   const draft:Row={};
   for(const [key,,raw='text'] of config.fields){
    if(locked(key))continue;
    const type=raw.replace(/^optional-?/,'')||'text';
    const value=form.get(key);
    if(type==='photo'||type==='document'){
     if(!(value instanceof File)||!value.size)continue;
     const bucket=type==='photo'?'fleet-photos':'fleet-documents';
     const path=crypto.randomUUID()+'/'+value.name.replace(/[^a-zA-Z0-9._-]/g,'_');
     const {error}=await client.storage.from(bucket).upload(path,value);
     if(error)throw error;
     draft[key]=type==='photo'?client.storage.from(bucket).getPublicUrl(path).data.publicUrl:path;
    }else if(type==='checkbox')draft[key]=value==='on';
    else if(!String(value??'').trim())draft[key]=null;
    else if(['money','number','session','route','revenue'].includes(type))draft[key]=Number(value);
    else draft[key]=key==='registration'?String(value).toUpperCase().replace(/\s+/g,''):String(value).trim();
   }
   const source=client.from(table);
   const result=row?await source.update(draft).eq(config.key,row[config.key]!):await source.insert({ ...draft });
   if(result.error)throw result.error;
   onSaved('Record saved.');
  }catch(error){setError((error as Error).message);}
  finally{setBusy(false);}
 }
 async function remove(){
  if(!row||busy||!config.remove||!confirm('Delete this record? The change is recorded in the audit log.'))return;
  setBusy(true);setError('');
  try{
   const {error}=await client.from(table).delete().eq(config.key,row[config.key]!);
   if(error)throw error;
   onSaved('Record deleted.');
  }catch(error){setError((error as Error).message);}
  finally{setBusy(false);}
 }
 return <div className="modal-backdrop" onKeyDown={event=>{if(event.key==='Escape'&&!busy)close();}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-heading">
 <div className="panel-title"><h2 id="edit-heading">{row?'Edit record':'Add record'} <small>{config.title}</small></h2><button autoFocus className="icon-button" disabled={busy} onClick={close} aria-label="Close form"><X/></button></div>
 <form onSubmit={submit}><div className="form-grid">{config.fields.map(([key,label,raw='text'])=>{
  const type=raw.replace(/^optional-?/,'')||'text';
  const required=!raw.startsWith('optional')&&!['checkbox','photo','document'].includes(type);
  const value=String(values[key]??(type==='money'&&required?'0':type==='date'&&required?today():''));
  const list=options(type,key);
  const props={name:key,required,disabled:locked(key)};
  if(type==='checkbox')return <label className="check" key={key}><input type="checkbox" name={key} defaultChecked={Boolean(row?.[key]??(key==='active'))}/>{label}</label>;
  return <label className="field" key={key}>{label}{list?
   <select {...props} value={value} onChange={event=>setValues({...values,[key]:event.target.value,...(key==='bus'?{session:null,...(table==='daily_accounts'?{route:null}:{})}:{})})}><option value="">{required?'Select':'None'}</option>{list.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select>:
   key==='notes'?<textarea {...props} defaultValue={value}/>:
   type==='document'||type==='photo'?<><input {...props} type="file" accept={type==='photo'?'image/jpeg,image/png,image/webp':'application/pdf,image/jpeg,image/png,image/webp'}/>{type==='document'&&row?.[key]&&<button className="text-link" type="button" onClick={async()=>{const {data,error}=await client.storage.from('fleet-documents').createSignedUrl(String(row[key]),60);if(error)setError(error.message);else location.assign(data.signedUrl);}}>Open attached document</button>}</>:
   <input {...props} type={type==='money'?'number':type} defaultValue={value} min={type==='money'||type==='number'?0:undefined} step={type==='money'||key==='quantity'?'0.01':undefined}/>}</label>;
 })}</div>{error&&<div className="message error" role="alert">{error}</div>}<div className="modal-actions">{row&&config.remove&&<button className="danger" type="button" onClick={remove} disabled={busy}>Delete record</button>}<button className="button secondary" type="button" onClick={close} disabled={busy}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':'Save record'}</button></div></form></section></div>;
}

