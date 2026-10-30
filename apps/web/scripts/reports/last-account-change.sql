-- Owner-only report: run in the Supabase dashboard SQL Editor, not a public API.
-- Last synchronized write, not last login or read-only app use.
-- Timestamp currently originates from the client device clock.
select
  u.email as correo,
  u.id as cuenta_id,
  s.updated_at as ultima_modificacion_guardada_utc,
  case when s.user_id is null then 'Sin datos sincronizados'
       else 'Con datos sincronizados' end as estado
from auth.users u
left join public."Fitty_State" s on s.user_id = u.id
order by s.updated_at desc nulls last, u.created_at desc;
