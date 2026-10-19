begin;
create table if not exists public.account_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_active_at timestamptz not null default now()
);
alter table public.account_activity enable row level security;
revoke all on public.account_activity from public, anon, authenticated;
-- No read policies: account activity is visible only to the dashboard administrator.
create or replace function public.record_app_activity()
returns void language plpgsql security definer set search_path = '' as $$
declare account_id uuid := auth.uid();
begin
  if account_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.account_activity (user_id, last_active_at) values (account_id, now())
  on conflict (user_id) do update set last_active_at = excluded.last_active_at
  where account_activity.last_active_at <= now() - interval '5 minutes';
end;
$$;
revoke all on function public.record_app_activity() from public, anon, authenticated;
grant execute on function public.record_app_activity() to authenticated;
commit;
