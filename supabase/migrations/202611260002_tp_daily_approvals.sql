create table public.tp_daily_approvals (
  session bigint not null references public.sessions(id) on delete cascade,
  date date not null,
  amount numeric(14,2) not null check (amount > 0),
  approved_at timestamptz not null default now(),
  primary key (session, date)
);

alter table public.tp_daily_approvals enable row level security;
grant select, insert, delete on public.tp_daily_approvals to authenticated;
create policy fleet_admin_approvals on public.tp_daily_approvals
  for all to authenticated using ((select public.is_fleet_admin()))
  with check ((select public.is_fleet_admin()));

create function public.validate_tp_daily_approval() returns trigger
language plpgsql set search_path = '' as $$
declare
  permit public.sessions%rowtype;
begin
  select * into permit from public.sessions where id = new.session for share;
  if not found or permit.status = 'Cancelled'
     or new.date not between permit.start_date and permit.end_date
     or new.date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'Approve a date within a non-cancelled TP session, up to today.';
  end if;
  return new;
end;
$$;
create trigger validate_tp_daily_approval before insert on public.tp_daily_approvals
  for each row execute function public.validate_tp_daily_approval();

create function public.protect_approved_tp_dates() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.tp_daily_approvals
    where session = old.id
      and (new.bus <> old.bus or date not between new.start_date and new.end_date)
  ) then
    raise exception 'Remove affected daily approvals before changing the bus or shortening the session.';
  end if;
  return new;
end;
$$;
create trigger protect_approved_tp_dates before update of bus, start_date, end_date on public.sessions
  for each row execute function public.protect_approved_tp_dates();

create trigger audit_tp_daily_approvals after insert or delete on public.tp_daily_approvals
  for each row execute function public.log_fleet_change();
