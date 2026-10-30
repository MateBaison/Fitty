-- Administrator only: run in Supabase SQL Editor. No public view/API is created.
select u.email as correo, u.id as cuenta_id, u.created_at as registro_utc,
       u.last_sign_in_at as ultimo_inicio_de_sesion_utc,
       a.last_active_at as ultima_actividad_utc
from auth.users u
left join public.account_activity a on a.user_id = u.id
order by a.last_active_at desc nulls last;
