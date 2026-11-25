alter table public.tp_daily_approvals
  add column skip_reason text,
  drop constraint tp_daily_approvals_amount_check,
  add constraint tp_daily_approvals_amount_and_reason_check check (
    (skip_reason is null and amount > 0)
    or (skip_reason is not null and skip_reason in ('Leave', 'Vehicle breakdown', 'No payment') and amount = 0)
  );
