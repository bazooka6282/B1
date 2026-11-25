alter table public.tp_daily_approvals
  drop constraint tp_daily_approvals_amount_and_reason_check,
  add constraint tp_daily_approvals_amount_and_reason_check check (
    (skip_reason is null and amount > 0)
    or (skip_reason is not null and skip_reason in ('Leave', 'Vehicle breakdown', 'No payment', 'Declined') and amount = 0)
  );

grant update (amount, skip_reason) on public.tp_daily_approvals to authenticated;

create or replace function public.validate_tp_daily_approval() returns trigger
language plpgsql set search_path = '' as $$
declare
  permit public.sessions%rowtype;
begin
  select * into permit from public.sessions where id = new.session for share;
  if not found or permit.status = 'Cancelled'
     or new.date not between permit.start_date and permit.end_date then
    raise exception 'Choose a day within a non-cancelled TP session.';
  end if;
  if new.date > (now() at time zone 'Asia/Kolkata')::date
     and new.skip_reason is distinct from 'Declined' then
    raise exception 'Future days can only be marked as declined.';
  end if;
  return new;
end;
$$;

drop trigger validate_tp_daily_approval on public.tp_daily_approvals;
create trigger validate_tp_daily_approval before insert or update on public.tp_daily_approvals
  for each row execute function public.validate_tp_daily_approval();

drop trigger audit_tp_daily_approvals on public.tp_daily_approvals;
create trigger audit_tp_daily_approvals after insert or update or delete on public.tp_daily_approvals
  for each row execute function public.log_fleet_change();
