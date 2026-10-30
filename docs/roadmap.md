# Hoja de ruta de Fitty

Reúne el plan de lanzamiento (10/10/2026), las decisiones de producto (18/10/2026) y las ideas pendientes. Las ideas futuras no se implementan hasta que se pidan expresamente.

## Lanzamiento — estado al 30/10/2026

1. ✅ Nombre (Fitty) y dominio `fitty.uy` conectado a Vercel; `www` redirige al dominio principal.
2. ✅ Logo, ícono de app, paleta y nombre en la interfaz.
3. ✅ Correo de soporte `soporte@fitty.uy` (Zoho para entrada, Resend para avisos del formulario).
4. ✅ Cuentas de Apple Developer y Google Play Console creadas (Google pendiente de verificación).
5. ✅ App nativa iOS/Android con Expo en `apps/mobile`, con inicio de sesión por código, Google y Apple.
6. Probar en iPhones y Android reales con personas externas. Las cuentas personales nuevas de Google Play necesitan al menos 12 testers durante 14 días seguidos antes de pedir acceso a producción.
7. Preparar soporte, política de privacidad accesible, borrado de cuenta desde la app y las declaraciones de privacidad de las tiendas (fotos, recorridos GPS y datos menstruales opcionales).
8. Considerar Sign in with Apple nativo antes de enviar a la App Store (ver [mobile-app.md](mobile-app.md)).
9. Capturas, descripciones, categoría, clasificación por edad, acceso para revisores y builds firmados; enviar a revisión y lanzar.

Fuentes: https://developer.apple.com/app-store/review/, https://developer.apple.com/support/offering-account-deletion-in-your-app/, https://support.google.com/googleplay/android-developer/answer/6112435 y https://support.google.com/googleplay/android-developer/answer/14151465.

## Decisiones de producto

- Mantener el diseño actual de Inicio; sin rediseño personalizado ni recordatorios de entrenamiento por ahora.
- Días de entrenamiento sugeridos: 2 para principiantes o quienes vuelven, 3 para quienes entrenan seguido y 4 para experimentados, editables de 1 a 6. Son puntos de partida conservadores, no prescripciones clínicas. La OMS recomienda fortalecimiento muscular al menos dos días por semana (https://www.who.int/europe/news-room/fact-sheets/item/physical-activity).
- La rutina automática reutiliza el generador de selección de ejercicios; el objetivo es el elegido por la persona, no una programación clínica individualizada.

## Ideas futuras (no implementar sin pedido)

- **Entrenadores**: búsqueda de entrenadores y perfiles profesionales. Mantener cinco destinos inferiores (Inicio / Explorar / Herramientas / Progreso / Perfil), con Explorar dividido en Ejercicios y Entrenadores. El perfil de entrenador se crea dentro de Perfil, sin otra cuenta. Campos públicos posibles: foto, ubicación, modalidad, especialidades, idiomas, disponibilidad y contacto; nunca medidas, historial, recorridos GPS ni datos menstruales. Empezar por descubrimiento y contacto; reservas, pagos, chat y valoraciones después. Definir aprobación, verificación de credenciales y denuncias antes de mostrar perfiles verificados.
- Comparar estadísticas con otras personas, con participación voluntaria y elección de qué datos compartir.
- Asistente con IA para hacer consultas.
- Estimar calorías y macros a partir de una foto de comida, mostrando que es una estimación y permitiendo corregir alimentos y porciones.
- Integración con relojes y wearables.

## Mejoras para evaluar

- Esfuerzo percibido por serie (RPE o repeticiones en reserva).
- Registro breve de molestias por ejercicio, sin diagnósticos automáticos.
- Exportar un resumen de progreso que omita fotos, datos de contacto y registros menstruales.
- Recuperar un recorrido GPS interrumpido y separar estadísticas de cardio y fuerza.
- Guardar las fotos fuera del snapshot de la cuenta (Supabase Storage), para que cuentas con muchas fotos puedan sincronizar desde el móvil.
