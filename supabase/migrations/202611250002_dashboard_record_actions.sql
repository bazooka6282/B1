insert into public.expense_categories (name, active, maintenance)
values ('Oil change', true, true)
on conflict (name) do nothing;

do $$
declare entity text;
begin
  foreach entity in array array['buses', 'sessions', 'routes', 'expense_categories', 'fleet_transactions', 'website_settings'] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = entity and policyname = 'admin_delete'
    ) then
      execute format(
        'create policy admin_delete on public.%I for delete to authenticated using ((select public.is_fleet_admin()))',
        entity
      );
    end if;
  end loop;
end $$;
