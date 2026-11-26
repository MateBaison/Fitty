-- Reference copy of the hosted `public` schema, taken on 2026-11-26.
-- Only for rebuilding an EMPTY Supabase project before restoring a backup
-- (docs/database-backup.md). Do not run it on the live project.

create table public."Fitty_State" (
  user_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint mrgymson_state_pkey primary key (user_id),
  constraint mrgymson_state_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
);

create table public.account_activity (
  user_id uuid not null,
  last_active_at timestamptz not null default now(),
  constraint account_activity_pkey primary key (user_id),
  constraint account_activity_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
);

alter table public."Fitty_State" enable row level security;
alter table public.account_activity enable row level security;

revoke all on public."Fitty_State", public.account_activity
  from anon, authenticated;
grant select, insert, update on public."Fitty_State" to authenticated;

create policy "Cada usuario lee sus datos" on public."Fitty_State"
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Cada usuario crea sus datos" on public."Fitty_State"
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Cada usuario actualiza sus datos" on public."Fitty_State"
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.record_app_activity()
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare account_id uuid := auth.uid();
begin
  if account_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.account_activity (user_id, last_active_at) values (account_id, now())
  on conflict (user_id) do update set last_active_at = excluded.last_active_at
  where account_activity.last_active_at <= now() - interval '5 minutes';
end;
$function$;

revoke execute on function public.record_app_activity() from public, anon;
grant execute on function public.record_app_activity() to authenticated;
