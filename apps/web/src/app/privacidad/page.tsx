import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos usa Fitty, para qué y cómo podés controlarlos.",
};

const updated = "31 de octubre de 2026";
const contact = "soporte@fitty.uy";

type Section = { title: string; body: string[] };
const content: Record<
  "es" | "en",
  { heading: string; updated: string; intro: string; sections: Section[] }
> = {
  es: {
    heading: "Política de privacidad",
    updated: `Última actualización: ${updated}`,
    intro:
      "Fitty es una aplicación para registrar entrenamientos, rutinas y progreso físico, disponible en fitty.uy y como app para iPhone y Android. Esta política explica qué datos tratamos y qué control tenés sobre ellos.",
    sections: [
      {
        title: "Datos que recopilamos",
        body: [
          "Cuenta: tu correo electrónico, o el identificador y correo que nos entrega Google o Apple si iniciás sesión con ellos.",
          "Perfil: nombre, foto, fecha de nacimiento, género, altura, peso, experiencia y objetivos de entrenamiento, idioma y unidades que elijas.",
          "Entrenamiento: rutinas, ejercicios, series, repeticiones, pesos, notas, fotos de entrenamientos y medidas corporales.",
          "Recorridos GPS: si usás el seguimiento de recorridos, la ubicación se obtiene solo mientras la app está abierta y se guarda como parte de tu registro. No usamos ubicación en segundo plano.",
          "Calendario menstrual (opcional): solo si lo activás; son datos de salud que tratamos con especial cuidado.",
          "Soporte: el mensaje y el correo que nos envíes desde el formulario de ayuda.",
        ],
      },
      {
        title: "Para qué los usamos",
        body: [
          "Para mostrarte tu historial, estadísticas y rutinas, y mantenerlos sincronizados entre tus dispositivos.",
          "Para iniciar sesión de forma segura y proteger tu cuenta.",
          "Para responder tus consultas de soporte.",
          "No vendemos tus datos, no mostramos publicidad y no usamos tus datos para crear perfiles publicitarios ni para entrenar modelos de inteligencia artificial.",
        ],
      },
      {
        title: "Dónde se guardan y quién los procesa",
        body: [
          "Tus datos se guardan en Supabase (base de datos y autenticación). El sitio se aloja en Vercel. Los avisos del formulario de soporte se envían con Resend y el correo de soporte se recibe con Zoho.",
          "Estos proveedores tratan los datos solo para prestar el servicio y pueden operar servidores fuera de Uruguay.",
          "También guardamos una copia local en tu dispositivo para que la app funcione sin conexión.",
        ],
      },
      {
        title: "Qué compartimos",
        body: [
          "Solo compartís algo si vos lo decidís, por ejemplo al compartir una rutina o un póster de entrenamiento. Esos contenidos no incluyen tu perfil privado, peso corporal, fotos ni notas.",
          "Podemos revelar datos si una ley o una autoridad competente lo exige.",
        ],
      },
      {
        title: "Cuánto tiempo los conservamos",
        body: [
          "Conservamos tus datos mientras tu cuenta exista. Cuando la eliminás, borramos tu cuenta y tus registros del servicio.",
          "Las copias locales de tus otros dispositivos y las exportaciones que hayas descargado quedan bajo tu control; borralas por tu cuenta si ya no las querés.",
        ],
      },
      {
        title: "Tus derechos y cómo ejercerlos",
        body: [
          "Acceso y copia: en Perfil podés exportar todos tus datos.",
          "Corrección: podés editar tu perfil y tus registros en cualquier momento.",
          "Eliminación: en Perfil > Configuración > Eliminar cuenta borrás tu cuenta y tus datos de forma permanente, tanto en la web como en la app.",
          "Podés escribirnos a soporte@fitty.uy para consultas sobre tus datos. En Uruguay también podés acudir a la Unidad Reguladora y de Control de Datos Personales (URCDP).",
        ],
      },
      {
        title: "Seguridad",
        body: [
          "Usamos conexiones cifradas y controles de acceso para que solo vos puedas leer los datos de tu cuenta. Ningún sistema es completamente infalible, por eso te recomendamos proteger tu dispositivo y tu correo.",
        ],
      },
      {
        title: "Menores",
        body: [
          "Fitty no está dirigida a menores de 14 años y no recopilamos datos de ellos de forma intencional. Si creés que un menor se registró, escribinos para eliminar la cuenta.",
        ],
      },
      {
        title: "Cambios y contacto",
        body: [
          "Si cambiamos esta política publicaremos la nueva versión en esta página con su fecha. Para cualquier duda escribinos a soporte@fitty.uy.",
          "Aviso: Fitty registra información de entrenamiento y no brinda consejos médicos.",
        ],
      },
    ],
  },
  en: {
    heading: "Privacy policy",
    updated: "Last updated: October 31, 2026",
    intro:
      "Fitty is an app for logging workouts, routines and physical progress, available at fitty.uy and as an iPhone and Android app. This policy explains what data we handle and the control you have over it.",
    sections: [
      {
        title: "Data we collect",
        body: [
          "Account: your email address, or the identifier and email Google or Apple give us if you sign in with them.",
          "Profile: name, photo, date of birth, gender, height, weight, training experience and goals, and the language and units you choose.",
          "Training: routines, exercises, sets, repetitions, weights, notes, workout photos and body measurements.",
          "GPS routes: if you use route tracking, location is read only while the app is open and is saved as part of your record. We do not use background location.",
          "Menstrual calendar (optional): only if you turn it on; this is health data and we treat it with extra care.",
          "Support: the message and email you send through the help form.",
        ],
      },
      {
        title: "How we use it",
        body: [
          "To show your history, statistics and routines, and keep them in sync across your devices.",
          "To sign you in securely and protect your account.",
          "To answer your support requests.",
          "We do not sell your data, show ads, build advertising profiles or use your data to train artificial intelligence models.",
        ],
      },
      {
        title: "Where it is stored and who processes it",
        body: [
          "Your data is stored in Supabase (database and authentication). The site is hosted on Vercel. Support form notices are sent with Resend and the support inbox is received with Zoho.",
          "These providers process data only to provide the service and may operate servers outside Uruguay.",
          "We also keep a local copy on your device so the app works offline.",
        ],
      },
      {
        title: "What we share",
        body: [
          "You only share something if you choose to, for example when sharing a routine or a workout poster. Those items do not include your private profile, body weight, photos or notes.",
          "We may disclose data if required by law or by a competent authority.",
        ],
      },
      {
        title: "How long we keep it",
        body: [
          "We keep your data while your account exists. When you delete it, we remove your account and records from the service.",
          "Local copies on your other devices and exports you downloaded stay under your control; delete them yourself if you no longer want them.",
        ],
      },
      {
        title: "Your rights and how to use them",
        body: [
          "Access and copy: in Profile you can export all your data.",
          "Correction: you can edit your profile and records at any time.",
          "Deletion: in Profile > Settings > Delete account you permanently delete your account and data, on both the web and the app.",
          "You can write to soporte@fitty.uy about your data. In Uruguay you can also contact the Personal Data Regulatory and Control Unit (URCDP).",
        ],
      },
      {
        title: "Security",
        body: [
          "We use encrypted connections and access controls so only you can read your account data. No system is completely infallible, so we recommend protecting your device and your email.",
        ],
      },
      {
        title: "Children",
        body: [
          "Fitty is not directed to children under 14 and we do not knowingly collect their data. If you believe a child signed up, write to us and we will delete the account.",
        ],
      },
      {
        title: "Changes and contact",
        body: [
          "If we change this policy we will publish the new version on this page with its date. For any question write to soporte@fitty.uy.",
          "Notice: Fitty records training information and does not provide medical advice.",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[760px] space-y-12 p-6 pb-16">
      <nav className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/home" className="text-primary underline">
          Fitty
        </Link>
        <a href="#es" className="underline">
          Español
        </a>
        <a href="#en" className="underline">
          English
        </a>
        <a href={`mailto:${contact}`} className="underline">
          {contact}
        </a>
      </nav>
      {(["es", "en"] as const).map((language) => {
        const page = content[language];
        return (
          <article
            key={language}
            id={language}
            lang={language}
            className="space-y-6"
          >
            <header className="space-y-2">
              <h1 className="text-3xl font-bold">{page.heading}</h1>
              <p className="text-sm text-muted-foreground">{page.updated}</p>
              <p>{page.intro}</p>
            </header>
            {page.sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <ul className="list-disc space-y-2 pl-5">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </article>
        );
      })}
    </main>
  );
}
