# Copia de seguridad de la base de datos

El plan gratuito de Supabase no hace copias de seguridad. `scripts/backup-database.mjs` guarda una copia cifrada en esta Mac, en la carpeta `~/Fitty-copias`.

## Qué incluye

- Las cuentas (`auth.users`) y sus formas de ingreso (`auth.identities`).
- Los datos de cada cuenta (`public."Fitty_State"`), incluidas las fotos.
- La última actividad (`public.account_activity`) y el historial de migraciones.

No incluye la configuración del panel de Supabase (proveedores de Google y Apple, correos, URLs, secretos) ni la función `delete-account`, que está en `supabase/functions`. La estructura de las tablas está en [database-schema.sql](database-schema.sql).

## Primera vez

1. En <https://supabase.com/dashboard/account/tokens> creá una clave de acceso. Si el panel permite elegir permisos, dale solo lectura de la base de datos de este proyecto.
2. En la Terminal, dentro de la carpeta del proyecto:

```bash
node scripts/backup-database.mjs --weekly
```

3. Pegá la clave y elegí una contraseña de 12 caracteres o más. Las dos quedan en el Llavero de macOS.
4. **Anotá la contraseña fuera de la Mac.** Sin ella las copias no se pueden abrir.

`--weekly` hace una copia en el momento y programa una por semana (se revisa cada día a las 13:00 y al iniciar sesión). Sin `--weekly` solo hace una copia. Si una copia programada falla, aparece una notificación y el detalle queda en `~/Library/Logs/fitty-backup.log`.

## Uso

- Comprobar que la última copia se abre y cuántos registros tiene:

```bash
node scripts/backup-database.mjs --check
```

- Desactivar la copia semanal:

```bash
node scripts/backup-database.mjs --stop-weekly
```

Se conservan las copias de los últimos 60 días; las anteriores se borran después de guardar una nueva. Así los datos de una cuenta eliminada desaparecen también de las copias. Los archivos están cifrados, por lo que podés guardar una segunda copia en iCloud Drive o en un disco externo (respetando el mismo plazo).

## Restaurar

Restaurar es una operación delicada: pedí ayuda antes de hacerlo. Está pensado para un proyecto de Supabase **nuevo y vacío**, y todavía no se ensayó sobre uno.

1. En el editor SQL del proyecto nuevo, ejecutá `docs/database-schema.sql`.
2. Generá el archivo de restauración (pide la contraseña si no está en el Llavero):

```bash
node scripts/backup-database.mjs --restore-sql
```

3. Ejecutá ese archivo en el editor SQL y **borralo**: contiene los datos sin cifrar. No sobrescribe filas existentes.
4. Volvé a configurar los proveedores de ingreso, las URLs y la función `delete-account`, y actualizá las claves públicas en Vercel y en la app. Las apps ya instaladas apuntan al proyecto anterior: sin un dominio propio de Supabase hay que publicar una versión nueva.

Para recuperar los datos de **una sola cuenta** en el proyecto actual no ejecutes el archivo completo: abrí la copia con ayuda y restaurá solo esa fila.
