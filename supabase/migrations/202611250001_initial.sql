create table public.admins (id uuid primary key references auth.users on delete cascade);
create function public.is_fleet_admin() returns boolean language sql stable security definer set search_path = '' as
$$ select exists(select 1 from public.admins where id = (select auth.uid())) $$;
revoke all on function public.is_fleet_admin() from public;
grant execute on function public.is_fleet_admin() to authenticated;
alter table public.admins enable row level security;

create table public.buses (
  registration text primary key check (registration ~ '^[A-Z0-9]{6,16}$'),
  name text not null, category text not null check (category in ('TP','Regular')),
  status text not null default 'Active' check (status in ('Active','Inactive','Maintenance','Sold')),
  visible boolean not null default false, photo text, manufacturer text, model text, year integer,
  purchase_date date, purchase_amount numeric(14,2) not null default 0 check (purchase_amount >= 0),
  insurance_expiry date, fitness_expiry date, tax_expiry date, permit_expiry date, notes text
);
create table public.sessions (
  id bigint generated always as identity primary key, bus text not null references public.buses,
  reference text not null, start_date date not null, end_date date not null check (end_date >= start_date),
  route text not null, operator text, status text not null check (status in ('Upcoming','Active','Completed','Cancelled')),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  additional numeric(14,2) not null default 0 check (additional >= 0),
  received numeric(14,2) not null default 0 check (received >= 0 and received <= amount + additional), notes text,
  unique (id, bus)
);
create table public.routes (
  id bigint generated always as identity primary key, bus text not null references public.buses,
  name text not null, origin text not null, destination text not null, permit text, permit_expiry date,
  driver text, conductor text, trips integer check(trips >= 0), status text not null,
  unique (id, bus)
);
create table public.daily_accounts (
  id bigint generated always as identity primary key, bus text not null references public.buses,
  route bigint not null, date date not null,
  amount numeric(14,2) not null check(amount >= 0), additional numeric(14,2) not null default 0 check(additional >= 0),
  diesel numeric(14,2) not null default 0 check(diesel >= 0),
  driver numeric(14,2) not null default 0 check(driver >= 0),
  conductor numeric(14,2) not null default 0 check(conductor >= 0),
  maintenance numeric(14,2) not null default 0 check(maintenance >= 0),
  other numeric(14,2) not null default 0 check(other >= 0), notes text,
  foreign key (route, bus) references public.routes(id,bus), unique(route,date)
);
create table public.expense_categories (name text primary key, active boolean not null default true, maintenance boolean not null default false);
insert into public.expense_categories(name,maintenance) values
('Diesel and fuel',false),('Spare parts',true),('Engine maintenance',true),('Tyre replacement',true),('Battery replacement',true),('Electrical work',true),('Mechanical work',true),('Bodywork and painting',true),('Washing and cleaning',true),('Driver salary',false),('Conductor salary',false),('Staff wages',false),('TP charges',false),('Permit charges',false),('Insurance',false),('Road tax',false),('Fitness certificate charges',false),('Toll charges',false),('Parking charges',false),('Loan interest',false),('Other expenses',false);
create table public.expenses (
  id bigint generated always as identity primary key, bus text references public.buses,
  session bigint, date date not null, category text not null references public.expense_categories,
  description text not null, item text, quantity numeric(12,2) check(quantity > 0),
  unit_price numeric(14,2) check(unit_price >= 0), amount numeric(14,2) not null check(amount >= 0),
  paid numeric(14,2) not null default 0 check(paid >= 0 and paid <= amount), vendor text, method text, receipt text, notes text,
  check(session is null or bus is not null), foreign key (session,bus) references public.sessions(id,bus)
);
create table public.revenue (
  id bigint generated always as identity primary key, bus text not null references public.buses,
  date date not null, category text not null, description text not null, amount numeric(14,2) not null check(amount >= 0),
  notes text
);
create table public.revenue_payments (
  id bigint generated always as identity primary key, revenue bigint not null references public.revenue,
  date date not null, amount numeric(14,2) not null check(amount > 0), method text not null, notes text
);
create function public.check_payments() returns trigger language plpgsql set search_path = '' as $$
declare total numeric;
begin
  if tg_table_name = 'revenue_payments' then
    select amount into total from public.revenue where id=new.revenue for no key update;
    if new.amount + coalesce((select sum(amount) from public.revenue_payments where revenue=new.revenue and id is distinct from new.id),0) > total
      then raise exception 'Payments exceed recorded revenue'; end if;
  else
    if coalesce((select sum(amount) from public.revenue_payments where revenue=new.id),0) > new.amount
      then raise exception 'Revenue cannot be lower than payments received'; end if;
  end if;
  return new;
