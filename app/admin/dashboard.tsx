'use client';
import { useEffect,useState,type FormEvent } from 'react';
import Link from 'next/link';
import { BusFront,CalendarDays,ChartNoAxesCombined,CircleDollarSign,ReceiptText,Wallet,Menu,Plus,X,Globe,LogOut } from 'lucide-react';
import { Bar,BarChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';
import { Brand } from '../brand';
import { browserClient } from '../../lib/browser';
import { inr,numberPlate } from '../../lib/fleet';
import { modules,today,sessionDays,fleetTpDates,n,total,dailyCost,payments,ledger,sum,type Data,type Row } from './modules';
import { Editor } from './editor';
import { AccountPhoto } from './account-photo';
import { TpApprovals } from './tp-approvals';

const sections=['overview','buses','sessions','routes','daily_accounts','revenue','revenue_payments','expenses','maintenance','expense_categories','fleet_transactions','company','reports','website_settings','notifications'];
const titles:Record<string,string>={overview:'Overview',maintenance:'Spare parts & maintenance',company:'Company accounts',reports:'Reports',notifications:'Notifications'};
const titleFor=(section:string)=>modules[section]?.title ?? titles[section];
const human=(key:string)=>key.replaceAll('_',' ').replace(/^tp\b/,'TP').replace(/^./,letter=>letter.toUpperCase());
function display(key:string,value:Row[string]){
 if(value===null || value===undefined || value==='')return '—';
 if(typeof value==='boolean')return value?'Yes':'No';
 if(['amount','profit','outstanding','paid','received','purchase_amount','charges','revenue','expense'].includes(key)&&typeof value==='number')return inr(value);
 if(['registration','bus'].includes(key))return numberPlate(String(value));
 if(/^\d{4}-\d\d-\d\d$/.test(String(value)))return String(value).split('-').reverse().join('/');
 return String(value);
}
export function Dashboard({email,initialPhoto,initialRatePresets}:{email:string;initialPhoto:unknown;initialRatePresets:unknown}){
 const [client]=useState(browserClient);
 const [ratePresets,setRatePresets]=useState(initialRatePresets);
 const [data,setData]=useState<Data>();
 const [section,setSection]=useState('overview');
 const [menu,setMenu]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [blockedSession,setBlockedSession]=useState<Row[string]>(null);
 const [expenseSession,setExpenseSession]=useState<Row[string]>(null);
 const [edit,setEdit]=useState<{table:string;row?:Row}>();
 const [profile,setProfile]=useState<Row>();
 const [approvalSession,setApprovalSession]=useState<Row>();
 const [deleting,setDeleting]=useState(false);
 const [search,setSearch]=useState('');
 const [order,setOrder]=useState({key:'',direction:1});
 const [bus,setBus]=useState('');
 const [category,setCategory]=useState('');
 const [from,setFrom]=useState('');
 const [to,setTo]=useState('');
 const [group,setGroup]=useState('Month');
 const [report,setReport]=useState('Operating ledger');
 async function load(){
  const tables=[...Object.keys(modules),'tp_daily_approvals'];
  const result=await Promise.all(tables.map(async table=>{
   const rows:Row[]=[];
   for(let offset=0;;offset+=500){
    const query=client.from(table).select('*').order(modules[table]?.key??'session');
    if(table==='tp_daily_approvals')query.order('date');
    const {data,error}=await query.range(offset,offset+499);
    if(table==='tp_daily_approvals'&&error?.code==='PGRST205')return null;
    if(error)throw error;
    rows.push(...data);
    if(data.length<500)return [table,rows] as const;
   }
  }));
  setData(Object.fromEntries(result.filter(entry=>entry!==null)));
 }
 useEffect(()=>{void load().catch(error=>setError(error.message));},[]);
 function navigate(next:string){setSection(next);setMenu(false);setSearch('');setOrder({key:'',direction:1});setNotice('');setExpenseSession(null);setBlockedSession(null);}
 const table=section==='maintenance'?'expenses':section;
 const module=modules[table];
 async function deleteRecord(recordTable:string,row:Row){
  if(deleting)return;
  const recordModule=modules[recordTable];
  const id=row[recordModule.key];
  if(id==null)throw new Error('The record ID could not be found. Refresh the dashboard and try again.');
  const saleNote=recordTable==='fleet_transactions'&&row.kind==='Sale'
   ? ' The vehicle will stay marked as Sold until you update it in Fleet management.' : '';
  const sessionNote=recordTable==='sessions'?' Linked expenses will remain on the same bus. The session revenue will be removed from reports.':'';
  if(!confirm(`Delete record ${id} from ${recordModule.title}?${saleNote}${sessionNote}`))return;
  setDeleting(true);setError('');setNotice('');setBlockedSession(null);
  try {
   const {data:removed,error}=await client.from(recordTable).delete().eq(recordModule.key,id).select(recordModule.key);
   if(error?.code==='23503'){
    if(recordTable==='sessions'){
     setBlockedSession(id);
     throw new Error('This TP session has linked expenses. Open them and clear or reassign their TP session before retrying.');
    }
    throw new Error('This record is linked to other records. Remove or reassign those links before deleting it.');
   }
   if(error)throw error;
   if(!removed?.length)throw new Error('The record was already removed or this account cannot delete it.');
   setEdit(undefined);
   setData(previous=>previous&&({...previous,[recordTable]:previous[recordTable].filter(item=>item[recordModule.key]!==id)}));
   setNotice('Record deleted.');
   void load().catch(error=>setError(error.message));
  }finally{setDeleting(false);}
 }
 const entries=data?ledger(data):[];
 const buses=data?.buses.filter(row=>(!bus||row.registration===bus)&&(!category||row.category===category))??[];
 const selected=new Set(buses.map(row=>row.registration));
 const inDate=(date:unknown)=>(!from||String(date)>=from)&&(!to||String(date)<=to);
 const filtered=entries.filter(row=>inDate(row.date)&&(row.bus?selected.has(row.bus):!bus&&!category));
 const sales=data?.fleet_transactions.filter(row=>selected.has(row.bus)&&inDate(row.date))??[];
 const revenue=sum(filtered,'revenue'), expense=sum(filtered,'expense'), received=sum(filtered,'received'), paid=sum(filtered,'paid');
 const metrics=[
  ['Operating revenue',inr(revenue),CircleDollarSign,'green'],['Operating expenses',inr(expense),ReceiptText,'red'],
  ['Net operating profit',inr(revenue-expense),ChartNoAxesCombined,revenue>=expense?'green':'red'],['Outstanding revenue',inr(revenue-received),Wallet,'amber'],
 ] as const;
 const sessions=data?.sessions.filter(row=>selected.has(row.bus)&&(!from||String(row.end_date)>=from)&&(!to||String(row.start_date)<=to))??[];
 const counters=[
  ['Total buses',buses.length],['Active buses',buses.filter(row=>row.status==='Active').length],['TP buses',buses.filter(row=>row.category==='TP').length],
  ['Regular permit buses',buses.filter(row=>row.category==='Regular').length],['Active TP sessions',sessions.filter(row=>row.status==='Active').length],
  ['Completed TP sessions',sessions.filter(row=>row.status==='Completed').length],['Maintenance expenses',inr(sum(filtered,'maintenance'))],['Fleet purchase value',inr(sum(buses,'purchase_amount'))],
 ] as const;
 const chart=Object.entries(filtered.reduce<Record<string,{Revenue:number;Expenses:number;Profit:number}>>((series,row)=>{
  if(group==='Expense category'&&!row.expense)return series;
  const key=group==='Vehicle'?numberPlate(String(row.bus??'Company')):group==='Permit category'?String(buses.find(bus=>bus.registration===row.bus)?.category??'Company'):group==='Expense category'?row.category:row.date.slice(0,7);
  const point=series[key]??={Revenue:0,Expenses:0,Profit:0};
  point.Revenue+=row.revenue;point.Expenses+=row.expense;point.Profit+=row.revenue-row.expense;
  return series;
 },{})).sort(([a],[b])=>a.localeCompare(b)).map(([period,values])=>({period,...values}));
 let rows=data?.[table]??[];
 if(table==='buses'&&data){
  const date=today();
  rows=rows.map(row=>({...row,...fleetTpDates(row,data.sessions,date)}));
 }
 if(table==='expenses'&&expenseSession!=null)rows=rows.filter(row=>row.session===expenseSession);
 if(section==='maintenance')rows=rows.filter(row=>data!.expense_categories.some(item=>item.maintenance&&item.name===row.category));
 rows=rows.filter(row=>Object.values(row).some(value=>String(value??'').toLowerCase().includes(search.toLowerCase()))).map(row=>{
  if(table==='sessions'){
   const approved=(data!.tp_daily_approvals??[]).filter(item=>item.session===row.id);
   const received=sum(approved,'amount');
   return {...row,days:sessionDays(String(row.start_date),String(row.end_date)),approved_days:approved.length,received,profit:received-sum(data!.expenses.filter(item=>item.session===row.id),'amount')};
  }
  if(table==='daily_accounts')return {...row,amount:total(row),profit:total(row)-dailyCost(row)};
  if(table==='revenue')return {...row,received:payments(data!,row),outstanding:n(row,'amount')-payments(data!,row)};
  return row;
 });
 if(order.key)rows.sort((a,b)=>String(a[order.key]??'').localeCompare(String(b[order.key]??''),undefined,{numeric:true})*order.direction);
 const reportRows=report==='Fleet investment'?sales:filtered.filter(row=>report==='Maintenance expenses'?row.maintenance>0:report==='Outstanding receivables'?row.revenue>row.received:true);
 const reportColumns=report==='Fleet investment'?['date','bus','kind','amount','charges','received']:['date','bus','category','revenue','expense','received','paid'];
 const cutoff=new Date(Date.parse(today())+(n(data?.website_settings[0]??{},'reminder_days')||30)*86400000).toISOString().slice(0,10);
 const reminders=[
  ...(data?.buses??[]).filter(row=>row.status!=='Sold').flatMap(row=>['insurance_expiry','fitness_expiry','tax_expiry','permit_expiry'].filter(key=>row[key]&&String(row[key])<=cutoff).map(key=>({bus:row.registration,detail:human(key),date:row[key]}))),
  ...(data?.sessions??[]).filter(row=>['Upcoming','Active'].includes(String(row.status))&&String(row.end_date)<=cutoff).map(row=>({bus:row.bus,detail:'TP session expiry',date:row.end_date})),
 ];
 function setPeriod(period:string){
  const now=today();const day=new Date(now+'T00:00:00Z');
  setTo(period?now:'');
  setFrom(period==='Today'?now:period==='This month'?now.slice(0,7)+'-01':period==='This year'?now.slice(0,4)+'-01-01':period==='This week'?new Date(+day-((day.getUTCDay()+6)%7)*86400000).toISOString().slice(0,10):'');
 }
 function exportReport(){
  const cell=(value:Row[string])=>'"'+String(typeof value==='string'&&/^[=+\-@\t\r]/.test(value)?"'"+value:value??'').replaceAll('"','""')+'"';
  const csv=['BAZOOKA - '+report,reportColumns.join(','),...reportRows.map(row=>reportColumns.map(key=>cell((row as Row)[key])).join(','))].join('\r\n');
  const href=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=href;link.download='bazooka-report.csv';link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 }
 return <div className={'admin'+(menu?' menu-open':'')}><aside className="sidebar"><Brand href="/admin"/><nav aria-label="Admin sections">{sections.map((item,index)=>{
  const Icon=index===0?ChartNoAxesCombined:index<=2?BusFront:index<=4?CalendarDays:index<=10?ReceiptText:Wallet;
  return <button className={section===item?'selected':''} key={item} onClick={()=>navigate(item)}><Icon size={17}/>{titleFor(item)}</button>;
 })}</nav><button className="signout" onClick={async()=>{const result=await client.auth.signOut();if(result.error)setError(result.error.message);else location.assign('/login');}}><LogOut size={16}/>Sign out</button></aside>
 <div className="admin-main"><header className="admin-top"><button className="icon-button" aria-expanded={menu} aria-label="Toggle sidebar" onClick={()=>setMenu(!menu)}><Menu size={20}/></button><strong>Fleet operations</strong><Link href="/" className="site-preview"><Globe size={16}/>View website</Link><AccountPhoto client={client} initialPhoto={initialPhoto} email={email} /></header>
 <main className="admin-content"><div className="admin-title"><div><p className="eyebrow dark"><span/> BAZOOKA ADMIN</p><h1>{titleFor(section)}</h1></div>{module&&(table!=='website_settings'||data?.website_settings.length===0)&&<button className="button primary" disabled={!data} onClick={()=>setEdit({table})}><Plus size={18}/> Add record</button>}</div>
 {notice&&<div className="message" role="status">{notice}</div>}{error&&<div className="message error" role="alert">{error} {blockedSession!=null&&section==='sessions'?<button className="text-link" onClick={()=>{navigate('expenses');setExpenseSession(blockedSession);setError('');}}>View linked expenses</button>:<button className="text-link" onClick={()=>{setError('');void load().catch(error=>setError(error.message));}}>Retry</button>}</div>}{!data&&!error&&<div className="skeleton" role="status">Loading fleet records…</div>}
 {section==='expenses'&&expenseSession!=null&&<div className="message">Expenses linked to TP session {expenseSession}. <button className="text-link" onClick={()=>navigate('sessions')}>Back to TP sessions</button> · <button className="text-link" onClick={()=>setExpenseSession(null)}>Show all expenses</button></div>}
 {data&&['overview','company','reports'].includes(section)&&<><div className="filters">
 <label className="field">Period<select defaultValue="" onChange={event=>setPeriod(event.target.value)}><option value="">All time</option><option>Today</option><option>This week</option><option>This month</option><option>This year</option><option>Custom</option></select></label>
 <label className="field">From<input type="date" value={from} onChange={event=>setFrom(event.target.value)}/></label>
 <label className="field">To<input type="date" min={from||undefined} value={to} onChange={event=>setTo(event.target.value)}/></label>
 <label className="field">Vehicle<select value={bus} onChange={event=>setBus(event.target.value)}><option value="">All vehicles</option>{data.buses.map(row=><option key={String(row.registration)} value={String(row.registration)}>{numberPlate(String(row.registration))}</option>)}</select></label>
 <label className="field">Permit category<select value={category} onChange={event=>setCategory(event.target.value)}><option value="">All categories</option><option value="TP">Temporary permit</option><option value="Regular">Regular permit</option></select></label></div>
 <div className="metrics">{metrics.map(([name,value,Icon,tone])=><article className="metric" key={name}><div><span>{name}</span><i className={tone}><Icon size={18}/></i></div><strong>{value}</strong></article>)}</div></>}
 {data&&section==='overview'&&<><section className="panel"><div className="panel-title"><div><h2>Operating performance</h2><p>Revenue, expenses and profit</p></div><select aria-label="Chart grouping" value={group} onChange={event=>setGroup(event.target.value)}>{['Month','Vehicle','Permit category','Expense category'].map(item=><option key={item}>{item}</option>)}</select></div>
 {chart.length?<div className="chart"><ResponsiveContainer width="100%" height={275}><BarChart data={chart}><CartesianGrid vertical={false} strokeDasharray="4 4"/><XAxis dataKey="period" tick={{fontSize:12}}/><YAxis width={68} tick={{fontSize:12}}/><Tooltip formatter={value=>inr(Number(value))}/><Bar dataKey="Revenue" fill="#18a37a"/><Bar dataKey="Expenses" fill="#e47272"/><Bar dataKey="Profit" fill="#2873e8"/></BarChart></ResponsiveContainer></div>:<div className="empty-chart"><ChartNoAxesCombined size={30}/><strong>No activity in this period</strong><span>Recorded revenue and expenses will appear here.</span><button className="text-link" onClick={()=>navigate('revenue')}>Open revenue</button></div>}</section>
 <section className="panel"><div className="panel-title"><div><h2>Fleet summary</h2><p>Vehicles and temporary permits</p></div><button className="button secondary" onClick={()=>navigate('buses')}>Manage fleet</button></div><Counters values={counters}/></section></>}
 {data&&section==='company'&&<section className="panel"><div className="panel-title"><h2>Cash and fleet investment</h2></div><Counters values={[
 ['Cash received',inr(received)],['Operating payments',inr(paid)],['Operating cash balance',inr(received-paid)],['Outstanding payables',inr(expense-paid)],
 ['General company expenses',inr(sum(filtered.filter(row=>!row.bus),'expense'))],['Maintenance',inr(sum(filtered,'maintenance'))],
 ['Acquisition cost',inr(sum(sales.filter(row=>row.kind==='Purchase'),'amount')+sum(sales.filter(row=>row.kind==='Purchase'),'charges'))],
 ['Net sales proceeds received',inr(sum(sales.filter(row=>row.kind==='Sale'),'received')-sum(sales.filter(row=>row.kind==='Sale'),'charges'))],
 ]}/></section>}
 {data&&section==='reports'&&<section className="panel"><div className="panel-title"><h2>BAZOOKA reports</h2><select aria-label="Report type" value={report} onChange={event=>setReport(event.target.value)}>{['Operating ledger','Maintenance expenses','Outstanding receivables','Fleet investment'].map(item=><option key={item}>{item}</option>)}</select></div><div className="report-actions"><button className="button secondary" onClick={exportReport}>Download CSV</button><button className="button secondary" onClick={()=>window.print()}>Print or save PDF</button></div><Grid rows={reportRows} columns={reportColumns}/></section>}
 {data&&section==='notifications'&&<section className="panel"><div className="panel-title"><h2>Document and permit reminders</h2></div><Grid rows={reminders.sort((a,b)=>String(a.date).localeCompare(String(b.date)))} columns={['date','bus','detail']}/></section>}
 {data&&['sessions','overview','company','reports'].includes(section)&&!data.tp_daily_approvals&&<p className="message">TP revenue is excluded until daily approvals are enabled in Supabase.</p>}
 {data&&module&&<section className="panel"><div className="panel-title"><h2>{rows.length} {rows.length===1?'record':'records'}</h2><input type="search" aria-label="Search records" placeholder="Search records" value={search} onChange={event=>setSearch(event.target.value)}/></div><Grid rows={rows} columns={module.columns} onEdit={row=>setEdit({table,row:data[table].find(record=>record[module.key]===row[module.key])??row})} onDelete={row=>void deleteRecord(table,row).catch(error=>setError(error.message))} deleting={deleting} onApproval={table==='sessions'&&data.tp_daily_approvals?setApprovalSession:undefined} onProfile={table==='buses'?setProfile:undefined} onSort={key=>setOrder(previous=>({key,direction:previous.key===key?-previous.direction:1}))}/></section>}
 </main></div>
 {edit&&data&&<Editor client={client} ratePresets={ratePresets} onRatePresets={setRatePresets} data={data} table={edit.table} row={edit.row} onDelete={row=>deleteRecord(edit.table,row)} close={()=>setEdit(undefined)} onSaved={message=>{setEdit(undefined);setNotice(message);void load().catch(error=>setError(error.message));}}/>}
 {approvalSession&&data?.tp_daily_approvals&&<TpApprovals client={client} session={approvalSession} approvals={data.tp_daily_approvals.filter(row=>row.session===approvalSession.id)} close={()=>setApprovalSession(undefined)} refresh={load}/>}
 {profile&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="Vehicle profile"><div className="panel-title"><h2>{numberPlate(String(profile.registration))}</h2><button autoFocus className="icon-button" onClick={()=>setProfile(undefined)} aria-label="Close profile"><X/></button></div>{profile.photo&&<img className="admin-photo" src={String(profile.photo)} alt={String(profile.name)}/>}<p>{profile.name} · {profile.status}</p><Counters values={(()=>{
 const history=entries.filter(row=>row.bus===profile.registration);return [['Operating revenue',inr(sum(history,'revenue'))],['Operating expenses',inr(sum(history,'expense'))],['Operating profit',inr(sum(history,'revenue')-sum(history,'expense'))],['Purchase value',inr(n(profile,'purchase_amount'))]];
 })()}/><Grid rows={entries.filter(row=>row.bus===profile.registration)} columns={['date','category','revenue','expense']}/><h3>TP sessions</h3><Grid rows={data?.sessions.filter(row=>row.bus===profile.registration)??[]} columns={['reference','start_date','end_date','status']}/></section></div>}
 </div>;
}
function Counters({values}:{values:readonly (readonly [string,string|number])[]}){
 return <div className="counters">{values.map(([name,value])=><div key={name}><span>{name}</span><strong>{value}</strong></div>)}</div>;
}
function Grid({rows,columns,onSort,onEdit,onDelete,deleting,onProfile,onApproval}:{rows:Row[];columns:string[];onSort?:(key:string)=>void;onEdit?:(row:Row)=>void;onDelete?:(row:Row)=>void;deleting?:boolean;onProfile?:(row:Row)=>void;onApproval?:(row:Row)=>void}){
 return <div className="table-scroll"><table><thead><tr>{columns.map(key=><th key={key}>{onSort?<button onClick={()=>onSort(key)}>{human(key)}</button>:human(key)}</th>)}{onEdit&&<th>Actions</th>}</tr></thead>
 <tbody>{rows.map((row,index)=><tr key={String(row.id??row.registration??index)}>{columns.map(key=><td key={key}>{key==='status'?<span className={'status '+String(row[key]).toLowerCase()}>{display(key,row[key])}</span>:key==='registration'&&onProfile?<button className="text-link" onClick={()=>onProfile(row)}>{display(key,row[key])}</button>:display(key,row[key])}</td>)}{onEdit&&<td><div className="row-actions">{onApproval&&<button type="button" className="text-link" onClick={()=>onApproval(row)}>Daily approvals</button>}<button type="button" className="text-link" onClick={()=>onEdit(row)}>Edit</button>{onDelete&&<button type="button" className="text-link row-delete" disabled={deleting} onClick={()=>onDelete(row)}>Delete</button>}</div></td>}</tr>)}
 {!rows.length&&<tr><td className="empty-cell" colSpan={columns.length+(onEdit?1:0)}>No records to display.</td></tr>}</tbody></table></div>;
}
