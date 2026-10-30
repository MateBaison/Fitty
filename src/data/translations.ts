import { z } from "zod";
import raw from "./legacy/translations.json";
import additions from "./ui-translations.json";
const uiTranslations: Record<string, Record<string, string>> = additions;
// Keep public authentication copy separate from the large generated UI catalog.
const authTranslations: Record<string, Record<string, string>> = {
  fr: { "Iniciar sesión": "Se connecter", "Correo electrónico": "Adresse e-mail", "Código del correo": "Code reçu par e-mail", "Conectando…": "Connexion…", "Verificar código": "Vérifier le code", "Enviar código": "Envoyer le code", "Cambiar correo o pedir otro código": "Changer d’adresse e-mail ou demander un nouveau code", "Continuar con Google": "Continuer avec Google", "Continuar con Apple": "Continuer avec Apple" },
  zh: { "Iniciar sesión": "登录", "Correo electrónico": "电子邮箱", "Código del correo": "邮箱验证码", "Conectando…": "正在连接…", "Verificar código": "验证代码", "Enviar código": "发送代码", "Cambiar correo o pedir otro código": "更换邮箱或重新获取验证码", "Continuar con Google": "使用 Google 继续", "Continuar con Apple": "使用 Apple 继续" },
  hi: { "Iniciar sesión": "साइन इन करें", "Correo electrónico": "ईमेल पता", "Código del correo": "ईमेल कोड", "Conectando…": "कनेक्ट हो रहा है…", "Verificar código": "कोड सत्यापित करें", "Enviar código": "कोड भेजें", "Cambiar correo o pedir otro código": "ईमेल बदलें या नया कोड माँगें", "Continuar con Google": "Google के साथ जारी रखें", "Continuar con Apple": "Apple के साथ जारी रखें" },
  ar: { "Iniciar sesión": "تسجيل الدخول", "Correo electrónico": "البريد الإلكتروني", "Código del correo": "رمز البريد الإلكتروني", "Conectando…": "جارٍ الاتصال…", "Verificar código": "تحقق من الرمز", "Enviar código": "إرسال الرمز", "Cambiar correo o pedir otro código": "تغيير البريد أو طلب رمز جديد", "Continuar con Google": "المتابعة باستخدام Google", "Continuar con Apple": "المتابعة باستخدام Apple" },
  de: { "Iniciar sesión": "Anmelden", "Correo electrónico": "E-Mail-Adresse", "Código del correo": "E-Mail-Code", "Conectando…": "Verbindung wird hergestellt…", "Verificar código": "Code bestätigen", "Enviar código": "Code senden", "Cambiar correo o pedir otro código": "E-Mail ändern oder neuen Code anfordern", "Continuar con Google": "Mit Google fortfahren", "Continuar con Apple": "Mit Apple fortfahren" },
  it: { "Iniciar sesión": "Accedi", "Correo electrónico": "Indirizzo e-mail", "Código del correo": "Codice e-mail", "Conectando…": "Connessione…", "Verificar código": "Verifica il codice", "Enviar código": "Invia il codice", "Cambiar correo o pedir otro código": "Cambia e-mail o richiedi un nuovo codice", "Continuar con Google": "Continua con Google", "Continuar con Apple": "Continua con Apple" },
  pt: { "Iniciar sesión": "Iniciar sessão", "Correo electrónico": "Endereço de e-mail", "Código del correo": "Código do e-mail", "Conectando…": "Conectando…", "Verificar código": "Verificar código", "Enviar código": "Enviar código", "Cambiar correo o pedir otro código": "Alterar e-mail ou pedir outro código", "Continuar con Google": "Continuar com o Google", "Continuar con Apple": "Continuar com a Apple" },
};
const translations = z
  .record(z.string(), z.record(z.string(), z.string()))
  .parse(raw);
export function translate(
  language: string,
  spanish: string,
  english: string,
): string {
  return language === "es"
    ? spanish
    : language === "en"
      ? english === spanish
        ? (uiTranslations.en?.[spanish] ?? english)
        : english
      : (authTranslations[language]?.[spanish] ??
        uiTranslations[language]?.[spanish] ??
        translations[language]?.[spanish] ??
        english);
}
export const languages = [
  "es",
  "en",
  "fr",
  "zh",
  "hi",
  "ar",
  "de",
  "it",
  "pt",
] as const;
export function textDirection(language: string): "rtl" | "ltr" {
  return language === "ar" ? "rtl" : "ltr";
}
export function localeFor(language?: string): string {
  return languages.some((known) => known === language) ? language! : "es";
}