end $$;
create trigger payment_limit before insert or update on public.revenue_payments for each row execute function public.check_payments();
create trigger revenue_limit before update of amount on public.revenue for each row execute function public.check_payments();
create table public.fleet_transactions (
  id bigint generated always as identity primary key, bus text not null references public.buses,
  date date not null, kind text not null check (kind in ('Purchase','Sale')), party text,
  amount numeric(14,2) not null check(amount >= 0), charges numeric(14,2) not null default 0 check(charges >= 0),
  received numeric(14,2) not null default 0 check(received >= 0 and received <= amount), document text, notes text
);
create unique index one_sale_per_bus on public.fleet_transactions(bus) where kind = 'Sale';
create function public.flag_bus_sale() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (old.bus <> new.bus or old.kind <> new.kind) then
    raise exception 'The vehicle and transaction type cannot be changed';
  end if;
  if new.kind = 'Sale' then update public.buses set status='Sold', visible=false where registration=new.bus; end if;
  return new;
end $$;
create trigger fleet_sale after insert or update on public.fleet_transactions for each row execute function public.flag_bus_sale();
create table public.website_settings (
  id integer primary key check(id=1), contact_email text, reminder_days integer not null default 30 check(reminder_days between 1 and 365)
);
insert into public.website_settings(id) values(1);
create table public.audit_log (
  id bigint generated always as identity primary key, changed_at timestamptz not null default now(),
  actor uuid, entity text not null, operation text not null, before_row jsonb, after_row jsonb
);
alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
create policy admin_audit on public.audit_log for select to authenticated using ((select public.is_fleet_admin()));
create function public.log_fleet_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log(actor,entity,operation,before_row,after_row)
  values(auth.uid(),tg_table_name,tg_op,case when tg_op <> 'INSERT' then to_jsonb(old) end,case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return null;
end $$;
do $$
declare entity text;
begin
  foreach entity in array array['buses','sessions','routes','daily_accounts','expense_categories','expenses','revenue','revenue_payments','fleet_transactions','website_settings'] loop
    execute format('alter table public.%I enable row level security',entity);
    execute format('revoke all on public.%I from anon',entity);
    execute format('grant select, insert, update, delete on public.%I to authenticated',entity);
    execute format('create policy admin_read on public.%I for select to authenticated using ((select public.is_fleet_admin()))',entity);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_fleet_admin()))',entity);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_fleet_admin())) with check ((select public.is_fleet_admin()))',entity);
    if entity in ('expenses','revenue','revenue_payments','daily_accounts') then
      execute format('create policy admin_delete on public.%I for delete to authenticated using ((select public.is_fleet_admin()))',entity);
    end if;
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.log_fleet_change()',entity);
  end loop;
end $$;
create function public.showcase_fleet() returns table (registration text, name text, category text, photo text)
language sql stable security definer set search_path = '' as
$$ select registration, name, category, photo from public.buses
where visible and status='Active' and not exists(select 1 from public.fleet_transactions where kind='Sale' and bus=buses.registration)
order by (registration='KL05Z2113') desc, name, registration $$;
revoke all on function public.showcase_fleet() from public;
grant execute on function public.showcase_fleet() to anon, authenticated;
create function public.showcase_contact() returns text language sql stable security definer set search_path = '' as
$$ select contact_email from public.website_settings where id=1 $$;
revoke all on function public.showcase_contact() from public;
grant execute on function public.showcase_contact() to anon, authenticated;
insert into public.buses(registration,name,category,photo,visible) values
('KL05Z2113','Ayshu','TP','/fleet/ayshu.webp',true),('KL03P5108','Feemol','TP','/fleet/feemol.webp',true),
('KL08AL4545','Zaeem','TP','/fleet/zaeem.webp',true),('KL02Y0079','Bazooka','TP','/fleet/route.webp',true),
('KL55G7430','Bazooka','TP',null,true);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('fleet-photos','fleet-photos',true,12582912,array['image/jpeg','image/png','image/webp']),
('fleet-documents','fleet-documents',false,12582912,array['application/pdf','image/jpeg','image/png','image/webp']);
grant usage, select on all sequences in schema public to authenticated;
create policy admin_storage_insert on storage.objects for insert to authenticated
with check (bucket_id in ('fleet-photos','fleet-documents') and (select public.is_fleet_admin()));
create policy admin_storage_read on storage.objects for select to authenticated
using (bucket_id in ('fleet-photos','fleet-documents') and (select public.is_fleet_admin()));

