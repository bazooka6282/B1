alter table public.expenses
  drop constraint expenses_session_bus_fkey,
  add constraint expenses_session_bus_fkey
    foreign key (session, bus) references public.sessions(id, bus)
    on delete set null (session);
