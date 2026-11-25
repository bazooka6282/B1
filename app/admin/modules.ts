export type Row = Record<string,string|number|boolean|null>;
export type Field = [key:string,label:string,type?:string];
const bus:Field=['bus','Vehicle','bus'];
const date:Field=['date','Date','date'];
const notes:Field=['notes','Notes','optional'];
const amount:Field=['amount','Amount (₹)','money'];
export const modules:Record<string,{title:string; key:string; fields:Field[]; columns:string[]; remove?:boolean}> = {
 buses:{title:'Fleet management',key:'registration',columns:['registration','name','category','status','visible'],fields:[
  ['registration','Registration'],['name','Display name'],['category','Permit category','TP|Regular'],['status','Vehicle status','Active|Inactive|Maintenance|Sold'],
  ['visible','Show on website','checkbox'],['photo','Vehicle photo','photo'],['manufacturer','Manufacturer','optional'],['model','Model','optional'],['year','Manufacturing year','optional-number'],
  ['purchase_date','Purchase date','optional-date'],['purchase_amount','Purchase value (₹)','money'],['insurance_expiry','Insurance expiry','optional-date'],['fitness_expiry','Fitness expiry','optional-date'],['tax_expiry','Road tax expiry','optional-date'],['permit_expiry','Permit expiry','optional-date'],notes]},
 sessions:{title:'TP sessions',key:'id',columns:['bus','reference','start_date','end_date','days','status','outstanding','profit'],fields:[
  bus,['reference','TP reference'],['start_date','Start date','date'],['end_date','End date','date'],['route','Route or trip'],['operator','Operator','optional'],['status','Session status','Upcoming|Active|Completed|Cancelled'],
  ['amount','Agreed revenue (₹)','money'],['additional','Additional revenue (₹)','money'],['received','Amount received (₹)','money'],notes]},
 routes:{title:'Regular permit routes',key:'id',columns:['bus','name','origin','destination','status'],fields:[bus,['name','Route name'],['origin','Origin'],['destination','Destination'],['permit','Permit number','optional'],['permit_expiry','Permit expiry','optional-date'],['driver','Driver','optional'],['conductor','Conductor','optional'],['trips','Daily trips','optional-number'],['status','Operating status','Active|Inactive']]},
 daily_accounts:{title:'Daily accounts',key:'id',remove:true,columns:['date','bus','route','amount','profit'],fields:[date,bus,['route','Route','route'],['amount','Ticket collection (₹)','money'],['additional','Additional revenue (₹)','money'],['diesel','Diesel (₹)','money'],['driver','Driver wages (₹)','money'],['conductor','Conductor wages (₹)','money'],['maintenance','Maintenance (₹)','money'],['other','Other expenses (₹)','money'],notes]},
 revenue:{title:'Revenue',key:'id',remove:true,columns:['id','date','bus','category','description','amount','received','outstanding'],fields:[date,bus,['category','Category','Special trip|Bus rental|Advertising|Additional income|Other income'],['description','Description'],amount,notes]},
 revenue_payments:{title:'Revenue payments',key:'id',remove:true,columns:['date','revenue','amount','method'],fields:[date,['revenue','Revenue record','revenue'],amount,['method','Payment method','Cash|UPI|Bank transfer|Other'],notes]},
 expenses:{title:'Expenses',key:'id',remove:true,columns:['date','bus','category','description','amount','paid'],fields:[date,['bus','Vehicle','optional-bus'],['session','TP session','optional-session'],['category','Category','category'],['description','Description'],['item','Item','optional'],['quantity','Quantity','optional-number'],['unit_price','Unit price (₹)','optional-money'],amount,['paid','Paid amount (₹)','money'],['vendor','Vendor','optional'],['method','Payment method','optional'],['receipt','Receipt','document'],notes]},
 expense_categories:{title:'Expense categories',key:'name',columns:['name','active','maintenance'],fields:[['name','Category name'],['active','Active','checkbox'],['maintenance','Maintenance category','checkbox']]},
 fleet_transactions:{title:'Purchase & sale',key:'id',columns:['date','bus','kind','party','amount','charges','received'],fields:[date,bus,['kind','Transaction type','Purchase|Sale'],['party','Seller or buyer','optional'],amount,['charges','Associated costs (₹)','money'],['received','Amount received (₹)','money'],['document','Supporting document','document'],notes]},
 website_settings:{title:'Website & reminders',key:'id',columns:['contact_email','reminder_days'],fields:[['contact_email','Public contact email','optional-email'],['reminder_days','Reminder days','number']]},
};
export type Data = Record<string,Row[]>;
export function sessionDays(startDate: string, endDate: string) {
 const difference=Date.parse(endDate)-Date.parse(startDate);
 return difference>=0 ? difference/86400000+1 : 0;
}
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
export const n=(row:Row,key:string)=>Number(row[key]??0);
export const total=(row:Row)=>n(row,'amount')+n(row,'additional');
export const dailyCost=(row:Row)=>['diesel','driver','conductor','maintenance','other'].reduce((sum,key)=>sum+n(row,key),0);
export const payments=(data:Data,row:Row)=>data.revenue_payments.filter(payment=>payment.revenue===row.id).reduce((sum,payment)=>sum+n(payment,'amount'),0);
export function ledger(data:Data){
 return [
  ...data.sessions.filter(row=>row.status!=='Cancelled').map(row=>({bus:row.bus,date:String(row.start_date),category:'TP session',revenue:total(row),expense:0,received:n(row,'received'),paid:0,maintenance:0})),
  ...data.daily_accounts.map(row=>({bus:row.bus,date:String(row.date),category:'Daily route accounts',revenue:total(row),expense:dailyCost(row),received:total(row),paid:dailyCost(row),maintenance:n(row,'maintenance')})),
  ...data.revenue.map(row=>({bus:row.bus,date:String(row.date),category:String(row.category),revenue:n(row,'amount'),expense:0,received:payments(data,row),paid:0,maintenance:0})),
  ...data.expenses.map(row=>({bus:row.bus,date:String(row.date),category:String(row.category),revenue:0,expense:n(row,'amount'),received:0,paid:n(row,'paid'),maintenance:data.expense_categories.some(item=>item.name===row.category&&item.maintenance)?n(row,'amount'):0}))
 ];
}
export function sum(rows:Row[],key:string){return rows.reduce((value,row)=>value+n(row,key),0);}
